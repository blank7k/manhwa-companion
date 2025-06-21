import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./HomePage.css";

const TitleRecommendation = () => {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [likedManhwa, setLikedManhwa] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "likes", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) setLikedManhwa(snap.data().items || []);
      } else {
        const guestId = localStorage.getItem("guestId");
        if (guestId) {
          const guestLikes = JSON.parse(localStorage.getItem(`likes_${guestId}`)) || [];
          setLikedManhwa(guestLikes);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const isLiked = (title) => likedManhwa.some((item) => item.title === title);

  const toggleLike = async (manhwa) => {
    const user = auth.currentUser;
    let updatedLikes;

    if (user) {
      const docRef = doc(db, "likes", user.uid);
      const docSnap = await getDoc(docRef);
      const existingLikes = docSnap.exists() ? docSnap.data().items || [] : [];
      const exists = existingLikes.find((item) => item.title === manhwa.title);
      updatedLikes = exists
        ? existingLikes.filter((item) => item.title !== manhwa.title)
        : [...existingLikes, manhwa];
      await setDoc(docRef, { items: updatedLikes });
    } else {
      const guestId = localStorage.getItem("guestId");
      if (!guestId) return;
      const key = `likes_${guestId}`;
      const existing = JSON.parse(localStorage.getItem(key)) || [];
      const exists = existing.find((item) => item.title === manhwa.title);
      updatedLikes = exists
        ? existing.filter((item) => item.title !== manhwa.title)
        : [...existing, manhwa];
      localStorage.setItem(key, JSON.stringify(updatedLikes));
    }
    setLikedManhwa(updatedLikes);
  };

  const handleCardClick = (manhwa) => {
    navigate(`/manhwa/${encodeURIComponent(manhwa.title)}`, {
      state: { manhwa },
    });
  };

  const handleChange = async (e) => {
    const input = e.target.value;
    setTitle(input);

    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8000/mangadex-suggestions?title=${encodeURIComponent(
          input
        )}`
      );
      const data = await res.json();

      if (data.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Suggestion fetch error:", err);
      setSuggestions([]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setError("");
    setRecommendations([]);
    setSuggestions([]); // clear suggestions when submitting

    try {
      const res = await fetch("http://localhost:8000/recommend-title", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, summary }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.fallback) {
        setError("⚠️ No strong match found. Showing closest recommendations.");
      }

      setRecommendations(data.recommendations);
    } catch (err) {
      console.error("Recommendation error:", err);
      setError("❌ Could not fetch recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homepage-container" style={{ position: "relative" }}>
      <h2>🔎 Title-Based Recommendations</h2>

      <div style={{ position: "relative", width: "300px" }}>
        <input
          type="text"
          placeholder="Enter title..."
          value={title}
          onChange={handleChange}
          style={{ padding: "8px", width: "100%" }}
        />

        {suggestions.length > 0 && (
          <ul
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "white",
              color: "black",
              listStyle: "none",
              padding: "0",
              margin: "0",
              border: "1px solid #ccc",
              zIndex: 9999,
              maxHeight: "200px",
              overflowY: "auto",
              borderRadius: "4px",
            }}
          >
            {suggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => {
                  setTitle(s);
                  setSuggestions([]);
                }}
                style={{
                  padding: "8px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      <textarea
        placeholder="Optional: enter short summary"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={3}
        style={{
          display: "block",
          marginTop: "10px",
          width: "90%",
          padding: "8px",
        }}
      />

      <button
        onClick={handleSubmit}
        style={{ marginTop: "10px", padding: "8px 16px" }}
      >
        🔍 Recommend
      </button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="manhwa-list">
        {recommendations.map((manhwa, i) => (
          <div
            className="manhwa-card"
            key={i}
            onClick={() => handleCardClick(manhwa)}
          >
            {manhwa.image && (
              <img
                src={manhwa.image}
                alt={manhwa.title}
                className="manhwa-cover"
              />
            )}
            <h3>{manhwa.title}</h3>
            <div className="card-footer">
              <p>
                {manhwa.chapter && (
                  <>
                    <strong>Chapter:</strong> {manhwa.chapter}
                  </>
                )}
              </p>
              <button
                className="like-button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(manhwa);
                }}
              >
                {isLiked(manhwa.title) ? "❤️" : "🤍"}
              </button>
            </div>
            <div className="moods">
              {(manhwa.genre || []).map((tag, j) => (
                <span key={j} className="mood-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TitleRecommendation;
