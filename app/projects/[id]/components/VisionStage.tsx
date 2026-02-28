'use client';

import React, { useState } from 'react';
import { Clapperboard, Pencil, Play, PlusSquare, RotateCw } from 'lucide-react';
import { Frame } from '../types';

interface VisionStageProps {
  frames: Frame[];
  selectedFrameId: string | null;
  onSelectFrame: (id: string) => void;
  onRefine: (id: string, prompt: string, coord?: { x: number, y: number }) => void;
  onPlayAudio: (id: string) => void;
  onAppendFrame: () => void;
}

const VisionStage: React.FC<VisionStageProps> = ({ frames, selectedFrameId, onSelectFrame, onRefine, onPlayAudio, onAppendFrame }) => {
  const [instruction, setInstruction] = useState("");
  const [clickCoord, setClickCoord] = useState<{ x: number, y: number } | null>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>, frameId: string) => {
    if (selectedFrameId !== frameId) {
      onSelectFrame(frameId);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setClickCoord({ x, y });
  };

  const handleRepaint = () => {
    if (selectedFrameId && instruction) {
      onRefine(selectedFrameId, instruction, clickCoord || undefined);
      setInstruction("");
      setClickCoord(null);
    }
  };

  return (
    <section className="flex-1 flex flex-col bg-obsidian overflow-hidden">
      <div className="p-4 border-b border-white/5 flex justify-between items-center glass-panel z-20">
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <Clapperboard className="text-primary size-4" />
            Storyboard Ribbon
          </h3>
          <div className="h-4 w-px bg-white/10"></div>
          <p className="text-[10px] text-slate-500 font-medium">Mapped to Sequence Arc</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center px-12 gap-12 scroll-smooth custom-scrollbar">
        {frames.map((frame) => (
          <div 
            key={frame.id} 
            className={`flex-shrink-0 group relative transition-all duration-500 ${selectedFrameId === frame.id ? 'w-[640px] z-10' : 'w-80 grayscale-[0.8] hover:grayscale-0 opacity-60 hover:opacity-100'}`}
          >
            <div 
              onClick={(e) => handleImageClick(e, frame.id)}
              className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer shadow-2xl ${selectedFrameId === frame.id ? 'border-primary ring-8 ring-primary/5' : 'border-white/5'}`}
            >
              <img src={frame.image} alt={frame.prompt} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ${selectedFrameId === frame.id ? 'scale-100' : 'scale-110'}`} />
              
              {selectedFrameId === frame.id && clickCoord && (
                <div className="absolute size-6 border-2 border-primary rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-30" style={{ left: `${clickCoord.x}%`, top: `${clickCoord.y}%` }}>
                  <div className="size-1 bg-primary rounded-full animate-ping"></div>
                </div>
              )}

              {(frame.isGenerating || frame.isGeneratingAudio) && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-40">
                  <RotateCw className="size-8 text-primary animate-spin mb-3" />
                  <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Processing...</span>
                </div>
              )}

              {selectedFrameId === frame.id && !frame.isGenerating && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onPlayAudio(frame.id); }}
                    className="absolute top-4 right-4 size-10 bg-primary/90 text-obsidian rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95 z-40"
                  >
                    <Play className="size-5 fill-current" />
                  </button>

                  <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transition-all z-40" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2 bg-black/80 backdrop-blur-xl p-2 rounded-xl border border-white/10 shadow-2xl">
                      <Pencil className="text-primary size-4 ml-2" />
                      <input 
                        className="flex-1 bg-transparent border-none focus:ring-0 text-[11px] placeholder:text-slate-500 text-white" 
                        placeholder={clickCoord ? `Repainting [${clickCoord.x}, ${clickCoord.y}]...` : "Target and Paint..."} 
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRepaint(); }}
                      />
                      <button onClick={handleRepaint} className="bg-primary text-obsidian px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">REPAINT</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        <div 
          onClick={onAppendFrame}
          className="flex-shrink-0 w-80 aspect-video rounded-xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center hover:bg-white/5 transition-all cursor-pointer group"
        >
          <PlusSquare className="text-slate-600 group-hover:text-primary transition-colors size-8" />
          <span className="text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-widest">Append Sequence</span>
        </div>
      </div>
    </section>
  );
};

export default VisionStage;
