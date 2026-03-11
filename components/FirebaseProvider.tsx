'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Film, Sparkles, LogIn, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Email login failed:", error);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
    } catch (error) {
      console.error("Email signup failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center">
        <Loader2 className="size-12 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Neural Link...</p>
      </div>
    );
  }

  // Only show the landing page if we are NOT on the login or signup pages
  // This allows the custom login/signup pages to render their own UI
  const isAuthPage = typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/signup');

  if (!user && !isAuthPage) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="film-grain"></div>
        <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,rgba(236,182,19,0.05)_0%,rgba(10,10,10,0)_70%)]"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md text-center space-y-8"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="size-20 bg-primary/20 rounded-3xl flex items-center justify-center text-primary border border-primary/30 shadow-[0_0_50px_rgba(236,182,19,0.1)]">
              <Film className="size-10" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Vivid.live</h1>
            <p className="text-slate-400 font-light text-sm max-w-xs mx-auto">
              Your Multimodal Showrunner Agent. Co-Create Your Cinematic Universe in Real-Time.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2 mb-6 justify-center">
              <Sparkles className="size-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Secure Access Required</span>
            </div>
            
            <button 
              onClick={login}
              className="w-full bg-primary text-obsidian py-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-[0.98] shadow-[0_0_30px_rgba(236,182,19,0.2)] flex items-center justify-center gap-3"
            >
              <LogIn className="size-5" />
              Connect with Google
            </button>

            <div className="mt-6 flex items-center justify-center gap-4">
              <a href="/login" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Log In</a>
              <div className="size-1 rounded-full bg-slate-800"></div>
              <a href="/signup" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Sign Up</a>
            </div>
            
            <p className="mt-6 text-[10px] text-slate-500 leading-relaxed">
              By connecting, you agree to our Terms of Service and Privacy Policy. Your cinematic data is encrypted and stored securely on Google Cloud.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithEmail, signupWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
};
