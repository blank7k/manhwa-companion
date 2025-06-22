import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, collection, query, where, writeBatch, runTransaction } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ Unified migration logic
  const migrateGuestData = async (user) => {
    const guestId = localStorage.getItem("guestId");
    if (!guestId) return;

    // 1. Migrate Likes
    const guestLikes = JSON.parse(
      localStorage.getItem(`likes_${guestId}`) || "[]"
    );
    if (guestLikes.length > 0) {
      const userLikesDoc = doc(db, "likes", user.uid);
      const docSnap = await getDoc(userLikesDoc);
      const existingLikes = docSnap.exists() ? docSnap.data().items || [] : [];
      const mergedLikes = [
        ...existingLikes,
        ...guestLikes.filter(
          (g) => !existingLikes.find((e) => e.title === g.title)
        ),
      ];
      await setDoc(userLikesDoc, { items: mergedLikes }, { merge: true });
    }

    // 2. Migrate Comments
    const q = query(collection(db, "comments"), where("userId", "==", guestId));
    const guestCommentsSnap = await getDoc(q);
    if (!guestCommentsSnap.empty) {
      const batch = writeBatch(db);
      guestCommentsSnap.docs.forEach((commentDoc) => {
        batch.update(commentDoc.ref, {
          userId: user.uid,
          username: user.displayName || user.email || "User",
        });
      });
      await batch.commit();
    }

    // 3. Migrate Ratings
    const guestRatings = JSON.parse(localStorage.getItem(`ratings_${guestId}`) || "{}");
    for (const manhwaSlug in guestRatings) {
        const rating = guestRatings[manhwaSlug];
        const ratingDocRef = doc(db, "ratings", manhwaSlug);

        await runTransaction(db, async (transaction) => {
            const ratingDoc = await transaction.get(ratingDocRef);
            if (!ratingDoc.exists()) return;

            const data = ratingDoc.data();
            const userRatings = data.userRatings || {};

            // Remove guest rating, add user rating
            delete userRatings[guestId];
            userRatings[user.uid] = rating;

            transaction.update(ratingDocRef, { userRatings });
        });
    }

    // Clear all guest data
    localStorage.removeItem(`likes_${guestId}`);
    localStorage.removeItem(`ratings_${guestId}`);
    localStorage.removeItem("guestId");
  };

  // ✅ Save user profile info to Firestore
  const saveUserInfo = async (user) => {
    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName || "No Name",
      email: user.email,
    }, { merge: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await migrateGuestData(user);
      await saveUserInfo(user);

      alert("Login successful!");
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await migrateGuestData(user);
      await saveUserInfo(user);

      alert("Google Login successful!");
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <h1>Login to ManhwaHub</h1>
      <form className="login-form" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>

      <p style={{ margin: "20px 0", color: "#ccc" }}>or</p>
      <button onClick={handleGoogleLogin} style={{ 
        backgroundColor: "#4285f4", 
        color: "white",
        padding: "12px 24px",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "1rem",
        minWidth: "120px",
        transition: "background-color 0.2s ease"
      }}>
        Login with Google
      </button>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export default LoginPage;
