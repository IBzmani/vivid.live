'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as Lucide from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  // const [role, setRole] = React.useState('');
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
      let body;
      try {
        body = JSON.stringify({ fullName, email, password });
      } catch (stringifyError) {
        setError('Invalid input data');
        setIsLoading(false);
        return;
      }

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
      // Avoid logging the error object directly as it might contain circular references (e.g. DOM events)
      // which can cause "Converting circular structure to JSON" errors in some environments.
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-[#12110d]" />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-[#f8f8f6] dark:bg-[#12110d] text-slate-900 dark:text-slate-100 selection:bg-primary/30 font-display" suppressHydrationWarning>
      <div className="film-grain" suppressHydrationWarning></div>
      {/* Left Side: Cinematic Visual */}
      <div className="hidden md:flex w-1/2 h-full relative overflow-hidden" suppressHydrationWarning>
        <div 
          suppressHydrationWarning
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA4GReHqU0OBknSuhVrg9fJ4XSuHUo0aZ5k3t5BCfImQWPFZYNMsXYUun59yt6AEGgq_PhjFzf81AJENnYJ6fB2lNFP93AjSQmYE7kpT7Dc2uzr6cxgTBoI-8zdmGu_IsQtFeKgH6sFDq8HaKBiHWBHRVTtkN42-Yp49-hpny6rXmyeA6W8fnYJ7Z7evGXyrKCRBhIF9RxFc0nOp1bZXN8LvPwdASdCGizRsuqVP2Jd17BtEefe2D4sSPbPmaT900ZTNQjEUsWyETA')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#12110d]/80" suppressHydrationWarning></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#12110d] via-transparent to-transparent" suppressHydrationWarning></div>
        
        {/* Branding Overlay */}
        <div className="absolute top-10 left-10 flex items-center gap-3" suppressHydrationWarning>
          <div className="bg-primary p-1.5 rounded-lg shadow-[0_0_20px_rgba(236,182,19,0.4)]" suppressHydrationWarning>
            <Lucide.Film className="size-6 text-[#12110d] fill-current" suppressHydrationWarning />
          </div>
          <Link href="/" suppressHydrationWarning>
            <h2 className="text-white text-2xl font-black tracking-tighter hover:text-primary transition-colors cursor-pointer" suppressHydrationWarning>Vivid.live</h2>
          </Link>
        </div>
        
        {/* Cinematic Caption */}
        <div className="absolute bottom-20 left-10 max-w-md" suppressHydrationWarning>
          <div className="flex items-center gap-2 mb-4" suppressHydrationWarning>
            <span className="h-px w-8 bg-primary" suppressHydrationWarning></span>
            <span className="text-primary text-xs font-bold uppercase tracking-[0.3em]" suppressHydrationWarning>System Status: Online</span>
          </div>
          <h1 className="text-white text-5xl font-black leading-tight mb-4" suppressHydrationWarning>
            World Bible <br/>Asset Suite
          </h1>
          <p className="text-slate-300 text-lg font-light leading-relaxed" suppressHydrationWarning>
            Initialize your production environment within the cybernetic forest. 
            Build, manage, and scale your creative vision.
          </p>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="w-full md:w-1/2 h-full flex flex-col justify-center items-center px-6 lg:px-20 bg-[#12110d] relative" suppressHydrationWarning>
        {/* Mobile Logo */}
        <div className="md:hidden absolute top-8 left-8 flex items-center gap-3" suppressHydrationWarning>
          <div className="bg-primary p-1.5 rounded-lg" suppressHydrationWarning>
            <Lucide.Film className="size-5 text-[#12110d] fill-current" suppressHydrationWarning />
          </div>
          <Link href="/" suppressHydrationWarning>
            <span className="text-white font-bold hover:text-primary transition-colors cursor-pointer" suppressHydrationWarning>Vivid.live</span>
          </Link>
        </div>
        
        <div className="w-full max-w-md glass-panel p-8 md:p-10 rounded-2xl shadow-2xl border border-primary/5" suppressHydrationWarning>
          <div className="mb-8" suppressHydrationWarning>
            <h2 className="text-white text-3xl font-bold tracking-tight mb-2" suppressHydrationWarning>Create Your Account</h2>
            <p className="text-slate-400 text-sm" suppressHydrationWarning>Join the elite network of digital world builders.</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm" suppressHydrationWarning>
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSignup} suppressHydrationWarning>
            {/* Full Name */}
            <div className="space-y-2" suppressHydrationWarning>
              <label className="text-slate-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2" suppressHydrationWarning>
                <Lucide.User className="text-primary size-4" suppressHydrationWarning />
                Full Name
              </label>
              <input 
                suppressHydrationWarning
                className="w-full bg-[#12110d]/50 border border-slate-700/50 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-600" 
                placeholder="e.g. Julian Vane" 
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            
            {/* Production Email */}
            <div className="space-y-2" suppressHydrationWarning>
              <label className="text-slate-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2" suppressHydrationWarning>
                <Lucide.Mail className="text-primary size-4" suppressHydrationWarning />
                Production Email
              </label>
              <input 
                suppressHydrationWarning
                className="w-full bg-[#12110d]/50 border border-slate-700/50 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-600" 
                placeholder="name@studio.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            {/* Creative Role - Commented out as per request
            <div className="space-y-2" suppressHydrationWarning>
              <label className="text-slate-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2" suppressHydrationWarning>
                <div className="text-primary size-4" suppressHydrationWarning />
                Creative Role
              </label>
              <div className="relative" suppressHydrationWarning>
                <select 
                  suppressHydrationWarning
                  className="w-full bg-[#12110d]/50 border border-slate-700/50 rounded-lg py-3 px-4 text-white appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="" disabled suppressHydrationWarning>Select your discipline</option>
                  <option value="World Builder" suppressHydrationWarning>World Builder</option>
                  <option value="Technical Artist" suppressHydrationWarning>Technical Artist</option>
                  <option value="Asset Curator" suppressHydrationWarning>Asset Curator</option>
                  <option value="Executive Producer" suppressHydrationWarning>Executive Producer</option>
                </select>
                <Lucide.ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none size-5" suppressHydrationWarning />
              </div>
            </div>
            */}
            
            {/* Password */}
            <div className="space-y-2" suppressHydrationWarning>
              <label className="text-slate-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2" suppressHydrationWarning>
                <Lucide.Lock className="text-primary size-4" suppressHydrationWarning />
                Create Password
              </label>
              <input 
                suppressHydrationWarning
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
              suppressHydrationWarning
              className="group relative w-full mt-4 flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-[#12110d] font-bold py-4 px-6 rounded-lg transition-all active:scale-[0.98] shadow-[0_0_25px_rgba(236,182,19,0.2)] disabled:opacity-70 disabled:hover:bg-primary disabled:active:scale-100" 
              type="submit"
              disabled={isLoading}
            >
              <span suppressHydrationWarning>{isLoading ? 'Initializing...' : 'Initialize Suite'}</span>
              {!isLoading && <Lucide.Zap className="size-5 transition-transform group-hover:translate-x-1 fill-current" suppressHydrationWarning />}
            </button>
          </form>
          
          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center" suppressHydrationWarning>
            <p className="text-slate-400 text-sm" suppressHydrationWarning>
              Already have an account? 
              <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4 ml-1" suppressHydrationWarning>Log in</Link>
            </p>
          </div>
        </div>
        
        {/* Bottom Accents */}
        <div className="absolute bottom-10 flex gap-6 text-[10px] text-slate-600 font-medium tracking-[0.2em] uppercase" suppressHydrationWarning>
          <Link href="#" className="hover:text-slate-400 transition-colors" suppressHydrationWarning>Terms of Service</Link>
          <Link href="#" className="hover:text-slate-400 transition-colors" suppressHydrationWarning>Privacy Protocol</Link>
          <span suppressHydrationWarning>© 2024 VIVID INDUSTRIES</span>
        </div>
      </div>
    </div>
  );
}
