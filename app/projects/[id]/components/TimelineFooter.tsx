'use client';

import React from 'react';
import { Activity, Camera, Zap, Clock } from 'lucide-react';

interface TimelineFooterProps {
  sentimentData: number[];
  currentBrief?: {
    emotionalArc: string;
    lightingScheme: string;
    cameraLogic: string;
    pacing: string;
  };
  shotType?: string;
}

const TimelineFooter: React.FC<TimelineFooterProps> = ({ sentimentData, currentBrief, shotType }) => {
  return (
    <footer className="h-20 bg-obsidian border-t border-white/5 px-6 flex items-center justify-between z-20">
      <div className="flex items-center gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            <Activity className="size-3 text-primary" />
            Emotional Arc
          </div>
          <div className="flex items-end gap-[2px] h-6 w-48">
            {sentimentData.map((h, i) => (
              <div key={i} className="flex-1 bg-primary/20 rounded-t-[1px]" style={{ height: `${(h / 12) * 100}%` }}></div>
            ))}
          </div>
        </div>

        <div className="h-10 w-px bg-white/10"></div>

        <div className="flex gap-10">
          <div className="space-y-1">
            <div className="text-[9px] text-slate-600 uppercase tracking-widest font-black">Shot Type</div>
            <div className="flex items-center gap-2">
              <Camera className="size-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">{shotType || 'Standard'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[9px] text-slate-600 uppercase tracking-widest font-black">Lighting</div>
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">{currentBrief?.lightingScheme || 'Natural'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[9px] text-slate-600 uppercase tracking-widest font-black">Pacing</div>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">{currentBrief?.pacing || 'Moderate'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-[9px] text-slate-600 uppercase tracking-widest font-black">Sequence Progress</div>
          <div className="text-xs font-mono text-primary">00:42 / 02:15</div>
        </div>
        <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-primary w-1/3"></div>
        </div>
      </div>
    </footer>
  );
};

export default TimelineFooter;
