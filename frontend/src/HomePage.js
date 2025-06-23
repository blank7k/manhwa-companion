// ✅ HomePage.js with 3 tabs: Today, Top All, Genre Recommendations
import React, { useEffect, useState } from "react";
import "./HomePage.css";
import GenreRecommendation from "./GenreRecommendation";
import { auth, db } from "./firebase"; // ✅ Add this if not already present
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"; // ✅
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useAuth } from './hooks/useAuth';
import { getAllManhwa, getTopAllManhwa } from './api';
import getImageUrl from './utils/getImageUrl';

import LikedManhwa from "./LikedManhwa";
import YourUpdates from "./YourUpdates";
import TitleRecommendation from "./TitleRecommendation";

const HomePage = () => {
  const [activeTab, setActiveTab] = useState("today");
  const [manhwaList, setManhwaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, likedManhwa: initialLikedManhwa, loading: authLoading } = useAuth();
  const [likedManhwa, setLikedManhwa] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      setLikedManhwa(initialLikedManhwa);
    }
  }, [initialLikedManhwa, authLoading]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoint = activeTab === 'today' ? getAllManhwa : getTopAllManhwa;
        const result = await endpoint();
        setManhwaList(result.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'today' || activeTab === 'topall') {
      fetchData();
    }
  }, [activeTab]);

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

      await setDoc(docRef, { items: updatedLikes }, { merge: true });
    } else {
      // Guest logic
      let guestId = localStorage.getItem("guestId");
      if (!guestId) {
        guestId = Date.now().toString();
        localStorage.setItem("guestId", guestId);
      }

      const storageKey = `likes_${guestId}`;
      const existing = JSON.parse(localStorage.getItem(storageKey)) || [];
      const exists = existing.find((item) => item.title === manhwa.title);
      updatedLikes = exists
        ? existing.filter((item) => item.title !== manhwa.title)
        : [...existing, manhwa];

      localStorage.setItem(storageKey, JSON.stringify(updatedLikes));
    }

    setLikedManhwa(updatedLikes);
  };

  const handleCardClick = (manhwa) => {
    // Navigate to a detail page, passing manhwa data
    navigate(`/manhwa/${encodeURIComponent(manhwa.title)}`, {
      state: { manhwa },
    });
  };

  const renderCards = (list) =>
    (Array.isArray(list) ? list : []).map((manhwa, i) => (
      <div
        className="manhwa-card"
        key={i}
        onClick={() => handleCardClick(manhwa)}
      >
        <img
          src={manhwa.image ? getImageUrl(manhwa.image) : 'https://via.placeholder.com/280x420.png?text=Cover+Not+Found'}
          alt={manhwa.title}
          className="manhwa-cover"
          loading="lazy"
        />
        <h3>{manhwa.title}</h3>
        <div className="card-footer">
          <p>
            <strong>Chapter:</strong> {manhwa.chapter}
          </p>
          <button
            className="like-button"
            onClick={(e) => {
              e.stopPropagation(); // Stop click from bubbling to the card
              toggleLike(manhwa);
            }}
          >
            {isLiked(manhwa.title) ? "❤️" : "🤍"}
          </button>
        </div>
        <div className="moods">
          {(manhwa.genre || []).map((mood, j) => (
            <span key={j} className="mood-tag">
              {mood}
            </span>
          ))}
        </div>
      </div>
    ));

  return (
    <div className="homepage-container">
      <div className="tabs">
        <button
          onClick={() => setActiveTab("today")}
          className={activeTab === "today" ? "active" : ""}
        >
          Today
        </button>
        <button
          onClick={() => setActiveTab("topall")}
          className={activeTab === "topall" ? "active" : ""}
        >
          Top all
        </button>
        <button
          onClick={() => setActiveTab("genre")}
          className={activeTab === "genre" ? "active" : ""}
        >
          Genre
        </button>
      </div>

      {(loading || authLoading) && <div className="loading-spinner">Loading...</div>}

      {!loading && !authLoading && (activeTab === 'today' || activeTab === 'topall') && (
        <div className="manhwa-list">{renderCards(manhwaList)}</div>
      )}
      
      {activeTab === "genre" && <GenreRecommendation />}
    </div>
  );
};

export default HomePage;
