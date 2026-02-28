'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Film, RotateCw, Zap, Settings, Bell } from 'lucide-react';

interface HeaderProps {
  onGenerate: () => void;
  onExport: () => void;
  isGenerating: boolean;
  isExporting: boolean;
}

const Header: React.FC<HeaderProps> = ({ onGenerate, onExport, isGenerating, isExporting }) => {
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
          <a className="text-slate-400 text-sm font-medium hover:text-white transition-colors" href="#">Library</a>
          <a className="text-slate-400 text-sm font-medium hover:text-white transition-colors" href="#">Collaborators</a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-white/5 rounded-lg px-3 py-1.5 gap-2 border border-white/5">
          <Search className="text-slate-400 size-4" />
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder:text-slate-500 text-white" 
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
          <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <Settings className="size-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all relative">
            <Bell className="size-5" />
            <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-obsidian"></span>
          </button>
        </div>
        <div 
          className="size-8 rounded-full bg-cover bg-center border border-white/10 cursor-pointer" 
          style={{ backgroundImage: "url('https://picsum.photos/id/64/100/100')" }}
        ></div>
      </div>
    </header>
  );
};

export default Header;
