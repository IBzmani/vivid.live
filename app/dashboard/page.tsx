'use client';

import * as React from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ARCHETYPE_MAP: Record<string, any> = {
  mentor: { name: 'The Mentor', icon: Lucide.BrainCircuit, color: 'text-indigo-400' },
  visionary: { name: 'The Visionary', icon: Lucide.Lightbulb, color: 'text-emerald-400' },
  technical: { name: 'The Technical Lead', icon: Lucide.Terminal, color: 'text-slate-300' }
};

export default function DashboardPage() {
  const [settings, setSettings] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [agentMessage, setAgentMessage] = React.useState('Awaiting your direction...');

  React.useEffect(() => {
    fetch('/api/user/agent-settings/get')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(data.settings);
          setAgentMessage(`Welcome back. I am calibrated to your ${data.settings.archetype} profile. What shall we build today?`);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const arch = settings ? ARCHETYPE_MAP[settings.archetype] : ARCHETYPE_MAP.mentor;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-display relative overflow-hidden">
      <div className="film-grain"></div>
      
      {/* Navigation */}
      <div className="absolute top-8 left-8 z-50 flex items-center gap-3">
        <div className="size-8 text-primary flex items-center justify-center">
          <Lucide.Film className="size-6 fill-current" />
        </div>
        <Link href="/">
          <h1 className="text-white text-2xl font-bold tracking-tight hover:text-primary transition-colors cursor-pointer">Vivid.live</h1>
        </Link>
      </div>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 p-8 max-w-7xl mx-auto w-full relative z-10">
        {/* Left: Main Content */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-5xl font-black tracking-tighter leading-tight">
              Studio <span className="text-primary italic">Dashboard</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-lg mx-auto lg:mx-0 font-light">
              Your production environment is ready. Collaborate with your agent to generate cinematic assets, storyboards, and final renders.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group text-left">
              <Lucide.Sparkles className="size-6 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold mb-1">Generate Assets</h3>
              <p className="text-xs text-slate-500">Create high-fidelity characters and environments.</p>
            </button>
            <button className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group text-left">
              <Lucide.Film className="size-6 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold mb-1">Storyboard Flow</h3>
              <p className="text-xs text-slate-500">Sequence your narrative into cinematic beats.</p>
            </button>
          </div>
        </div>

        {/* Right: Live Agent Interaction */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full lg:w-[400px] glass-panel rounded-3xl border border-white/10 p-8 flex flex-col gap-8 relative gold-glow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                {arch && <arch.icon className={`size-6 ${arch.color}`} />}
              </div>
              <div>
                <h4 className="text-sm font-bold">{arch?.name || 'Vivid Agent'}</h4>
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Live Calibration</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                <Lucide.Mic className="size-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Agent Visualizer */}
          <div className="h-40 flex items-center justify-center relative">
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="size-32 bg-primary/20 rounded-full blur-3xl absolute"
            />
            <div className="relative">
              <Lucide.Zap className="size-12 text-primary animate-pulse" />
              {[1, 2].map(i => (
                <motion.div 
                  key={i}
                  animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i }}
                  className="absolute inset-0 border border-primary/30 rounded-full"
                />
              ))}
            </div>
          </div>

          {/* Chat Feed */}
          <div className="flex-1 bg-black/20 rounded-2xl p-4 border border-white/5 min-h-[120px] flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Lucide.MessageSquare className="size-3 text-primary" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Agent Feed</span>
            </div>
            <p className="text-sm text-slate-300 italic font-light leading-relaxed">
              &quot;{agentMessage}&quot;
            </p>
          </div>

          <div className="flex gap-3">
            <input 
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="Direct your agent..."
            />
            <button className="size-12 bg-primary text-obsidian rounded-xl flex items-center justify-center gold-glow hover:scale-105 transition-transform">
              <Lucide.Zap className="size-5 fill-current" />
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <div className="p-8 flex justify-between items-center text-[10px] uppercase tracking-[0.3em] text-slate-600 border-t border-white/5">
        <span>© 2024 VIVID INDUSTRIES</span>
        <div className="flex gap-6">
          <Link href="/setup" className="hover:text-primary transition-colors">Recalibrate Agent</Link>
          <Link href="/" className="hover:text-primary transition-colors">Sign Out</Link>
        </div>
      </div>
    </div>
  );
}

