import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import "./HomePage.css";
import "./LikedManhwa.css";
import { searchManhwa } from './api';

const LikedManhwa = () => {
  const [user, setUser] = useState(null);
  const [likedManhwa, setLikedManhwa] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "likes", currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setLikedManhwa(snap.data().items || []);
        }
      } else {
        const guestId = localStorage.getItem("guestId");
        if (guestId) {
          const guestLikes =
            JSON.parse(localStorage.getItem(`likes_${guestId}`)) || [];
          setLikedManhwa(guestLikes);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const isLiked = (title) => likedManhwa.some((item) => item.title === title);

  const toggleLike = async (manhwa) => {
    let updatedLikes;
    const currentUser = user || auth.currentUser;

    if (currentUser) {
      const docRef = doc(db, "likes", currentUser.uid);
      const docSnap = await getDoc(docRef);
      const existingLikes = docSnap.exists() ? docSnap.data().items || [] : [];
      const exists = existingLikes.find((item) => item.title === manhwa.title);
      updatedLikes = exists
        ? existingLikes.filter((item) => item.title !== manhwa.title)
        : [...existingLikes, { ...manhwa, summary: manhwa.summary || "" }];
      await setDoc(docRef, { items: updatedLikes }, { merge: true });
    } else {
      const guestId = localStorage.getItem("guestId");
      if (!guestId) return;
      const storageKey = `likes_${guestId}`;
      const existing = JSON.parse(localStorage.getItem(storageKey)) || [];
      const exists = existing.find((item) => item.title === manhwa.title);
      updatedLikes = exists
        ? existing.filter((item) => item.title !== manhwa.title)
        : [...existing, { ...manhwa, summary: manhwa.summary || "" }];
      localStorage.setItem(storageKey, JSON.stringify(updatedLikes));
    }
    setLikedManhwa(updatedLikes);
  };

  const handleCardClick = (manhwa) => {
    navigate(`/manhwa/${encodeURIComponent(manhwa.title)}`, {
      state: { manhwa },
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    try {
      const data = await searchManhwa(searchTerm);
      setSearchResults([data]); // Assuming the API returns a single object
    } catch (error) {
      console.error("Error searching manhwa:", error);
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(
      setTimeout(() => {
        if (value.trim()) handleSearch(e);
      }, 600)
    );
  };

  const renderCards = (list, isFromSearch = false) =>
    list.map((manhwa, i) => (
      <div
        className="manhwa-card"
        key={i}
        onClick={() => handleCardClick(manhwa)}
      >
        {manhwa.image && (
          <img
            src={manhwa.image ? `https://manhwa-companion.onrender.com/proxy-image?url=${encodeURIComponent(manhwa.image)}` : 'https://via.placeholder.com/280x420.png?text=Cover+Not+Found'}
            alt={manhwa.title}
            className="manhwa-cover"
            loading="lazy"
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
          {(manhwa.genre || []).slice(0, 3).map((mood, j) => (
            <span key={j} className="mood-tag">
              {mood}
            </span>
          ))}
        </div>
      </div>
    ));

  const displayList = searchResults.length > 0 ? searchResults : likedManhwa;

  return (
    <div className="homepage-container liked-manhwa-container">
      <h2>❤️ Liked Manhwa</h2>
      
      <div className="search-section">
        <input
          type="text"
          placeholder="Search and add manhwa..."
          value={searchTerm}
          onChange={handleTyping}
          className="search-input"
        />
      </div>

      {searchResults.length > 0 && (
        <div className="manhwa-list search-results">
          {renderCards(searchResults, true)}
        </div>
      )}
      
      {searchError && <div className="search-error">{searchError}</div>}

      <div className="manhwa-list">
        {displayList.length === 0 ? (
          <div className="empty-state">No liked manhwa yet.</div>
        ) : (
          renderCards(displayList)
        )}
      </div>
    </div>
  );
};

export default LikedManhwa;
