'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import * as Lucide from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";

const ARCHETYPES = [
  {
    id: 'mentor',
    name: 'The Mentor',
    icon: Lucide.BrainCircuit,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    borderColor: 'border-indigo-500/30',
    description: 'Warm, authoritative, and guiding. Ideal for complex world-building and narrative structuring.'
  },
  {
    id: 'visionary',
    name: 'The Visionary',
    icon: Lucide.Lightbulb,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    description: 'High-energy, creative, and abstract. Suggests bold plot twists and unconventional imagery.'
  },
  {
    id: 'technical',
    name: 'The Technical Lead',
    icon: Lucide.Terminal,
    color: 'text-slate-300',
    bgColor: 'bg-slate-500/20',
    borderColor: 'border-slate-500/30',
    description: 'Precise, detail-oriented, and efficient. Focuses on continuity errors and physics simulations.'
  }
];

export default function SetupPage() {
  const router = useRouter();
  const [archetype, setArchetype] = React.useState('mentor');
  const [tone, setTone] = React.useState(70);
  const [noiseCancellation, setNoiseCancellation] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [agentMessage, setAgentMessage] = React.useState('Initializing neural pathways...');
  const [isTyping, setIsTyping] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    generateAgentIntro('mentor');
  }, []);

  const generateAgentIntro = async (archId: string) => {
    setIsTyping(true);
    const arch = ARCHETYPES.find(a => a.id === archId);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `You are a creative AI agent with the archetype: ${arch?.name}. ${arch?.description}. 
        Briefly introduce yourself to your new partner (the user) in 2 short sentences. 
        Stay in character.`,
      });
      setAgentMessage(response.text || "I am ready to build worlds with you.");
    } catch (error) {
      setAgentMessage(`I am your ${arch?.name}. I am ready to assist you in building your cinematic universe.`);
    } finally {
      setIsTyping(false);
    }
  };

  const handleArchetypeChange = (id: string) => {
    setArchetype(id);
    generateAgentIntro(id);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/agent-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archetype, tone, noiseCancellation }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-obsidian" />;

  return (
    <div className="min-h-screen bg-obsidian text-background-light font-display selection:bg-primary selection:text-obsidian overflow-hidden flex flex-col relative">
      <div className="film-grain"></div>
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,rgba(236,182,19,0.05)_0%,rgba(10,10,10,0)_70%)]"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 opacity-80">
            <div className="size-6 bg-white/10 rounded flex items-center justify-center text-white border border-white/5">
              <Lucide.Film className="size-4" />
            </div>
            <span className="text-sm font-bold tracking-tighter uppercase text-slate-400">
              Vivid.live <span className="text-primary mx-2">{"//"}</span> Setup
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Step 2 of 4</span>
            <div className="flex gap-1">
              <div className="h-1 w-6 bg-primary rounded-full"></div>
              <div className="h-1 w-6 bg-primary rounded-full"></div>
              <div className="h-1 w-6 bg-white/10 rounded-full"></div>
              <div className="h-1 w-6 bg-white/10 rounded-full"></div>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-10 space-y-2">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold tracking-tight text-white"
          >
            Initialize Voice Agent
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 font-light text-sm max-w-md mx-auto"
          >
            Calibrate your AI showrunner&apos;s personality and vocal characteristics for optimal collaboration.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-stretch">
          {/* Left Column: Archetypes */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-2 pl-1">Vocal Archetype</h3>
            {ARCHETYPES.map((arch) => (
              <button
                key={arch.id}
                onClick={() => handleArchetypeChange(arch.id)}
                className={`text-left p-5 rounded-xl transition-all duration-300 border group ${
                  archetype === arch.id 
                    ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(236,182,19,0.15)]' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-full ${arch.bgColor} ${arch.color} flex items-center justify-center border ${arch.borderColor}`}>
                      <arch.icon className="size-5" />
                    </div>
                    <span className="font-bold text-sm text-white">{arch.name}</span>
                  </div>
                  {archetype === arch.id && <Lucide.CheckCircle2 className="size-5 text-primary" />}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{arch.description}</p>
              </button>
            ))}
          </div>

          {/* Center Column: Orb & Agent Feedback */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative min-h-[400px]">
            <div className="relative py-12 flex items-center justify-center w-full">
              <div className="relative flex items-center justify-center">
                <motion.div 
                  animate={{ 
                    scale: isTyping ? [1, 1.2, 1] : [1, 1.05, 1],
                    opacity: isTyping ? [0.5, 1, 0.5] : 0.8
                  }}
                  transition={{ repeat: Infinity, duration: isTyping ? 1 : 3 }}
                  className="size-32 bg-primary/20 rounded-full blur-2xl absolute"
                />
                <motion.div 
                  animate={{ scale: isTyping ? [1, 1.1, 1] : 1 }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="size-20 bg-primary rounded-full shadow-[0_0_40px_rgba(236,182,19,0.5)] z-10 flex items-center justify-center"
                >
                  <Lucide.Zap className="size-8 text-obsidian fill-current" />
                </motion.div>
                
                {/* Ripple Rings */}
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 3, delay: i * 1 }}
                    className="absolute size-20 border border-primary/30 rounded-full"
                  />
                ))}
              </div>
            </div>

            <div className="mt-8 text-center space-y-4 max-w-xs">
              <div className="text-[10px] font-mono text-primary animate-pulse tracking-widest uppercase">
                {isTyping ? 'Calibrating...' : 'Agent Active'}
              </div>
              <AnimatePresence mode="wait">
                <motion.p 
                  key={agentMessage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-slate-300 font-medium italic leading-relaxed"
                >
                  &quot;{agentMessage}&quot;
                </motion.p>
              </AnimatePresence>
              <div className="text-[10px] text-slate-500 font-medium">Say &quot;Hello Vivid&quot; to test calibration</div>
            </div>

            {/* Mic Meter (Visual Only) */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-48 w-1.5 bg-white/5 rounded-full flex flex-col justify-end p-[1px] gap-[2px]">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-full h-[8%] rounded-full transition-all duration-300 ${
                    i < 3 ? 'bg-green-500' : i < 6 ? 'bg-yellow-500' : i < 8 ? 'bg-orange-500' : 'bg-red-500'
                  } ${i < 4 ? 'opacity-100' : 'opacity-20'}`}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Settings */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div>
              <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-6 pl-1">Directorial Tone</h3>
              <div className="glass-panel p-6 rounded-xl border border-white/5">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={tone}
                  onChange={(e) => setTone(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary mb-6"
                />
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <div className="text-left">
                    Pragmatic<br/>
                    <span className="text-[8px] font-normal normal-case opacity-60">Efficient, Clear</span>
                  </div>
                  <div className="text-center text-primary">Balanced</div>
                  <div className="text-right">
                    Artistic<br/>
                    <span className="text-[8px] font-normal normal-case opacity-60">Abstract, Poetic</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 pl-1">Input Configuration</h3>
              <div className="glass-panel rounded-xl overflow-hidden divide-y divide-white/5 border border-white/5">
                <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <Lucide.Mic className="size-4 text-slate-400 group-hover:text-primary" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">Microphone Input</div>
                      <div className="text-[9px] text-slate-500">Default - System Mic</div>
                    </div>
                  </div>
                  <Lucide.ChevronDown className="size-4 text-slate-600" />
                </div>
                <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <Lucide.Volume2 className="size-4 text-slate-400 group-hover:text-primary" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">Output Device</div>
                      <div className="text-[9px] text-slate-500">System Default</div>
                    </div>
                  </div>
                  <Lucide.ChevronDown className="size-4 text-slate-600" />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lucide.AudioLines className="size-4 text-slate-400" />
                    <div className="text-xs font-bold text-slate-200">Noise Cancellation</div>
                  </div>
                  <button 
                    onClick={() => setNoiseCancellation(!noiseCancellation)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${noiseCancellation ? 'bg-primary' : 'bg-white/10'}`}
                  >
                    <motion.div 
                      animate={{ x: noiseCancellation ? 22 : 2 }}
                      className="absolute top-1 size-3 bg-white rounded-full"
                    />
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={isLoading}
              className="w-full bg-primary text-obsidian px-6 py-5 rounded-xl text-lg font-black uppercase tracking-widest shadow-[0_0_20px_rgba(236,182,19,0.3)] hover:scale-[1.02] transition-transform active:scale-[0.98] flex items-center justify-center gap-3 mt-auto disabled:opacity-50"
            >
              {isLoading ? (
                'Synchronizing...'
              ) : (
                <>
                  <Lucide.Save className="size-5" />
                  Synchronize Agent
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Footer Status */}
      <div className="fixed bottom-0 w-full px-6 py-4 bg-obsidian/80 backdrop-blur-md border-t border-white/5 flex justify-between items-center text-[10px] uppercase tracking-widest text-slate-500 z-50">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
          Server Connection: Stable (12ms)
        </div>
        <div className="hidden md:block font-mono">
          Vivid Core v2.4.1
        </div>
      </div>
    </div>
  );
}
