import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Film, Play, Pause, Volume2, Maximize, FileText, Sparkles, Mic, 
  RotateCcw, MonitorPlay, MessageSquare, Fingerprint, Component, 
  Eye, Sun, Video, Sliders, Wand2, Check 
} from "lucide-react";

export default function Page() {
  return (
    <div className="relative">
      <div className="film-grain"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass-panel rounded-full px-8 py-3 border-white/5">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-primary rounded flex items-center justify-center text-obsidian">
              <Film className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase">
              Vivid.live
            </span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a
              className="text-sm font-medium hover:text-primary transition-colors"
              href="#"
            >
              Canvas
            </a>
            <a
              className="text-sm font-medium hover:text-primary transition-colors"
              href="#"
            >
              World Bible
            </a>
            <a
              className="text-sm font-medium hover:text-primary transition-colors"
              href="#"
            >
              Director
            </a>
            <a
              className="text-sm font-medium hover:text-primary transition-colors"
              href="#"
            >
              Soundscape
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="bg-primary text-obsidian px-6 py-2 rounded-lg text-sm font-bold hover:brightness-110 transition-all uppercase tracking-wider"
            >
              Request Access
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-obsidian/40 to-obsidian z-10"></div>
          <Image
            src="https://picsum.photos/1920/1080"
            alt="Cinematic wide shot of a futuristic creator collaborating with a golden holographic AI entity"
            fill
            className="object-cover opacity-40"
            referrerPolicy="no-referrer"
            priority
          />
        </div>
        <div className="relative z-10 max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            The Multimodal Evolution
          </div>
          <h1 className="text-5xl md:text-8xl font-extrabold tracking-tighter mb-8 leading-[0.9]">
            Co-Create Your{" "}
            <span className="text-primary italic">Cinematic Universe</span> in
            Real-Time.
          </h1>
          <p className="text-lg md:text-2xl text-slate-300 font-light max-w-2xl mx-auto mb-12 leading-relaxed">
            Meet Vivid.live, your Multimodal Showrunner Agent. A professional
            film production evolution for the future of storytelling.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button suppressHydrationWarning className="w-full sm:w-auto bg-primary text-obsidian px-10 py-5 rounded-xl text-lg font-black uppercase tracking-widest gold-glow hover:scale-105 transition-transform">
              Start Directing
            </button>
            <button suppressHydrationWarning className="w-full sm:w-auto glass-panel text-white border-white/10 px-10 py-5 rounded-xl text-lg font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
              Watch Showreel
            </button>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 z-10">
          <span className="text-[10px] uppercase tracking-[0.3em]">
            Scroll to Enter Suite
          </span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent"></div>
        </div>
      </section>

      {/* Product Demo */}
      <section className="py-32 px-6 bg-obsidian border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-4">
              Product Demo
            </h2>
            <h3 className="text-4xl md:text-6xl font-bold tracking-tight">
              The Live Showrunner in Action
            </h3>
          </div>
          <div className="relative group max-w-6xl mx-auto mb-20">
            <div className="aspect-video rounded-3xl overflow-hidden glass-panel border border-white/10 relative gold-glow">
              <Image
                src="https://picsum.photos/1920/1080"
                alt="Live Showrunner Demo Interface Placeholder"
                fill
                className="object-cover opacity-60"
                referrerPolicy="no-referrer"
              />
              <button suppressHydrationWarning className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-24 bg-primary text-obsidian rounded-full flex items-center justify-center gold-glow hover:scale-110 transition-transform">
                <Play className="size-10 fill-current ml-1" />
              </button>
              <div className="absolute bottom-6 left-6 right-6 h-16 glass-panel rounded-xl flex items-center px-6 gap-6 border-white/10">
                <Pause className="size-5 text-primary fill-current" />
                <div className="flex-1 h-1 bg-white/10 rounded-full relative">
                  <div className="absolute inset-y-0 left-0 w-1/3 bg-primary rounded-full"></div>
                  <div className="absolute top-1/2 left-1/3 -translate-y-1/2 size-3 bg-white rounded-full shadow-lg"></div>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
                  <span>01:24 / 04:50</span>
                  <Volume2 className="size-4" />
                  <Maximize className="size-4" />
                </div>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-primary" />
                <h4 className="font-bold uppercase tracking-wider text-xs">
                  Real-time Script Narration
                </h4>
              </div>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Watch as the agent processes live script adjustments, adapting
                character dialogue and scene beats on the fly.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-primary" />
                <h4 className="font-bold uppercase tracking-wider text-xs">
                  Interleaved Generation
                </h4>
              </div>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                High-fidelity visuals and video sequences emerge in perfect
                rhythm with the narrative flow, bridging script and screen.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mic className="size-5 text-primary" />
                <h4 className="font-bold uppercase tracking-wider text-xs">
                  Agent Interventions
                </h4>
              </div>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                The Showrunner Agent provides creative feedback, suggesting
                lighting shifts or camera angles to enhance the cinematic mood.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Interleaved Canvas */}
      <section className="py-32 px-6 bg-obsidian relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-4">
                Module 01
              </h2>
              <h3 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                The Interleaved Canvas
              </h3>
              <p className="text-xl text-slate-400 font-light leading-relaxed">
                High-fidelity images and video loops emerging fluidly as you
                speak to your agent. No prompts, just direction.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
                <Mic className="size-5 text-primary" />
                <span className="text-xs font-mono text-slate-400">
                  INPUT: VOX_ACTIVE
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[600px]">
            <div className="md:col-span-8 relative group overflow-hidden rounded-2xl border border-white/5">
              <Image
                src="https://picsum.photos/1920/1080"
                alt="High-fidelity cinematic shot of a neon-lit cyberpunk street at night"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                <div className="space-y-2">
                  <span className="bg-primary text-obsidian px-2 py-0.5 text-[10px] font-bold rounded uppercase">
                    Active Generation
                  </span>
                  <h4 className="text-2xl font-bold">
                    Sequence: Cyber-Distopia A7
                  </h4>
                </div>
                <div className="flex gap-2">
                  <button suppressHydrationWarning className="size-10 rounded-full glass-panel flex items-center justify-center hover:bg-primary hover:text-obsidian transition-colors">
                    <RotateCcw className="size-4" />
                  </button>
                  <button suppressHydrationWarning className="size-10 rounded-full glass-panel flex items-center justify-center hover:bg-primary hover:text-obsidian transition-colors">
                    <MonitorPlay className="size-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="md:col-span-4 flex flex-col gap-6">
              <div className="flex-1 glass-panel rounded-2xl p-6 border-l-4 border-l-primary flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="size-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Live Agent Feed
                  </span>
                </div>
                <div className="space-y-4 overflow-y-auto pr-2">
                  <div className="text-sm text-slate-400 italic">
                    &quot;Make the lighting more moody, add rain-slicked
                    pavement reflections.&quot;
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-xs border border-white/5">
                    <div className="text-primary font-bold mb-1 uppercase text-[9px]">
                      Vivid Agent
                    </div>
                    Adjusting global illumination. Adding refractive physics to
                    ground planes. Rendering frame 0042...
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-8 glass-panel rounded-full px-3 flex items-center">
                      <div className="flex items-end gap-[2px]">
                        <div className="waveform-bar h-2"></div>
                        <div className="waveform-bar h-4"></div>
                        <div className="waveform-bar h-3"></div>
                        <div className="waveform-bar h-5"></div>
                        <div className="waveform-bar h-2"></div>
                        <div className="waveform-bar h-4"></div>
                        <div className="waveform-bar h-1"></div>
                      </div>
                    </div>
                    <button suppressHydrationWarning className="size-8 bg-primary rounded-full flex items-center justify-center text-obsidian">
                      <Mic className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-1/3 glass-panel rounded-2xl p-6 overflow-hidden relative">
                <Image
                  src="https://picsum.photos/1920/1080"
                  alt="Abstract fluid golden textures representing cinematic motion"
                  fill
                  className="object-cover opacity-20"
                  referrerPolicy="no-referrer"
                />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="text-xs font-bold text-primary uppercase">
                    Asset Pipeline
                  </div>
                  <div className="text-xl font-bold">
                    Dynamic Physics Enabled
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* World Bible & Continuity */}
      <section className="py-32 px-6 bg-charcoal relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
          <div className="lg:w-1/2">
            <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-4">
              Module 02
            </h2>
            <h3 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
              World Bible &amp; Continuity
            </h3>
            <p className="text-xl text-slate-400 font-light leading-relaxed mb-10">
              Mathematically locked character designs and environment assets. No
              hallucinations, just absolute fidelity to your lore.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 glass-panel rounded-xl border-l-2 border-primary">
                <Fingerprint className="size-6 text-primary mb-4" />
                <h4 className="font-bold mb-2">Biometric Locking</h4>
                <p className="text-xs text-slate-500">
                  Character facial geometry is fixed across all visual nodes.
                </p>
              </div>
              <div className="p-6 glass-panel rounded-xl border-l-2 border-primary">
                <Component className="size-6 text-primary mb-4" />
                <h4 className="font-bold mb-2">Structural Memory</h4>
                <p className="text-xs text-slate-500">
                  Environmental layouts are cached in 3D latent space.
                </p>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-12">
                <div className="rounded-xl overflow-hidden glass-panel border border-white/10 group relative aspect-square">
                  <Image
                    src="https://picsum.photos/1920/1080"
                    alt="Technical schematic of a futuristic respirator device"
                    fill
                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-obsidian/90 backdrop-blur-sm">
                    <div className="text-[10px] font-mono text-primary mb-1">
                      ASSET_ID: RESP_01
                    </div>
                    <div className="text-sm font-bold">Mark IV Respirator</div>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden glass-panel border border-white/10 group relative aspect-video">
                  <Image
                    src="https://picsum.photos/1920/1080"
                    alt="Cinematic lighting study in a dark industrial space"
                    fill
                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-obsidian/90 backdrop-blur-sm">
                    <div className="text-[10px] font-mono text-primary mb-1">
                      LUT_PROFILE: NOIR_V3
                    </div>
                    <div className="text-sm font-bold">Industrial Low-Key</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden glass-panel border border-white/10 group relative aspect-[3/4]">
                  <Image
                    src="https://picsum.photos/1920/1080"
                    alt="Abstract character design profile with holographic overlays"
                    fill
                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-obsidian/90 backdrop-blur-sm">
                    <div className="text-[10px] font-mono text-primary mb-1">
                      ENTITY: PROTAGONIST
                    </div>
                    <div className="text-sm font-bold">Commander Elias</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -z-10 top-0 right-0 w-full h-full border-t border-r border-primary/20 rounded-tr-3xl"></div>
          </div>
        </div>
      </section>

      {/* Directorial Agency */}
      <section className="py-32 px-6 bg-obsidian overflow-hidden relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-4">
              Module 03
            </h2>
            <h3 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
              Directorial Agency
            </h3>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">
              Interruptible direction. Change the eye color, lighting, or camera
              angle mid-narration without breaking the stream.
            </p>
          </div>
          <div className="glass-panel rounded-3xl p-10 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(#ecb613 0.5px, transparent 0.5px)",
                backgroundSize: "20px 20px",
              }}
            ></div>
            <div className="relative z-10 flex flex-col gap-12">
              <div className="flex flex-wrap items-center justify-center gap-16">
                <div className="text-center">
                  <div className="size-24 rounded-full border-2 border-primary/30 flex items-center justify-center mb-4 relative mx-auto">
                    <div className="absolute inset-0 rounded-full border border-primary animate-pulse"></div>
                    <Eye className="size-10 text-primary" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Ocular Tracking
                  </span>
                </div>
                <div className="text-center">
                  <div className="size-24 rounded-full border-2 border-primary/30 flex items-center justify-center mb-4 mx-auto">
                    <Sun className="size-10 text-primary" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Atmospheric Mood
                  </span>
                </div>
                <div className="text-center">
                  <div className="size-24 rounded-full border-2 border-primary/30 flex items-center justify-center mb-4 mx-auto">
                    <Video className="size-10 text-primary" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Gimbal Logic
                  </span>
                </div>
              </div>
              <div className="bg-charcoal/50 rounded-2xl p-8 border border-white/5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="size-3 bg-red-500 rounded-full animate-pulse shrink-0"></div>
                    <span className="font-mono text-sm tracking-tighter break-all">
                      VOICE_COMMAND_LIVE: &quot;Enhance shadows in the
                      foreground&quot;
                    </span>
                  </div>
                  <div className="flex gap-4 shrink-0">
                    <button suppressHydrationWarning className="px-4 py-2 bg-white/5 border border-white/10 rounded text-[10px] font-bold uppercase">
                      Interrupt
                    </button>
                    <button suppressHydrationWarning className="px-4 py-2 bg-primary text-obsidian rounded text-[10px] font-bold uppercase">
                      Commit
                    </button>
                  </div>
                </div>
                <div className="h-32 flex items-center justify-center gap-1">
                  <div className="waveform-bar h-8 animate-[pulse_2s_infinite]"></div>
                  <div className="waveform-bar h-16 animate-[pulse_1.5s_infinite]"></div>
                  <div className="waveform-bar h-24 animate-[pulse_1.8s_infinite]"></div>
                  <div className="waveform-bar h-12 animate-[pulse_2.2s_infinite]"></div>
                  <div className="waveform-bar h-32 animate-[pulse_1.2s_infinite]"></div>
                  <div className="waveform-bar h-20 animate-[pulse_1.7s_infinite]"></div>
                  <div className="waveform-bar h-28 animate-[pulse_1.4s_infinite]"></div>
                  <div className="waveform-bar h-14 animate-[pulse_2s_infinite]"></div>
                  <div className="waveform-bar h-24 animate-[pulse_1.6s_infinite]"></div>
                  <div className="waveform-bar h-8 animate-[pulse_1.9s_infinite]"></div>
                  <div className="waveform-bar h-16 animate-[pulse_1.5s_infinite]"></div>
                  <div className="waveform-bar h-24 animate-[pulse_1.8s_infinite]"></div>
                  <div className="waveform-bar h-12 animate-[pulse_2.2s_infinite]"></div>
                  <div className="waveform-bar h-32 animate-[pulse_1.2s_infinite]"></div>
                  <div className="waveform-bar h-20 animate-[pulse_1.7s_infinite]"></div>
                  <div className="waveform-bar h-28 animate-[pulse_1.4s_infinite]"></div>
                  <div className="waveform-bar h-14 animate-[pulse_2s_infinite]"></div>
                  <div className="waveform-bar h-24 animate-[pulse_1.6s_infinite]"></div>
                  <div className="waveform-bar h-8 animate-[pulse_1.9s_infinite]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cinematic Soundscaping */}
      <section className="py-32 px-6 bg-charcoal relative z-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1">
            <div className="glass-panel rounded-2xl p-8 border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h4 className="font-bold">Soundscape Mixer</h4>
                <Sliders className="size-5 text-primary" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Ambient Hum (Ship)</span>
                    <span className="text-primary">82%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[82%]"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Cinematic Score (Dissonant)</span>
                    <span className="text-primary">45%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[45%]"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Foley: Heavy Breath</span>
                    <span className="text-primary">60%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[60%]"></div>
                  </div>
                </div>
              </div>
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center gap-3">
                  <Wand2 className="size-4 text-primary shrink-0" />
                  <p className="text-xs text-slate-300 italic font-light">
                    &quot;Agent: Syncing foley impact to visual frame 128.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-primary text-sm font-black uppercase tracking-[0.3em] mb-4">
              Module 04
            </h2>
            <h3 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
              Cinematic Soundscaping
            </h3>
            <p className="text-xl text-slate-400 font-light leading-relaxed mb-8">
              An immersive audio stack generated in sync with your vision.
              Foley, ambient loops, and procedural scores that adapt to the
              narrative tempo.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-4">
                <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="size-3 text-primary font-bold" />
                </div>
                <span className="text-slate-300 font-medium">
                  Temporal Foley Syncing
                </span>
              </li>
              <li className="flex items-center gap-4">
                <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="size-3 text-primary font-bold" />
                </div>
                <span className="text-slate-300 font-medium">
                  Emotionally Adaptive Scores
                </span>
              </li>
              <li className="flex items-center gap-4">
                <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="size-3 text-primary font-bold" />
                </div>
                <span className="text-slate-300 font-medium">
                  Spatial Audio Mastering
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-40 px-6 relative overflow-hidden bg-obsidian z-10">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-black mb-12 tracking-tight">
            The future of film is <br />
            <span className="text-primary">collaborative.</span>
          </h2>
          <p className="text-2xl text-slate-400 font-light mb-16 max-w-2xl mx-auto">
            Join the waitlist for the first professional-grade Multimodal
            Showrunner Agent.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center max-w-lg mx-auto">
            <input
              suppressHydrationWarning
              className="flex-1 bg-charcoal border border-white/10 rounded-xl px-6 py-4 focus:ring-primary focus:border-primary outline-none text-white"
              placeholder="Your production email"
              type="email"
            />
            <Link
              href="/signup"
              className="bg-primary text-obsidian px-8 py-4 rounded-xl font-black uppercase tracking-widest gold-glow hover:scale-105 transition-transform flex items-center justify-center"
            >
              Join Waitlist
            </Link>
          </div>
          <p className="mt-8 text-xs text-slate-500 uppercase tracking-[0.2em]">
            Closed Beta • Exclusive Access Only
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 bg-obsidian relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 grayscale">
            <div className="size-6 bg-white/20 rounded flex items-center justify-center text-white">
              <Film className="size-3" />
            </div>
            <span className="text-sm font-bold tracking-tighter uppercase opacity-50">
              Vivid.live
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <a className="hover:text-primary transition-colors" href="#">
              Twitter / X
            </a>
            <a className="hover:text-primary transition-colors" href="#">
              Discord
            </a>
            <a className="hover:text-primary transition-colors" href="#">
              Privacy
            </a>
            <a className="hover:text-primary transition-colors" href="#">
              Terms
            </a>
          </div>
          <p className="text-[10px] text-slate-600 font-mono text-center">
            © 2024 LORECAST EVOLUTION. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}
