import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [likedManhwa, setLikedManhwa] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const docRef = doc(db, 'likes', user.uid);
      const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setLikedManhwa(docSnap.data().items || []);
        } else {
          setLikedManhwa([]);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user likes:", error);
        setLoading(false);
      });

      return () => unsubscribeSnapshot();
    } else {
      // Handle guest user likes from localStorage
      const guestLikes = JSON.parse(localStorage.getItem('guestLikes')) || [];
      setLikedManhwa(guestLikes);
      setLoading(false);
    }
  }, [user]);

  return { user, likedManhwa, loading };
}; 