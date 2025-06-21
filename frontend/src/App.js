import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from "react";
import Navbar from "./Navbar";
import HomePage from "./HomePage";
import LikedManhwa from "./LikedManhwa";
import YourUpdates from "./YourUpdates";
import TitleRecommendation from "./TitleRecommendation";
import LoginPage from "./pages/LoginPage";
import PrivateRoute from "./PrivateRoute"; // ✅ already created
import GenreRecommendation from './GenreRecommendation';
import ManhwaDetailPage from './ManhwaDetailPage';
import ProfilePage from "./ProfilePage";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/manhwa/:title" element={<ManhwaDetailPage />} />
          <Route path="/recommendation" element={<TitleRecommendation />} />

          {/* ✅ Protected routes */}
          <Route
            path="/liked"
            element={
              <PrivateRoute>
                <LikedManhwa />
              </PrivateRoute>
            }
          />
          <Route
            path="/your-updates"
            element={
              <PrivateRoute>
                <YourUpdates />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
