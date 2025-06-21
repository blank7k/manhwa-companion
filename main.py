from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import json
import os
from fastapi import Query
from fastapi import Body
import requests
from openai import OpenAI
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

# Init OpenAI client
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

# Create FastAPI app
app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class RecommendRequest(BaseModel):
    moods: List[str]

class SummarizeRequest(BaseModel):
    title: str
    summary: str

# Add to top of main.py
def get_genre_summary_from_mangadex(title):
    url = "https://api.mangadex.org/manga"
    params = {
        "title": title,
        "limit": 1,
        "includes[]": ["cover_art", "tags"]
    }

    response = requests.get(url, params=params)
    response.raise_for_status()

    data = response.json().get("data", [])
    if not data:
        return [], ""

    manga = data[0]
    genre_tags = []
    for rel in manga["relationships"]:
        if rel["type"] == "tag":
            genre_tags.append(rel["attributes"]["name"]["en"].lower())

    summary = manga["attributes"]["description"].get("en", "").lower()
    return genre_tags, summary


# Recommend endpoint
@app.post("/recommend")
def recommend(req: RecommendRequest):
    with open("manhwa_db.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    moods = [m.lower() for m in req.moods]

    def score(item):
        tags = [g.lower() for g in item.get("genre", [])]
        count = 0
        for mood in moods:
            for tag in tags:
                if mood in tag or tag in mood:
                    count += 1
        return count

    top = sorted(data, key=score, reverse=True)
    return {"recommendations": top[:3]}


# Summarize endpoint
@app.post("/summarize")
def summarize(req: SummarizeRequest):
    prompt = (
        f"Summarize the manhwa '{req.title}' and give mood tags.\n"
        f"Summary: {req.summary}\n\n"
        f"Return simple summary and a list of mood tags."
    )

    res = client.chat.completions.create(
        model="deepseek/deepseek-r1-0528-qwen3-8b:free",
        messages=[{"role": "user", "content": prompt}],
        extra_headers={
            "HTTP-Referer": "https://your-site.com",
            "X-Title": "MyManhwaCompanion"
        }
    )

    return res.choices[0].message


# Serve all manhwa for homepage
@app.get("/all-manhwa")
def get_all_manhwa():
    try:
        with open("manhwa_db.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        return {"data": data}
    except Exception as e:
        return {"error": str(e)}


# Serve topall manhwa (from mangabtt.json)
@app.get("/top-all")
def get_top_all():
    try:
        with open("manga_top_all.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        return {"data": data}
    except Exception as e:
        return {"error": str(e)}






@app.get("/mangadex-search")
def search_manga(title: str = Query(...)):
    url = "https://api.mangadex.org/manga"
    params = {
        "title": title,
        "limit": 1,
        "includes[]": ["cover_art", "tags"]
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        results = response.json().get("data", [])
        if not results:
            return {"error": "No results found."}

        manga = results[0]
        manga_id = manga["id"]
        attributes = manga["attributes"]
        description = attributes["description"].get("en", "No description.")
        title_en = attributes["title"].get("en", list(attributes["title"].values())[0])
        genre = [tag["attributes"]["name"]["en"] for tag in manga["relationships"] if tag["type"] == "tag"]

        # ✅ Get cover image filename
        cover_filename = ""
        for rel in manga["relationships"]:
            if rel["type"] == "cover_art":
                cover_filename = rel["attributes"]["fileName"]
                break
        image_url = f"https://uploads.mangadex.org/covers/{manga_id}/{cover_filename}" if cover_filename else ""

        return {
            "title": title_en,
            "summary": description,
            "genre": genre,
            "image": image_url  # ✅ return image
        }

    except Exception as e:
        return {"error": str(e)}


@app.get("/mangadex-suggestions")
def get_suggestions(title: str = Query(...)):
    url = "https://api.mangadex.org/manga"
    params = {
        "title": title,
        "limit": 5,
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json().get("data", [])
        titles = []

        for manga in data:
            title_data = manga["attributes"]["title"]
            titles.append(title_data.get("en") or list(title_data.values())[0])

        return {"suggestions": titles}
    except Exception as e:
        return {"error": str(e)}






class TitleRecommendationRequest(BaseModel):
    title: str
    summary: str



@app.post("/recommend-title")
def recommend_from_title(req: TitleRecommendationRequest):
    try:
        with open("manga_top_all.json", "r", encoding="utf-8") as f:
            db1 = json.load(f)
        with open("manhwa_db.json", "r", encoding="utf-8") as f:
            db2 = json.load(f)
        all_data = db1 + db2

        # 1. Try full match (title + summary + genre)
        genres, summary_api = get_genre_summary_from_mangadex(req.title)
        summary_api = summary_api.lower()
        summary_words = set(summary_api.split())
        title_lower = req.title.lower()

        def strong_score(item):
            item_genres = [g.lower() for g in item.get("genre", [])]
            item_summary = item.get("summary", "").lower()
            item_title = item.get("title", "").lower()
            summary_overlap = len(set(item_summary.split()) & summary_words)
            genre_overlap = len(set(item_genres) & set(genres))
            title_match = title_lower in item_title or item_title in title_lower
            return (3 * title_match) + (2 * genre_overlap) + (0.5 * summary_overlap)

        top_strong = sorted(all_data, key=strong_score, reverse=True)
        best_strong = [item for item in top_strong if strong_score(item) > 2]

        if best_strong:
            return {"recommendations": format_recommendations(best_strong), "fallback": False}

        # 2. Try moderate match (title + genre)
        def mid_score(item):
            item_genres = [g.lower() for g in item.get("genre", [])]
            item_title = item.get("title", "").lower()
            genre_overlap = len(set(item_genres) & set(genres))
            title_match = title_lower in item_title or item_title in title_lower
            return (3 * title_match) + (2 * genre_overlap)

        top_mid = sorted(all_data, key=mid_score, reverse=True)
        best_mid = [item for item in top_mid if mid_score(item) > 2]

        if best_mid:
            return {"recommendations": format_recommendations(best_mid), "fallback": False}

        # 3. Try loose match (genre only)
        def genre_only_score(item):
            item_genres = [g.lower() for g in item.get("genre", [])]
            return len(set(item_genres) & set(genres))

        top_genre = sorted(all_data, key=genre_only_score, reverse=True)
        best_genre = [item for item in top_genre if genre_only_score(item) >= 2]

        if best_genre:
            return {"recommendations": format_recommendations(best_genre), "fallback": False}

        # 4. Fallback: return anything from JSON files with at least 2 genre matches
        def fallback_score(item):
            item_genres = [g.lower() for g in item.get("genre", [])]
            return len(set(item_genres) & set(genres))

        top_fallback = sorted(all_data, key=fallback_score, reverse=True)
        final = [item for item in top_fallback if fallback_score(item) >= 3]

        return {"recommendations": format_recommendations(final), "fallback": True}

    except Exception as err:
        return {"error": f"Failed to generate recommendations: {err}"}


def format_recommendations(items):
    return [
        {
            "title": item.get("title", ""),
            "summary": item.get("summary", ""),
            "genre": item.get("genre", []),
            "chapter": item.get("chapter", ""),
            "image": item.get("image", "")
        }
        for item in items[:5]
    ]

