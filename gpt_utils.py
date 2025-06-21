# gpt_utils.py
from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()
API_KEY = os.getenv("OPENROUTER_API_KEY")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=API_KEY,
)

def summarize_with_gpt(title: str, summary: str) -> str | None:
    prompt = (
        f"Title: {title}\n\n"
        f"Original Summary: {summary}\n\n"
        f"Task:\n"
        "- Rewrite the summary in 2-3 simplified lines\n"
        "- Identify 3–5 mood tags (e.g., revenge, wholesome, romance)\n\n"
        "Return ONLY in this exact JSON format, no extra explanation:\n"
        "{\n"
        "  \"simplified_summary\": \"...\",\n"
        "  \"moods\": [\"...\", \"...\", \"...\"]\n"
        "}"
    )

    try:
        response = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "https://your-site.com",
                "X-Title": "MyManhwaCompanion",
            },
            model="deepseek/deepseek-r1-0528-qwen3-8b:free",
            messages=[{"role": "user", "content": prompt}]
        )
        raw_output = response.choices[0].message.content.strip()

        try:
            parsed = json.loads(raw_output)
            return json.dumps(parsed)
        except json.JSONDecodeError:
            print(f"⚠️ GPT output not valid JSON. Raw output:\n{raw_output}\n")
            return None

    except Exception as e:
        print(f"❌ GPT call failed: {e}")
        return None
