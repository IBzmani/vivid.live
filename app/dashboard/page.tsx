import Link from 'next/link';
import { Film } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center font-display">
      <div className="absolute top-8 left-8 z-50 flex items-center gap-3">
        <div className="size-8 text-primary flex items-center justify-center">
          <Film className="size-6 fill-current" />
        </div>
        <Link href="/">
          <h1 className="text-white text-2xl font-bold tracking-tight hover:text-primary transition-colors cursor-pointer">Vivid.live</h1>
        </Link>
      </div>
      
      <div className="text-center glass-panel p-12 rounded-3xl border border-white/10 max-w-lg">
        <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
          <Film className="size-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Studio Dashboard</h1>
        <p className="text-slate-400 mb-8">Welcome to Vivid.live. You have successfully authenticated and accessed the secure studio environment.</p>
        
        <Link href="/" className="bg-primary text-obsidian px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:scale-105 transition-transform inline-block">
          Return Home
        </Link>
      </div>
    </div>
  );
}
