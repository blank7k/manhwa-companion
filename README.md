# 🌟 Manhwa Companion

> Your personalized hub for discovering, tracking, and enjoying manhwa — powered by AI and updated in real-time.

---

## 📌 Features

### 🔍 Home Page

* **Today's Updates**: Freshly scraped manhwa (title, chapter, image, genres).
* **Top All**: Popular manhwa curated from top sources like MangaBTT.
* **Your Updates**: Get alerts when new chapters are available for your liked manhwa.

### 🤖 AI Recommendations

* **By Mood/Genre**: Get manhwa suggestions tailored to your mood.
* **By Title**: Enter a title, and our AI recommends similar manhwa.


### 🔐 Auth & User Features

* **Guest Mode**: Browse and like without logging in (saved in `localStorage`).
* **Google/Email Login**: Sync likes and history across devices via Firebase.
* **Firestore Integration**: All likes and updates are stored per user.

### 🛠️ Tech Stack

| Layer      | Tech Stack                           |
| ---------- | ------------------------------------ |
| Frontend   | React + Tailwind CSS                 |
| Backend    | FastAPI                              |
| Scraping   | Python (BeautifulSoup + APIs)        |
| Auth & DB  | Firebase (Auth + Firestore)          |
| Deployment | Vercel (Frontend) + Render (Backend) |

---

## 🚀 Getting Started (Local)

### 🖥 Frontend Setup

```bash
cd frontend
npm install
npm start
```

### 🧠 Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Make sure your scraping scripts (`scraper.py`, `manga_scraper.py`) are up-to-date and run before starting.

---

## 📡 Deployment

* **Frontend**: Deployed on [Vercel](https://vercel.com/)
* **Backend API**: Hosted on [Render](https://render.com/)
* **Firebase**: Handles authentication and user-specific Firestore data

---

## 🧩 Key Files & Structure

```
manhwa-companion/
├── backend/
│   ├── main.py             # FastAPI server with endpoints
│   ├── scraper.py          # Scrapes daily updates
│   ├── manga_scraper.py    # Scrapes "Top All" section
│   ├── manhwa_db.json      # Stores latest scraped manhwa
│   └── manga_top_all.json  # Stores top manhwa
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── firebase.js     # Firebase config & Firestore setup
│   │   └── App.js          # Routes & Main UI
```

---



---

## 📝 To-Do / Roadmap

* [ ] Reading progress tracking
* [ ] Notifications for new chapters
* [ ] Public user profiles or forums

---

## 🤝 Contributions

Open to PRs and suggestions! If you want to help improve the scraper, UI, or add more data sources, feel free to fork and contribute.

---

## ⚠️ Disclaimer

This app is for educational/demo purposes. We respect the content creators and platforms. No actual manga/manhwa reading is hosted on our servers. All content is fetched only for recommendation and update tracking.

---

## 📬 Contact

Built with ❤️ by Rohit Prasad
- **Instagram**: [@rohit.7k1](https://www.instagram.com/rohit.7k1/)
- **GitHub**: [@blank7k](https://github.com/blank7k)
- **Email**: rohitprasad3493@student.sfit.ac.in
