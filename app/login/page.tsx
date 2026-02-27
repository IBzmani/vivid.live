'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Film, Mail, Lock, EyeOff, Eye } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('test@vivid.live');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        router.push('/dashboard');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  if (!isMounted) {
    return <div className="min-h-screen bg-[#181611]" />;
  }

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const body = JSON.stringify({ email, password });

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get auth URL');
      }
      const { url } = await res.json();
      
      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
      }
    } catch (err: any) {
      // Avoid logging the error object directly as it might contain circular references (e.g. DOM events)
      // which can cause "Converting circular structure to JSON" errors in some environments.
      console.error('OAuth error:', err instanceof Error ? err.message : 'Unknown error');
      setError(err.message || 'Failed to initialize Google login.');
    }
  };

  return (
    <div className="flex h-screen w-full flex-col lg:flex-row bg-[#f8f8f6] dark:bg-[#181611] text-slate-900 dark:text-slate-100 overflow-hidden font-display">
      {/* Branding Logo (Fixed Position) */}
      <div className="absolute top-8 left-8 z-50 flex items-center gap-3">
        <div className="size-8 text-primary flex items-center justify-center">
          <Film className="size-6 fill-current" />
        </div>
        <Link href="/">
          <h1 className="text-white text-2xl font-bold tracking-tight hover:text-primary transition-colors cursor-pointer">Vivid.live</h1>
        </Link>
      </div>

      {/* Left Side: Cinematic Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0d0c09]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0c09]/40 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c09]/80 via-transparent to-transparent z-10"></div>
        <div 
          className="h-full w-full bg-cover bg-center transition-transform duration-[10000ms] hover:scale-105" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBI2mNkzzrJfXU-2-5dtWYqftc7mdF4EBsYOZo76sHtj0ZGXRTxlEiYQpj0bNrsoOH6VGZ7nlppWEo6SMlkU9GWSiIVg7MacjbqG5Hz0Cocp47YmtZSCQOnvAVcfImOF0kaJwtm1xbtzneW6EQFXCPCrMtTrpijtVqR5SUJjDhf8KfXjMHZCt02U8ndabCO_y8LY9dPm5-Eeb1yE2u_0j5uoFEILrUfA-YIpDF7GiMpbbR5ek6ho5RbBWlmefyTIqrf-p1Y5KaQLgQ')" }}
        ></div>
        <div className="absolute bottom-12 left-12 z-20 max-w-md">
          <h2 className="text-4xl font-black text-white leading-tight mb-4">Master the Art of Visual Storytelling</h2>
          <p className="text-slate-300 text-lg">Join the world&apos;s most advanced high-fidelity virtual production studio.</p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-20 bg-[#181611] relative">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="w-full max-w-[440px] z-10">
          <div className="mb-10">
            <h3 className="text-3xl font-bold text-white mb-2">Welcome Back</h3>
            <p className="text-slate-400">Access your production dashboard and tools.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleCredentialsLogin}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Production Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input 
                  suppressHydrationWarning
                  className="w-full bg-[#27241c] border border-slate-700/50 rounded-lg py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" 
                  placeholder="name@studio.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <Link className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider" href="#">Forgot Password?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input 
                  suppressHydrationWarning
                  className="w-full bg-[#27241c] border border-slate-700/50 rounded-lg py-4 pl-12 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  suppressHydrationWarning
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button 
              suppressHydrationWarning
              className="w-full bg-primary hover:bg-primary/90 text-[#0d0c09] font-bold py-4 rounded-lg shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In to Studio'}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/50"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#181611] px-4 text-slate-500 tracking-widest">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <button 
              suppressHydrationWarning
              className="w-full bg-[#27241c]/60 backdrop-blur-md border border-primary/10 hover:bg-[#27241c]/80 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-3 transition-all" 
              type="button"
              onClick={handleGoogleLogin}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              Google
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-400">
              New to the cinematic world? 
              <Link className="text-primary font-bold hover:underline ml-1" href="/signup">Create an account</Link>
            </p>
          </div>
        </div>

        {/* Bottom Navigation/Legal Links */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-6 text-[10px] text-slate-600 uppercase tracking-[0.2em] w-full justify-center">
          <Link className="hover:text-slate-400 transition-colors" href="#">Privacy Policy</Link>
          <Link className="hover:text-slate-400 transition-colors" href="#">Terms of Service</Link>
          <Link className="hover:text-slate-400 transition-colors" href="#">Status</Link>
        </div>
      </div>
    </div>
  );
}
