// src/Navbar.js
import React, { useEffect, useState } from 'react';
import './Navbar.css';
import { Link, useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe(); // cleanup listener on unmount
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/" className="logo-link">📚 GO-Manhwa</Link>
      </div>

      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/recommendation">AI Recommendation</Link></li>
        <li><Link to="/your-updates">Your Updates</Link></li>
        <li><Link to="/liked">Liked Manhwa</Link></li>
      </ul>

      <div className="navbar-user">
        {user ? (
          <>
            <span className="username">
              <Link to="/profile">{user.displayName || user.email}</Link>
            </span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </>
        ) : (
          <Link to="/login" className="login-link">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
