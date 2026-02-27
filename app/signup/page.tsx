'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Film, User, Mail, Lock, Zap, ChevronDown } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const body = JSON.stringify({ fullName, email, password });

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        router.push('/setup');
      } else {
        const data = await res.json();
        setError(data.error || 'Signup failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-[#12110d]" />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-[#f8f8f6] dark:bg-[#12110d] text-slate-900 dark:text-slate-100 selection:bg-primary/30 font-display">
      <div className="film-grain"></div>
      {/* Left Side: Cinematic Visual */}
      <div className="hidden md:flex w-1/2 h-full relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA4GReHqU0OBknSuhVrg9fJ4XSuHUo0aZ5k3t5BCfImQWPFZYNMsXYUun59yt6AEGgq_PhjFzf81AJENnYJ6fB2lNFP93AjSQmYE7kpT7Dc2uzr6cxgTBoI-8zdmGu_IsQtFeKgH6sFDq8HaKBiHWBHRVTtkN42-Yp49-hpny6rXmyeA6W8fnYJ7Z7evGXyrKCRBhIF9RxFc0nOp1bZXN8LvPwdASdCGizRsuqVP2Jd17BtEefe2D4sSPbPmaT900ZTNQjEUsWyETA')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#12110d]/80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#12110d] via-transparent to-transparent"></div>
        
        {/* Branding Overlay */}
        <div className="absolute top-10 left-10 flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg shadow-[0_0_20px_rgba(236,182,19,0.4)]">
            <Film className="size-6 text-[#12110d] fill-current" />
          </div>
          <Link href="/">
            <h2 className="text-white text-2xl font-black tracking-tighter hover:text-primary transition-colors cursor-pointer">Vivid.live</h2>
          </Link>
        </div>
        
        {/* Cinematic Caption */}
        <div className="absolute bottom-20 left-10 max-w-md">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-px w-8 bg-primary"></span>
            <span className="text-primary text-xs font-bold uppercase tracking-[0.3em]">System Status: Online</span>
          </div>
          <h1 className="text-white text-5xl font-black leading-tight mb-4">
            World Bible <br/>Asset Suite
          </h1>
          <p className="text-slate-300 text-lg font-light leading-relaxed">
            Initialize your production environment within the cybernetic forest. 
            Build, manage, and scale your creative vision.
          </p>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="w-full md:w-1/2 h-full flex flex-col justify-center items-center px-6 lg:px-20 bg-[#12110d] relative">
        {/* Mobile Logo */}
        <div className="md:hidden absolute top-8 left-8 flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg">
            <Film className="size-5 text-[#12110d] fill-current" />
          </div>
          <Link href="/">
            <span className="text-white font-bold hover:text-primary transition-colors cursor-pointer">Vivid.live</span>
          </Link>
        </div>
        
        <div className="w-full max-w-md glass-panel p-8 md:p-10 rounded-2xl shadow-2xl border border-primary/5">
          <div className="mb-8">
            <h2 className="text-white text-3xl font-bold tracking-tight mb-2">Create Your Account</h2>
            <p className="text-slate-400 text-sm">Join the elite network of digital world builders.</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSignup}>
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-slate-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <User className="text-primary size-4" />
                Full Name
              </label>
              <input 
                className="w-full bg-[#12110d]/50 border border-slate-700/50 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-600" 
                placeholder="e.g. Julian Vane" 
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            
            {/* Production Email */}
            <div className="space-y-2">
              <label className="text-slate-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Mail className="text-primary size-4" />
                Production Email
              </label>
              <input 
                className="w-full bg-[#12110d]/50 border border-slate-700/50 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-600" 
                placeholder="name@studio.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            {/* Password */}
            <div className="space-y-2">
              <label className="text-slate-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Lock className="text-primary size-4" />
                Create Password
              </label>
              <input 
                className="w-full bg-[#12110d]/50 border border-slate-700/50 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-600" 
                placeholder="••••••••" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {/* Submit Button */}
            <button 
              className="group relative w-full mt-4 flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-[#12110d] font-bold py-4 px-6 rounded-lg transition-all active:scale-[0.98] shadow-[0_0_25px_rgba(236,182,19,0.2)] disabled:opacity-70 disabled:hover:bg-primary disabled:active:scale-100" 
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? 'Initializing...' : 'Initialize Suite'}</span>
              {!isLoading && <Zap className="size-5 transition-transform group-hover:translate-x-1 fill-current" />}
            </button>
          </form>
          
          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account? 
              <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4 ml-1">Log in</Link>
            </p>
          </div>
        </div>
        
        {/* Bottom Accents */}
        <div className="absolute bottom-10 flex gap-6 text-[10px] text-slate-600 font-medium tracking-[0.2em] uppercase">
          <Link href="#" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
          <Link href="#" className="hover:text-slate-400 transition-colors">Privacy Protocol</Link>
          <span>© 2024 VIVID INDUSTRIES</span>
        </div>
      </div>
    </div>
  );
}

