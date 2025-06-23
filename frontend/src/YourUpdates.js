// src/pages/YourUpdates.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import "./HomePage.css";
import { useAuth } from './hooks/useAuth';
import { getAllManhwa } from './api';

const YourUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const [likedManhwa, setLikedManhwa] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "likes", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const liked = docSnap.data().items || [];
          setLikedManhwa(liked);
          fetchUpdates(liked);
        }
      }
    });

    const fetchUpdates = async (liked) => {
      try {
        const data = await getAllManhwa();
        const allManhwa = data.data || [];
        const likedTitles = new Set(liked.map(m => m.title));
        const updatedManhwa = allManhwa.filter((m) =>
          likedTitles.has(m.title.toLowerCase().trim())
        );
        setUpdates(updatedManhwa);
      } catch (err) {
        console.error("Failed to fetch updates:", err);
      }
    };

    return () => unsubscribe();
  }, [user, likedManhwa]);

  const isLiked = (title) => likedManhwa.some((item) => item.title === title);

  const toggleLike = async (manhwa) => {
    const user = auth.currentUser;
    if (!user) return;

    let updatedLikes;
    const docRef = doc(db, "likes", user.uid);
    const docSnap = await getDoc(docRef);
    const existingLikes = docSnap.exists() ? docSnap.data().items || [] : [];
    const exists = existingLikes.find((item) => item.title === manhwa.title);
    updatedLikes = exists
      ? existingLikes.filter((item) => item.title !== manhwa.title)
      : [...existingLikes, manhwa];
    await setDoc(docRef, { items: updatedLikes });
    setLikedManhwa(updatedLikes);
  };

  const handleCardClick = (manhwa) => {
    navigate(`/manhwa/${encodeURIComponent(manhwa.title)}`, {
      state: { manhwa },
    });
  };

  return (
    <div className="homepage-container">
      <h2>🔔 Your Updates</h2>
      <div className="manhwa-list">
        {updates.length === 0 ? (
          <p>No updates yet. Like some manhwa first!</p>
        ) : (
          updates.map((manhwa, i) => (
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
                />
              )}
              <h3>{manhwa.title}</h3>
              <div className="card-footer">
                <p>
                  <strong>Chapter:</strong> {manhwa.chapter}
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
          ))
        )}
      </div>
    </div>
  );
};

export default YourUpdates;
