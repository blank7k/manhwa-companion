import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  arrayUnion,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import "./ManhwaDetailPage.css";

const ManhwaDetailPage = () => {
  const location = useLocation();
  let { manhwa } = location.state || {}; // data passed from HomePage
  const { title } = useParams();

  if (!manhwa) {
    manhwa = { title: decodeURIComponent(title) };
  }
  const manhwaSlug = manhwa.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const [user, setUser] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Effect for ratings
  useEffect(() => {
    const ratingDocRef = doc(db, "ratings", manhwaSlug);

    // Listen for real-time updates on ratings
    const unsubscribe = onSnapshot(ratingDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAvgRating(data.average || 0);
        setRatingCount(data.count || 0);

        // check for current user's rating
        if (user) {
          const userRatings = data.userRatings || {};
          setUserRating(userRatings[user.uid] || 0);
        } else {
          // Guest user rating from local storage
          const guestId = localStorage.getItem("guestId");
          const guestRatings = JSON.parse(localStorage.getItem(`ratings_${guestId}`)) || {};
          setUserRating(guestRatings[manhwaSlug] || 0);
        }
      }
    });

    return () => unsubscribe();
  }, [manhwaSlug, user]);

  // Effect for comments
  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("manhwaSlug", "==", manhwaSlug)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })).sort((a, b) => b.timestamp - a.timestamp);
      setComments(fetchedComments);
    });
    return () => unsubscribe();
  }, [manhwaSlug]);


  const handleRating = async (rating) => {
    const ratingDocRef = doc(db, "ratings", manhwaSlug);
    const userId = user ? user.uid : localStorage.getItem("guestId");
    
    if (!userId) return; // Should not happen

    try {
      await runTransaction(db, async (transaction) => {
        const ratingDoc = await transaction.get(ratingDocRef);
        
        if (!ratingDoc.exists()) {
          transaction.set(ratingDocRef, {
            average: rating,
            count: 1,
            userRatings: { [userId]: rating },
          });
          return;
        }

        const data = ratingDoc.data();
        const oldUserRatings = data.userRatings || {};
        const oldRating = oldUserRatings[userId];
        
        const newUserRatings = { ...oldUserRatings, [userId]: rating };
        const oldCount = data.count || 0;
        const oldAverage = data.average || 0;

        let newCount = oldCount;
        let newTotal = oldAverage * oldCount;

        if (oldRating) { // User is changing their rating
            newTotal = newTotal - oldRating + rating;
        } else { // New rating
            newTotal = newTotal + rating;
            newCount = newCount + 1;
        }

        const newAverage = newTotal / newCount;
        
        transaction.update(ratingDocRef, {
          average: newAverage,
          count: newCount,
          userRatings: newUserRatings,
        });
      });
      setUserRating(rating);
      if(!user) {
         // also save guest rating to localstorage for migration
        const guestId = localStorage.getItem("guestId");
        const guestRatings = JSON.parse(localStorage.getItem(`ratings_${guestId}`)) || {};
        guestRatings[manhwaSlug] = rating;
        localStorage.setItem(`ratings_${guestId}`, JSON.stringify(guestRatings));
      }

    } catch (e) {
      console.error("Rating transaction failed: ", e);
    }
  };


  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const userId = user ? user.uid : localStorage.getItem("guestId");
    const username = user ? (user.displayName || user.email) : "Guest";

    if (!userId) return;

    await addDoc(collection(db, "comments"), {
      manhwaSlug,
      userId,
      username,
      text: newComment,
      timestamp: serverTimestamp(),
    });
    setNewComment("");
  };

  const handleCommentDelete = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteDoc(doc(db, "comments", commentId));
      } catch (error) {
        console.error("Error deleting comment:", error);
        alert("Failed to delete comment.");
      }
    }
  };

  if (!manhwa) {
    return (
      <div className="manhwa-detail-page">
        <h2>Manhwa not found</h2>
        <p>Please go back to the homepage and select a manhwa.</p>
      </div>
    );
  }

  return (
    <div className="manhwa-detail-page">
      <div className="detail-card">
        <img
          src={manhwa.image ? `https://manhwa-companion.onrender.com/proxy-image?url=${encodeURIComponent(manhwa.image)}` : 'https://via.placeholder.com/280x420.png?text=Cover+Not+Found'}
          alt={`Cover of ${manhwa.title}`}
          className="detail-cover"
        />
        <div className="detail-info">
          <h1>{manhwa.title}</h1>
          <div className="genres">
            {(manhwa.genre || []).map((g, index) => (
              <span key={index} className="genre-tag">
                {g}
              </span>
            ))}
          </div>
          <p className="summary">{manhwa.summary}</p>
          <div className="actions">
            <p>
              <strong>Latest Chapter:</strong> {manhwa.chapter}
            </p>
            {/* Placeholder for future features */}
          </div>
          <div className="ratings-section">
            <h3>Ratings ({ratingCount} reviews)</h3>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={star <= (userRating || avgRating) ? "star-filled" : "star-empty"}
                  onClick={() => handleRating(star)}
                >
                  ★
                </span>
              ))}
               <p>{avgRating.toFixed(2)} average</p>
            </div>
          </div>
          <div className="comments-section">
            <h3>Comments</h3>
             <form onSubmit={handleCommentSubmit} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
              />
              <button type="submit">Post</button>
            </form>
            <div className="comment-list">
              {comments.map((comment) => {
                const currentUserId = user ? user.uid : localStorage.getItem("guestId");
                return (
                  <div key={comment.id} className="comment-item">
                    <strong>{comment.username}</strong>
                    <p>{comment.text}</p>
                    <small>
                      {comment.timestamp?.toDate().toLocaleString()}
                    </small>
                    {comment.userId === currentUserId && (
                      <button className="delete-comment-btn" onClick={() => handleCommentDelete(comment.id)}>
                        &times;
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManhwaDetailPage; 