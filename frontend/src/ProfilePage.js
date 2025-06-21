import React, { useState } from "react";
import { updateProfile } from "firebase/auth";
import { collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./ProfilePage.css";

const ProfilePage = () => {
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRename = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!newName.trim()) {
      setError("Display name cannot be empty.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to change your name.");
      return;
    }

    try {
      // 1. Update profile in Firebase Auth
      await updateProfile(user, { displayName: newName });

      // 2. Update username in all user's comments
      const q = query(collection(db, "comments"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { username: newName });
      });
      await batch.commit();

      setMessage(`Your display name has been updated to "${newName}"`);
      setNewName("");

    } catch (err) {
      console.error("Error updating display name:", err);
      setError("Failed to update display name. Please try again.");
    }
  };

  return (
    <div className="profile-page-container">
      <h2>Your Profile</h2>
      <div className="current-user-info">
        <p><strong>Current Name:</strong> {auth.currentUser?.displayName || auth.currentUser?.email}</p>
        <p><strong>Email:</strong> {auth.currentUser?.email}</p>
      </div>

      <form onSubmit={handleRename} className="rename-form">
        <h3>Change Display Name</h3>
        <input
          type="text"
          placeholder="Enter new display name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit">Save Changes</button>
      </form>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default ProfilePage; 