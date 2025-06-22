import requests
from bs4 import BeautifulSoup
import json
import time

def fetch_mangadex_summary_and_image(title):
    print(f"📘 Fetching from MangaDex for: {title}")
    try:
        # First, search for the manga to get its ID
        search_url = "https://api.mangadex.org/manga"
        search_params = {"title": title, "limit": 1, "includes[]": ["cover_art"]}
        search_res = requests.get(search_url, params=search_params, timeout=15)
        search_res.raise_for_status()
        
        search_data = search_res.json().get("data", [])
        if not search_data:
            print(f"⚠️ No result found on MangaDex for '{title}'")
            return {"summary": "", "image": ""}

        manga = search_data[0]
        manga_id = manga["id"]
        attributes = manga["attributes"]
        summary = attributes.get("description", {}).get("en", "No summary available.").strip()

        # Find the cover art relationship
        cover_art_relationship = next((rel for rel in manga.get("relationships", []) if rel.get("type") == "cover_art"), None)
        
        if not cover_art_relationship:
            print(f"⚠️ No cover art relationship found for '{title}'")
            return {"summary": summary, "image": ""}

        cover_filename = cover_art_relationship.get("attributes", {}).get("fileName")
        if not cover_filename:
            print(f"⚠️ Cover art filename not found for '{title}'")
            return {"summary": summary, "image": ""}

        image_url = f"https://uploads.mangadex.org/covers/{manga_id}/{cover_filename}"
        print(f"✅ Found image for '{title}': {image_url}")
        return {"summary": summary, "image": image_url}

    except requests.exceptions.RequestException as e:
        print(f"❌ MangaDex request failed for '{title}': {e}")
        return {"summary": "Error fetching summary.", "image": ""}
    except Exception as e:
        print(f"💥 An unexpected error occurred while fetching MangaDex data for '{title}': {e}")
        return {"summary": "Error fetching summary.", "image": ""}

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
