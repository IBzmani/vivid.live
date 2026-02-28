'use client';

import React, { useRef, useState, useEffect } from 'react';
import { FileText, Upload, ChevronDown, Drama, Smile, Skull, Zap, Rocket, Moon, Film } from 'lucide-react';
import { Genre } from '../types';

interface SidebarScriptProps {
  script: string;
  genre: Genre;
  onScriptChange: (val: string) => void;
  onGenreChange: (val: Genre) => void;
  location: string;
  title: string;
  highlightText?: string;
  onUpload: (text: string) => void;
}

const SidebarScript: React.FC<SidebarScriptProps> = ({ script, genre, onScriptChange, onGenreChange, location, title, highlightText, onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => onUpload(e.target?.result as string);
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsGenreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderScript = () => {
    if (!highlightText) return script;
    const escapedHighlight = highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = script.split(new RegExp(`(${escapedHighlight})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlightText.toLowerCase() ? 
      <span key={i} className="bg-primary/20 text-primary border-b border-primary/50 font-semibold px-0.5">{part}</span> : 
      part
    );
  };

  const genres: Genre[] = ['Drama', 'Comedy', 'Horror', 'Action', 'Sci-Fi', 'Noir'];

  const getGenreIcon = (g: Genre) => {
    switch (g) {
      case 'Drama': return <Drama className="size-4" />;
      case 'Comedy': return <Smile className="size-4" />;
      case 'Horror': return <Skull className="size-4" />;
      case 'Action': return <Zap className="size-4" />;
      case 'Sci-Fi': return <Rocket className="size-4" />;
      case 'Noir': return <Moon className="size-4" />;
      default: return <Film className="size-4" />;
    }
  };

  return (
    <aside className="w-80 border-r border-white/5 bg-obsidian flex flex-col">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-2">
          <FileText className="text-primary size-4" />
          <span className="font-bold text-xs uppercase tracking-[0.2em] text-slate-500">Manuscript</span>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold text-slate-400 transition-all border border-white/5"
        >
          <Upload className="size-3" /> IMPORT
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md" onChange={handleFileChange} />
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {/* Custom Genre Selection UI */}
        <div className="space-y-2 relative" ref={dropdownRef}>
          <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Atmospheric Profile</span>
          
          <button 
            onClick={() => setIsGenreOpen(!isGenreOpen)}
            className="w-full flex items-center justify-between bg-black/40 border border-white/5 rounded px-3 py-2 text-[10px] font-bold text-primary uppercase tracking-widest hover:bg-white/5 transition-all focus:outline-none focus:border-primary/50 group"
          >
            <div className="flex items-center gap-2">
              {getGenreIcon(genre)}
              <span>{genre}</span>
            </div>
            <ChevronDown className={`size-4 transition-transform duration-300 ${isGenreOpen ? 'rotate-180' : ''}`} />
          </button>

          {isGenreOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-obsidian border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="py-1">
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      onGenreChange(g);
                      setIsGenreOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                      genre === g 
                        ? 'bg-primary text-obsidian' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {getGenreIcon(g)}
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <h1 className="text-white text-lg font-bold leading-tight mt-2">{title}</h1>
        <p className="text-slate-500 uppercase text-[9px] tracking-widest border-b border-white/5 pb-2">{location}</p>
        
        <div className="relative flex-1">
          <textarea 
            className="absolute inset-0 w-full h-full bg-transparent border-none focus:ring-0 text-transparent caret-white text-sm leading-relaxed resize-none p-0 z-10"
            value={script}
            onChange={(e) => onScriptChange(e.target.value)}
          />
          <div className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap select-none z-0">
            {renderScript()}
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Atmosphere Scan</span>
          <div className="size-1.5 rounded-full bg-primary animate-pulse"></div>
        </div>
        <div className="flex items-end gap-[3px] h-10 w-full">
          {[2, 6, 8, 4, 10, 5, 12, 6, 8, 4, 3, 7, 5, 9, 2, 6, 4, 8, 3, 5, 7, 9, 4, 2].map((h, i) => (
            <div key={i} className="flex-1 bg-primary/40 rounded-t-sm" style={{ height: `${h * 2.5}px` }}></div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default SidebarScript;
