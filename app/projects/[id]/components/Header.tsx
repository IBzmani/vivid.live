'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Film, RotateCw, Zap, Settings, Bell, Coins, Sparkles } from 'lucide-react';
import { PlanTier } from '@/lib/plans';

interface HeaderProps {
  onGenerate: () => void;
  onExport: () => void;
  isGenerating: boolean;
  isExporting: boolean;
  credits?: number;
  tier?: PlanTier;
  onOpenPricing?: (tab?: 'plans' | 'topup') => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onGenerate, 
  onExport, 
  isGenerating, 
  isExporting,
  credits = 30,
  tier = 'free',
  onOpenPricing
}) => {
  return (
    <header className="flex items-center justify-between h-14 border-b border-white/5 px-6 bg-obsidian z-20">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="size-6 text-primary">
            <Film className="size-full" />
          </div>
          <h2 className="text-white text-lg font-bold tracking-tight uppercase">Vivid <span className="text-primary">Studio</span></h2>
        </Link>
        <div className="h-6 w-px bg-white/10"></div>
        <nav className="flex items-center gap-6">
          <a className="text-primary text-sm font-medium border-b-2 border-primary pb-4 pt-4" href="#">Workspace</a>
          <Link href="/dashboard" className="text-slate-400 text-sm font-medium hover:text-white transition-colors">Projects</Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Credit Counter Pill */}
        {onOpenPricing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPricing('topup')}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 via-white/5 to-white/5 hover:from-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 text-xs font-bold transition-all shadow-sm group"
              title="Click to refill credits or upgrade"
            >
              <Coins className="size-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-white font-mono">{credits.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-sans uppercase">Credits</span>
              <span className="size-4 rounded bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-black leading-none ml-1 group-hover:bg-amber-400 group-hover:text-obsidian transition-colors">
                +
              </span>
            </button>

            {tier === 'free' && (
              <button
                onClick={() => onOpenPricing('plans')}
                className="hidden sm:flex items-center gap-1.5 bg-primary/15 text-primary border border-primary/30 px-2.5 py-1.5 rounded-lg text-[11px] font-black uppercase hover:bg-primary hover:text-obsidian transition-all"
              >
                <Sparkles className="size-3" />
                <span>Upgrade</span>
              </button>
            )}
          </div>
        )}

        <div className="hidden lg:flex items-center bg-white/5 rounded-lg px-3 py-1.5 gap-2 border border-white/5">
          <Search className="text-slate-400 size-4" />
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm w-36 placeholder:text-slate-500 text-white" 
            placeholder="Search project..." 
            type="text"
          />
        </div>
        
        <button 
          onClick={onExport}
          disabled={isExporting || isGenerating}
          className={`flex items-center gap-2 bg-white/5 text-slate-300 px-4 py-1.5 rounded-lg font-bold text-sm border border-white/10 hover:bg-white/10 transition-all ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Film className="size-4" />
          <span>{isExporting ? 'Exporting...' : 'Export Cinema'}</span>
        </button>

        <button 
          onClick={onGenerate}
          disabled={isGenerating || isExporting}
          className={`flex items-center gap-2 bg-primary text-obsidian px-4 py-1.5 rounded-lg font-bold text-sm shadow-[0_0_15px_rgba(236,182,19,0.3)] hover:brightness-110 transition-all ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isGenerating ? (
            <RotateCw className="size-4 animate-spin" />
          ) : (
            <Zap className="size-4" />
          )}
          <span>{isGenerating ? 'Generating...' : 'Generate Scene'}</span>
        </button>

        <div className="flex gap-1">
          {onOpenPricing && (
            <button 
              onClick={() => onOpenPricing('plans')}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              title="Plans & Billing"
            >
              <Settings className="size-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

