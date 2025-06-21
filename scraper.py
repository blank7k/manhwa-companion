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
        attributes = manga["attributes"]
        summary = attributes.get("description", {}).get("en", "").strip()

        # ✅ Cover image
        manga_id = manga["id"]
        cover_filename = ""
        for rel in manga.get("relationships", []):
            if rel.get("type") == "cover_art":
                cover_filename = rel.get("attributes", {}).get("fileName")
                break

        image = f"https://uploads.mangadex.org/covers/{manga_id}/{cover_filename}" if cover_filename else ""

        return {"summary": summary, "image": image}

    except Exception as e:
        print(f"⚠️ MangaDex fetch failed for '{title}': {e}")
        return {"summary": "", "image": ""}

def scrape_manhwaclan():
    base_url = "https://manhwaclan.com/manga/page/{}/"
    all_data = []
    headers = {"User-Agent": "Mozilla/5.0"}

    for page in range(1, 6):
        url = base_url.format(page)
        print(f"🔍 Scraping: {url}")

        try:
            res = requests.get(url, headers=headers, timeout=10)
            res.raise_for_status()
        except requests.RequestException as e:
            print(f"❌ Failed to fetch {url}: {e}")
            continue

        soup = BeautifulSoup(res.text, "html.parser")
        cards = soup.select("div.page-item-detail.manga")

        for card in cards:
            try:
                title_tag = card.select_one("h3.h5 a")
                title = title_tag.text.strip()
                link = title_tag["href"]
                chapter_tag = card.select_one(".chapter a")
                chapter = chapter_tag.text.strip() if chapter_tag else "N/A"

                # ✅ Get genre from ManhwaClan detail page
                detail_res = requests.get(link, headers=headers, timeout=10)
                detail_soup = BeautifulSoup(detail_res.text, "html.parser")

                genre_block = detail_soup.select_one(
                    ".post-content_item:has(.summary-heading:-soup-contains('Genre')) .summary-content"
                )
                genres = [g.text.strip() for g in genre_block.select("a")] if genre_block else []

                # ✅ Get summary + image from MangaDex
                print(f"📘 Fetching from MangaDex: {title}")
                mangadex_data = fetch_mangadex_summary_and_image(title)
                time.sleep(1)

                all_data.append({
                    "title": title,
                    "chapter": chapter,
                    "genre": genres,  # ✅ from ManhwaClan
                    "summary": mangadex_data["summary"],  # ✅ from MangaDex
                    "image": mangadex_data["image"],      # ✅ from MangaDex
                    "moods": []
                })

            except Exception as e:
                print(f"⚠️ Error parsing card: {e}")

    if all_data:
        with open("manhwa_db.json", "w", encoding="utf-8") as f:
            json.dump(all_data, f, indent=2, ensure_ascii=False)
        print(f"✅ Scraped {len(all_data)} titles and saved to manhwa_db.json")
    else:
        print("❌ No data scraped.")

if __name__ == "__main__":
    scrape_manhwaclan()
