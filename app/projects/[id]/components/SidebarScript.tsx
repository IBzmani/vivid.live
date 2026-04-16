'use client';

import React, { useRef, useState, useEffect } from 'react';
import { FileText, Upload, ChevronDown, Drama, Smile, Skull, Zap, Rocket, Moon, Film, Mic2, Globe, Gauge, RotateCw, Camera, BookOpen, Palette, Box, Sparkles } from 'lucide-react';
import { Genre, VoiceName, VisualStyle } from '../types';

interface SidebarScriptProps {
  script: string;
  genre: Genre;
  visualStyle: VisualStyle;
  voice: VoiceName;
  language: string;
  playbackRate: number;
  onScriptChange: (val: string) => void;
  onGenreChange: (val: Genre) => void;
  onVisualStyleChange: (val: VisualStyle) => void;
  onVoiceChange: (val: VoiceName) => void;
  onLanguageChange: (val: string) => void;
  onPlaybackRateChange: (val: number) => void;
  onPreviewVoice: (voice: VoiceName) => void;
  previewingVoice: VoiceName | null;
  location: string;
  title: string;
  highlightText?: string;
  onUpload: (text: string) => void;
}

const SidebarScript: React.FC<SidebarScriptProps> = ({ 
  script, genre, visualStyle, voice, language, playbackRate,
  onScriptChange, onGenreChange, onVisualStyleChange, onVoiceChange, onLanguageChange, onPlaybackRateChange,
  onPreviewVoice, previewingVoice,
  location, title, highlightText, onUpload 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const styleDropdownRef = useRef<HTMLDivElement>(null);
  const voiceDropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

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
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target as Node)) {
        setIsStyleOpen(false);
      }
      if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(event.target as Node)) {
        setIsVoiceOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
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
  const visualStyles: VisualStyle[] = ['Cinematic', 'Anime', 'Comic Book', 'Watercolor', '3D Render'];
  const voices: VoiceName[] = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
  const languages = ['English', 'Spanish', 'French', 'German'];

  const getStyleIcon = (s: VisualStyle) => {
    switch (s) {
      case 'Cinematic':  return <Camera className="size-4" />;
      case 'Anime':      return <Sparkles className="size-4" />;
      case 'Comic Book': return <BookOpen className="size-4" />;
      case 'Watercolor': return <Palette className="size-4" />;
      case '3D Render':  return <Box className="size-4" />;
      default:           return <Film className="size-4" />;
    }
  };

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
      
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* Visual Style Selector */}
        <div className="space-y-2 relative" ref={styleDropdownRef}>
          <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Aesthetic Paradigm</span>
          
          <button 
            onClick={() => setIsStyleOpen(!isStyleOpen)}
            className="w-full flex items-center justify-between bg-black/40 border border-white/5 rounded px-3 py-2 text-[10px] font-bold text-violet-400 uppercase tracking-widest hover:bg-white/5 transition-all focus:outline-none focus:border-violet-500/50 group"
          >
            <div className="flex items-center gap-2">
              {getStyleIcon(visualStyle)}
              <span>{visualStyle}</span>
            </div>
            <ChevronDown className={`size-4 transition-transform duration-300 ${isStyleOpen ? 'rotate-180' : ''}`} />
          </button>

          {isStyleOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-obsidian border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="py-1">
                {visualStyles.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      onVisualStyleChange(s);
                      setIsStyleOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                      visualStyle === s 
                        ? 'bg-violet-600 text-white' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {getStyleIcon(s)}
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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

        {/* Voice Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2 relative" ref={voiceDropdownRef}>
            <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Voice Agent</span>
            <button 
              onClick={() => setIsVoiceOpen(!isVoiceOpen)}
              className="w-full flex items-center justify-between bg-black/40 border border-white/5 rounded px-3 py-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-2">
                <Mic2 className="size-3 text-primary" />
                <span>{voice}</span>
              </div>
              <ChevronDown className={`size-3 transition-transform ${isVoiceOpen ? 'rotate-180' : ''}`} />
            </button>
            {isVoiceOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-obsidian border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                {voices.map(v => (
                  <div key={v} className="flex items-center group/voice">
                    <button
                      onClick={() => { onVoiceChange(v); setIsVoiceOpen(false); }}
                      className={`flex-1 text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-primary hover:text-obsidian transition-all ${voice === v ? 'text-primary' : 'text-slate-400'}`}
                    >
                      {v}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewVoice(v);
                      }}
                      className="px-2 py-2 text-primary hover:bg-primary hover:text-obsidian transition-all"
                      title={`Preview ${v}`}
                    >
                      {previewingVoice === v ? (
                        <RotateCw className="size-3 animate-spin" />
                      ) : (
                        <Zap className="size-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 relative" ref={langDropdownRef}>
            <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Language</span>
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="w-full flex items-center justify-between bg-black/40 border border-white/5 rounded px-3 py-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-2">
                <Globe className="size-3 text-primary" />
                <span className="truncate">{language}</span>
              </div>
              <ChevronDown className={`size-3 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLangOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-obsidian border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden backdrop-blur-xl max-h-40 overflow-y-auto">
                {languages.map(l => (
                  <button
                    key={l}
                    onClick={() => { onLanguageChange(l); setIsLangOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-primary hover:text-obsidian transition-all ${language === l ? 'text-primary' : 'text-slate-400'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Playback Pace */}
        <div className="space-y-3 p-3 bg-black/40 border border-white/5 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="size-3 text-primary" />
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Playback Pace</span>
            </div>
            <span className="text-[10px] font-mono text-primary">{playbackRate.toFixed(1)}x</span>
          </div>
          <input 
            type="range" 
            min="0.5" 
            max="2.0" 
            step="0.1" 
            value={playbackRate}
            onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[7px] text-slate-600 font-bold uppercase tracking-tighter">
            <span>Slow</span>
            <span>Normal</span>
            <span>Fast</span>
          </div>
        </div>

        <div className="h-px bg-white/5"></div>

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
