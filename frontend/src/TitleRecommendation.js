import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./HomePage.css";
import "./TitleRecommendation.css";
import { getSuggestions, getTitleRecommendations } from './api';
import { debounce } from 'lodash';

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

  // Debounced fetch for suggestions
  const debouncedFetchSuggestions = useCallback(
    debounce(async (query) => {
      if (query) {
        try {
          const suggestions = await getSuggestions(query);
          setSuggestions(suggestions);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      } else {
        setSuggestions([]);
      }
    }, 300),
    []
  );

  const handleTitleChange = (e) => {
    const input = e.target.value;
    setTitle(input);
    debouncedFetchSuggestions(input);
  };

  const handleRecommend = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setError("");
    setRecommendations([]);
    setSuggestions([]); // clear suggestions when submitting

    try {
      const data = await getTitleRecommendations(title, summary);
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
    <div className="homepage-container title-recommendation-container">
      <h2>🔎 Title-Based Recommendations</h2>

      <div className="search-section">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Enter title..."
            value={title}
            onChange={handleTitleChange}
            className="search-input"
          />

          {suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  className="suggestion-item"
                  onClick={() => {
                    setTitle(s);
                    setSuggestions([]);
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
          className="summary-textarea"
        />

        <button onClick={handleRecommend} className="search-button">
          🔍 Recommend
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>

      {loading && <div className="loading-message">Loading recommendations...</div>}

      {recommendations.length > 0 && (
        <div className="manhwa-list">
          {recommendations.map((item, i) => (
            <div
              className="manhwa-card"
              key={i}
              onClick={() => handleCardClick(item)}
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="manhwa-cover"
                />
              )}
              <h3>{item.title}</h3>
              <div className="card-footer">
                <p>
                  <strong>Chapter:</strong> {item.chapter}
                </p>
                <button
                  className="like-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(item);
                  }}
                >
                  {isLiked(item.title) ? "❤️" : "🤍"}
                </button>
              </div>
              <div className="moods">
                {(item.genre || []).slice(0, 3).map((g, j) => (
                  <span key={j} className="mood-tag">{g}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TitleRecommendation;
