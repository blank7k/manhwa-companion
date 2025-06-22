import requests
from bs4 import BeautifulSoup
import json
import time

def fetch_mangadex_summary_and_image(title):
    try:
        res = requests.get(
            "https://api.mangadex.org/manga",
            params={"title": title, "limit": 1, "includes[]": ["cover_art"]},
            timeout=10
        )
        res.raise_for_status()
        data = res.json().get("data", [])
        if not data:
            return {"summary": "", "image": ""}

        manga = data[0]
        manga_id = manga["id"]
        attributes = manga["attributes"]
        summary = attributes["description"].get("en", "").strip()

        cover_filename = ""
        for rel in manga["relationships"]:
            if rel["type"] == "cover_art":
                cover_filename = rel["attributes"]["fileName"]
                break
        cover_url = f"https://uploads.mangadex.org/covers/{manga_id}/{cover_filename}" if cover_filename else ""

        return {
            "summary": summary or "",
            "image": cover_url
        }

    except Exception as e:
        print(f"❌ MangaDex fetch failed for '{title}': {e}")
        return {"summary": "", "image": ""}

def scrape_mangabtt_top_all():
    url = "https://manhwabtt.cc/find-story?status=-1&sort=10"
    headers = {"User-Agent": "Mozilla/5.0"}
    all_data = []

    try:
        res = requests.get(url, headers=headers)
        res.raise_for_status()
    except requests.RequestException as e:
        print(f"❌ Failed to fetch: {e}")
        return

    soup = BeautifulSoup(res.text, "html.parser")
    cards = soup.select("div.item")

    for card in cards:
        try:
            title_tag = card.select_one("figcaption h3 a")
            title = title_tag.text.strip()
            chapter_tag = card.select_one("figcaption ul li.chapter a")
            chapter = chapter_tag.text.strip() if chapter_tag else "N/A"

            tooltip_id = title_tag.get("data-jtip", "").replace("#", "")
            tooltip_div = soup.find("div", id=tooltip_id)

            genre_text = ""
            if tooltip_div:
                genre_line = tooltip_div.select_one(".message_main p")
                if genre_line and "Genre:" in genre_line.text:
                    genre_text = genre_line.text.split("Genre:")[-1].strip()

            genres = [g.strip() for g in genre_text.split(",")] if genre_text else []

            print(f"📘 Fetching: {title}")
            extra = fetch_mangadex_summary_and_image(title)
            time.sleep(1)

            all_data.append({
                "title": title,
                "chapter": chapter,
                "genre": genres,
                "summary": extra["summary"],
                "image": extra["image"]
            })

        except Exception as e:
            print(f"⚠️ Error parsing a card: {e}")

    if all_data:
        with open("manga_top_all.json", "w", encoding="utf-8") as f:
            json.dump(all_data, f, indent=2, ensure_ascii=False)
        print(f"✅ Scraped {len(all_data)} manhwa and saved to manga_top_all.json")
    else:
        print("❌ No manhwa scraped. Preserving old manga_top_all.json.")

if __name__ == "__main__":
    scrape_mangabtt_top_all()
