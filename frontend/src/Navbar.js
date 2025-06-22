// src/Navbar.js
import React, { useEffect, useState } from 'react';
import './Navbar.css';
import { Link, useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";

function Navbar() {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      setIsMobileMenuOpen(false);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <Link to="/" className="logo-link" onClick={closeMobileMenu}>📚 GO-Manhwa</Link>
        </div>

        <button className="hamburger" onClick={toggleMobileMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <li><Link to="/" onClick={closeMobileMenu}>Home</Link></li>
          <li><Link to="/recommendation" onClick={closeMobileMenu}>AI Recommendation</Link></li>
          <li><Link to="/your-updates" onClick={closeMobileMenu}>Your Updates</Link></li>
          <li><Link to="/liked" onClick={closeMobileMenu}>Liked Manhwa</Link></li>
        </ul>

        <div className="navbar-user">
          {user ? (
            <>
              <span className="username">
                <Link to="/profile" onClick={closeMobileMenu}>{user.displayName || user.email}</Link>
              </span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <Link to="/login" className="login-link" onClick={closeMobileMenu}>Login</Link>
          )}
        </div>
      </nav>
      <div 
        className={`navbar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      ></div>
    </>
  );
}

export default Navbar;
