import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ✅ Auto-create guest ID
const guestId = localStorage.getItem("guestId");
if (!guestId) {
  const newGuestId = "guest_" + Date.now();
  localStorage.setItem("guestId", newGuestId);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
