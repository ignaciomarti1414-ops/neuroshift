import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { getSessions } from './sessionService';
import { useNeuroStore } from '../store/useNeuroStore';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const setHistory = useNeuroStore(state => state.setHistory);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!isMounted) return;
      setUser(user);
      if (user) {
        try {
          const sessions = await getSessions();
          if (isMounted) setHistory(sessions);
        } catch (error) {
          console.error("Failed to fetch sessions: ", error);
          if (isMounted) setHistory([]);
        }
      } else {
        if (isMounted) setHistory([]);
      }
      if (isMounted) setLoading(false);
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [setHistory]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
