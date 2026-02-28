'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Sparkles, Upload, Download, Trash2, X, Plus, RotateCw } from 'lucide-react';
import { VisualManifest } from '../types';

interface WorldBibleProps {
  manifest: VisualManifest;
  onAddChar: (name: string, desc: string, imageUrl?: string) => void;
  onRemoveChar: (id: string) => void;
  onAddEnv: (name: string, desc: string, imageUrl?: string) => void;
  onRemoveEnv: (id: string) => void;
  onSelectAsset: (id: string, type: 'char' | 'env') => void;
  selectedFrameAssets: { charId?: string; envId?: string };
}

type MenuState = 'char' | 'env' | null;

const WorldBible: React.FC<WorldBibleProps> = ({ 
  manifest, onAddChar, onRemoveChar, onAddEnv, onRemoveEnv, onSelectAsset, selectedFrameAssets 
}) => {
  const [openMenu, setOpenMenu] = useState<MenuState>(null);
  const [activeForm, setActiveForm] = useState<MenuState>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  
  const charInputRef = useRef<HTMLInputElement>(null);
  const envInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>, type: 'char' | 'env') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (type === 'char') onAddChar(name || file.name.split('.')[0], desc, dataUrl);
        else onAddEnv(name || file.name.split('.')[0], desc, dataUrl);
        resetForm();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${filename.replace(/\s+/g, '_')}_plate.png`;
    link.click();
  };

  const resetForm = () => {
    setName('');
    setDesc('');
    setOpenMenu(null);
    setActiveForm(null);
  };

  const renderAssetImage = (imageUrl: string, alt: string, id: string, type: 'char' | 'env') => {
    const isLoading = imageUrl.startsWith('loading://');
    const isLinked = (type === 'char' && selectedFrameAssets.charId === id) || (type === 'env' && selectedFrameAssets.envId === id);
    
    if (isLoading) {
      return (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
          <RotateCw className="size-6 text-primary/40 animate-spin mb-2" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/80 animate-pulse">Synthesis...</span>
        </div>
      );
    }

    return (
      <>
        <img 
          src={imageUrl} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          alt={alt} 
        />
        {isLinked && (
          <div className="absolute top-2 left-2 bg-primary text-obsidian text-[7px] font-black uppercase px-1.5 py-0.5 rounded shadow-xl z-20 animate-in zoom-in-50">
            Linked to Frame
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button 
            onClick={(e) => { e.stopPropagation(); handleDownload(imageUrl, alt); }}
            className="size-7 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-primary hover:text-obsidian transition-all border border-white/10"
          >
            <Download className="size-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); type === 'char' ? onRemoveChar(id) : onRemoveEnv(id); }}
            className="size-7 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </>
    );
  };

  return (
    <aside className="w-80 border-l border-white/5 bg-obsidian flex flex-col">
      <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BookOpen className="text-primary size-4" />
          <span className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-500">Visual Source of Truth</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-10 custom-scrollbar pb-20">
        <input type="file" ref={charInputRef} className="hidden" accept="image/*" onChange={e => handleFileImport(e, 'char')} />
        <input type="file" ref={envInputRef} className="hidden" accept="image/*" onChange={e => handleFileImport(e, 'env')} />

        <section>
          <div className="flex items-center justify-between mb-4 relative">
            <h4 className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">Actor Portfolio</h4>
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'char' ? null : 'char'); }}
                className={`size-6 rounded flex items-center justify-center transition-all ${openMenu === 'char' ? 'bg-primary text-obsidian' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
              >
                {openMenu === 'char' ? <X className="size-4" /> : <Plus className="size-4" />}
              </button>
              {openMenu === 'char' && (
                <div 
                  className="absolute right-0 top-7 w-48 bg-obsidian border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl py-1 animate-in fade-in zoom-in duration-200"
                  onClick={e => e.stopPropagation()}
                >
                  <button 
                    onClick={() => { setActiveForm('char'); setOpenMenu(null); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-primary hover:text-obsidian transition-all"
                  >
                    <Sparkles className="size-4" />
                    AI Synthesis
                  </button>
                  <button 
                    onClick={() => { 
                      charInputRef.current?.click();
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-primary hover:text-obsidian transition-all"
                  >
                    <Upload className="size-4" />
                    Import Local
                  </button>
                </div>
              )}
            </div>
          </div>

          {activeForm === 'char' && (
            <div className="mb-6 p-4 bg-black/40 rounded-xl border border-primary/20 space-y-3 animate-in slide-in-from-top-2 duration-300">
              <input className="w-full bg-black/40 border border-white/10 rounded text-xs text-white px-2 py-1" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
              <textarea className="w-full bg-black/40 border border-white/10 rounded text-xs text-white h-20 resize-none px-2 py-1" placeholder="Brief..." value={desc} onChange={e => setDesc(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={resetForm} className="flex-1 text-[10px] font-bold uppercase text-slate-500">Cancel</button>
                <button onClick={() => { onAddChar(name, desc); resetForm(); }} className="flex-[2] bg-primary text-obsidian py-2 rounded text-[10px] font-black uppercase">Synthesize</button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {manifest.characters.map(char => (
              <div key={char.id} className="group relative cursor-pointer" onClick={() => onSelectAsset(char.id, 'char')}>
                <div className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group-hover:border-primary/40 ${selectedFrameAssets.charId === char.id ? 'border-primary ring-4 ring-primary/5' : 'border-white/5'}`}>
                  {renderAssetImage(char.image, char.name, char.id, 'char')}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                    <p className="text-[11px] font-black text-white uppercase tracking-wider">{char.name}</p>
                    <p className="text-[8px] text-primary font-bold uppercase tracking-widest mt-0.5">{char.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 relative">
            <h4 className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">Location Plates</h4>
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'env' ? null : 'env'); }}
                className={`size-6 rounded flex items-center justify-center transition-all ${openMenu === 'env' ? 'bg-primary text-obsidian' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
              >
                {openMenu === 'env' ? <X className="size-4" /> : <Plus className="size-4" />}
              </button>
              {openMenu === 'env' && (
                <div 
                  className="absolute right-0 top-7 w-48 bg-obsidian border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl py-1 animate-in fade-in zoom-in duration-200"
                  onClick={e => e.stopPropagation()}
                >
                  <button 
                    onClick={() => { setActiveForm('env'); setOpenMenu(null); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-primary hover:text-obsidian transition-all"
                  >
                    <Sparkles className="size-4" />
                    AI Synthesis
                  </button>
                  <button 
                    onClick={() => { 
                      envInputRef.current?.click();
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-primary hover:text-obsidian transition-all"
                  >
                    <Upload className="size-4" />
                    Import Local
                  </button>
                </div>
              )}
            </div>
          </div>

          {activeForm === 'env' && (
            <div className="mb-6 p-4 bg-black/40 rounded-xl border border-primary/20 space-y-3 animate-in slide-in-from-top-2 duration-300">
              <input className="w-full bg-black/40 border border-white/10 rounded text-xs text-white px-2 py-1" placeholder="Location Name" value={name} onChange={e => setName(e.target.value)} />
              <textarea className="w-full bg-black/40 border border-white/10 rounded text-xs text-white h-20 resize-none px-2 py-1" placeholder="Brief..." value={desc} onChange={e => setDesc(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={resetForm} className="flex-1 text-[10px] font-bold uppercase text-slate-500">Cancel</button>
                <button onClick={() => { onAddEnv(name, desc); resetForm(); }} className="flex-[2] bg-primary text-obsidian py-2 rounded text-[10px] font-black uppercase">Synthesize</button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {manifest.environments.map(env => (
              <div key={env.id} className="group relative cursor-pointer" onClick={() => onSelectAsset(env.id, 'env')}>
                <div className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all group-hover:border-primary/40 ${selectedFrameAssets.envId === env.id ? 'border-primary ring-4 ring-primary/5' : 'border-white/5'}`}>
                  {renderAssetImage(env.image, env.name, env.id, 'env')}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                    <p className="text-[10px] font-black text-white uppercase tracking-wider">{env.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
};

export default WorldBible;
