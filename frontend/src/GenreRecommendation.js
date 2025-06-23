// GenreRecommendation.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./HomePage.css";
import getImageUrl from './utils/getImageUrl';

const genreTagMap = {
  Action: "391b0423-d847-456f-aff0-8b0cfc03066b",
  Adventure: "87cc87cd-a395-47af-b27a-93258283bbc6",
  Comedy: "4d32cc48-9f00-4cca-9b5a-a839f0764984",
  Drama: "f8f62932-27da-4fe4-8ee1-6779a8c5edba",
  Fantasy: "cdc58593-87dd-415e-bbc0-2ec27bf404cc",
  Romance: "4231303a-a7e4-4e2b-9f62-6b63b33dff6d",
  SciFi: "256c8bd9-4904-4360-bf4f-508a76d67183",
  SliceOfLife: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
};

const GenreRecommendation = () => {
  const [selectedGenre, setSelectedGenre] = useState("Action");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    fetchRecommendations(selectedGenre);
  }, [selectedGenre]);

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

  const fetchRecommendations = async (genreName) => {
    const tagId = genreTagMap[genreName];
    if (!tagId) return;
    setLoading(true);

    try {
      const url = `https://api.mangadex.org/manga?includedTags[]=${tagId}&includedTagsMode=AND&limit=8&availableTranslatedLanguage[]=en&includes[]=cover_art`;
      const res = await fetch(url);
      const data = await res.json();

      const mangaList = await Promise.all(
        data.data.map(async (manga) => {
          const id = manga.id;
          const attr = manga.attributes;
          const title = attr.title.en || Object.values(attr.title)[0];
          const summary = attr.description.en || "No description.";
          
          const rels = manga.relationships;
          const genre = rels.filter(r => r.type === 'tag').map(r => r.attributes.name.en);
          const coverRel = rels.find((rel) => rel.type === "cover_art");
          const image = coverRel
            ? `https://uploads.mangadex.org/covers/${id}/${coverRel.attributes.fileName}`
            : "";

          let chapter = "N/A";
          try {
            const chapRes = await fetch(
              `https://api.mangadex.org/chapter?manga=${id}&limit=1&translatedLanguage[]=en&order[chapter]=desc`
            );
            const chapData = await chapRes.json();
            if (chapData.data && chapData.data.length > 0) {
              chapter = chapData.data[0].attributes.chapter || "N/A";
            }
          } catch (e) {
            console.warn(`Chapter fetch failed for ${title}`);
          }

          return { title, summary, image, chapter, genre };
        })
      );

      setResults(mangaList);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homepage-container">
      <h2 style={{ marginBottom: "10px" }}>📚 Explore by Genre</h2>

      <select
        value={selectedGenre}
        onChange={(e) => setSelectedGenre(e.target.value)}
        style={{ 
          padding: "12px 16px", 
          marginBottom: "20px",
          border: "1px solid #555",
          borderRadius: "8px",
          backgroundColor: "#333",
          color: "white",
          fontSize: "1rem",
          minWidth: "200px",
          cursor: "pointer"
        }}
      >
        {Object.keys(genreTagMap).map((genre) => (
          <option key={genre} value={genre}>
            {genre}
          </option>
        ))}
      </select>

      {loading ? (
        <p style={{ textAlign: "center", color: "#00e0ff", padding: "20px" }}>Loading...</p>
      ) : (
        <div className="manhwa-list">
          {results.map((item, i) => (
            <div
              className="manhwa-card"
              key={i}
              onClick={() => handleCardClick(item)}
            >
              {item.image && (
                <img
                  src={item.image ? getImageUrl(item.image) : 'https://via.placeholder.com/280x420.png?text=Cover+Not+Found'}
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

export default GenreRecommendation;
