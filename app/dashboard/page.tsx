'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Film, Sparkles, BrainCircuit, Lightbulb, Terminal, Mic, Zap, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ARCHETYPE_MAP: Record<string, any> = {
  mentor: { name: 'The Mentor', icon: BrainCircuit, color: 'text-indigo-400' },
  visionary: { name: 'The Visionary', icon: Lightbulb, color: 'text-emerald-400' },
  technical: { name: 'The Technical Lead', icon: Terminal, color: 'text-slate-300' }
};

export default function DashboardPage() {
  const router = useRouter();
  const [settings, setSettings] = React.useState<any>(null);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState('');
  const [newProjectDesc, setNewProjectDesc] = React.useState('');

  const fetchData = React.useCallback(async () => {
    try {
      const [settingsRes, projectsRes] = await Promise.all([
        fetch('/api/user/agent-settings/get'),
        fetch('/api/projects')
      ]);
      
      const settingsData = await settingsRes.json();
      const projectsData = await projectsRes.json();
      
      if (settingsData.settings) setSettings(settingsData.settings);
      if (projectsData.projects) setProjects(projectsData.projects);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName, description: newProjectDesc })
      });
      
      if (res.ok) {
        setNewProjectName('');
        setNewProjectDesc('');
        setIsCreating(false);
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to create project', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const activeProject = projects.length > 0 ? projects[0] : null;

  if (isLoading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-primary font-mono text-xs uppercase tracking-widest">Calibrating Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-display relative overflow-hidden h-screen">
      <div className="film-grain"></div>
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_top_center,rgba(236,182,19,0.05)_0%,rgba(10,10,10,0)_60%)]"></div>
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 px-6 py-4 border-b border-white/5 bg-obsidian/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 opacity-90">
            <div className="size-8 bg-white/5 rounded flex items-center justify-center text-primary border border-white/10 shadow-[0_0_10px_rgba(236,182,19,0.1)]">
              <Film className="size-5" />
            </div>
            <Link href="/">
              <span className="text-base font-bold tracking-tight uppercase text-slate-200">Vivid.live <span className="text-primary mx-2">{"//"}</span> Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-400">
              <Link className="text-white hover:text-primary transition-colors" href="/dashboard">Odysseys</Link>
              <Link className="hover:text-white transition-colors" href="#">Assets</Link>
              <Link className="hover:text-white transition-colors" href="#">Render Farm</Link>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
              <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Sign Out</button>
              <div className="size-8 rounded-full bg-gradient-to-tr from-primary to-orange-400 p-[1px]">
                <div className="size-full rounded-full bg-obsidian flex items-center justify-center">
                  <BrainCircuit className="size-4 text-slate-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 py-24 h-full overflow-hidden flex flex-col md:flex-row gap-8">
        {/* Left Column: Projects */}
        <div className="flex-1 flex flex-col gap-8 h-full overflow-y-auto pr-2 pb-20 scrollbar-hide">
          
          {/* Active Production */}
          {activeProject && (
            <section className="w-full">
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-xs font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                  Active Production
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">ID: {activeProject.id.toUpperCase()}</span>
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full aspect-[21/9] rounded-xl overflow-hidden group border border-white/10 shadow-2xl"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${activeProject.thumbnail}')` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col md:flex-row justify-between items-end gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full backdrop-blur-sm">In Progress</span>
                      <span className="text-[10px] font-mono text-slate-400">Last edited {new Date(activeProject.lastEdited).toLocaleDateString()}</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none drop-shadow-lg">{activeProject.name}</h1>
                    <p className="text-sm text-slate-300 font-light max-w-lg leading-relaxed drop-shadow-md line-clamp-2">
                      {activeProject.description || "No description provided. Start directing to build your cinematic world."}
                    </p>
                  </div>
                  <button className="bg-primary text-obsidian px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(236,182,19,0.4)] hover:bg-white hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap">
                    <Zap className="size-4 fill-current" />
                    Resume Directing
                  </button>
                </div>
              </motion.div>
            </section>
          )}

          {/* All Odysseys */}
          <section className="w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">All Odysseys</h2>
              <div className="flex gap-2">
                <button className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400"><Terminal className="size-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Create New Odyssey Button */}
              <button 
                onClick={() => setIsCreating(true)}
                className="glass-panel flex flex-col items-center justify-center min-h-[240px] rounded-xl border-dashed border-slate-700 hover:border-primary/50 group transition-all duration-300 cursor-pointer text-slate-500 hover:text-primary"
              >
                <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-primary/10 group-hover:shadow-[0_0_15px_rgba(236,182,19,0.2)]">
                  <Zap className="size-8" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">Start New Odyssey</span>
              </button>

              {/* Project Cards */}
              {projects.map((project, idx) => (
                <motion.div 
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-panel rounded-xl overflow-hidden group transition-all duration-300 hover:-translate-y-1 border border-white/5"
                >
                  <div className="h-32 bg-slate-800 relative overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                      style={{ backgroundImage: `url('${project.thumbnail}')` }}
                    ></div>
                    <div className="absolute top-3 right-3">
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full text-slate-300">
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{project.name}</h3>
                      <button className="text-slate-500 hover:text-white"><MessageSquare className="size-4" /></button>
                    </div>
                    <p className="text-xs text-slate-400 mb-4 line-clamp-2 font-light leading-relaxed">{project.description || "No description provided."}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                      <div className="flex items-center gap-1"><Film className="size-3" /> {project.assetsCount} Assets</div>
                      <div className="flex items-center gap-1"><Zap className="size-3" /> {new Date(project.lastEdited).toLocaleDateString()}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Studio Feed */}
        <aside className="w-full md:w-80 flex-shrink-0 flex flex-col h-full overflow-hidden glass-panel rounded-xl border border-white/5">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Studio Feed</h3>
            <span className="flex size-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
            <div className="relative pl-4 border-l border-white/10 pb-2">
              <div className="absolute -left-[5px] top-0 size-2.5 rounded-full bg-primary border-2 border-obsidian"></div>
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Just now</div>
                <p className="text-xs text-slate-300 leading-snug"><span className="text-primary font-bold">Agent Vivid</span> initialized neural pathways for your session.</p>
              </div>
            </div>
            <div className="relative pl-4 border-l border-white/10 pb-2">
              <div className="absolute -left-[5px] top-0 size-2.5 rounded-full bg-slate-600 border-2 border-obsidian"></div>
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 font-mono uppercase">24m ago</div>
                <p className="text-xs text-slate-300 leading-snug"><span className="text-indigo-400 font-bold">System</span> auto-saved studio calibration settings.</p>
              </div>
            </div>
            <div className="relative pl-4 border-l border-white/10 pb-2">
              <div className="absolute -left-[5px] top-0 size-2.5 rounded-full bg-slate-600 border-2 border-obsidian"></div>
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 font-mono uppercase">1h ago</div>
                <p className="text-xs text-slate-300 leading-snug"><span className="text-emerald-400 font-bold">Render Farm</span> node #04 is online and processing queue.</p>
                <div className="flex gap-1 mt-2">
                  <span className="h-1 w-full bg-emerald-500/20 rounded-full overflow-hidden"><span className="block h-full w-3/4 bg-emerald-500 rounded-full"></span></span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 bg-black/40 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              <Terminal className="size-3" /> GPU: 82%
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-3" /> SYNCED
            </div>
          </div>
        </aside>
      </main>

      {/* Create Project Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass-panel rounded-2xl border border-white/10 p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Initialize New Odyssey</h2>
              <form onSubmit={handleCreateProject} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Project Name</label>
                  <input 
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g. Cyber-Dystopia A7"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Description</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors min-h-[100px]"
                    placeholder="Describe your cinematic vision..."
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-white/10 font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-primary text-obsidian px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(236,182,19,0.4)] hover:brightness-110 transition-all"
                  >
                    {isLoading ? 'Initializing...' : 'Create Odyssey'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Bar */}
      <div className="fixed bottom-0 w-full px-6 py-3 bg-obsidian/90 backdrop-blur-md border-t border-white/5 flex justify-between items-center text-[10px] uppercase tracking-widest text-slate-500 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
            Server Connection: Stable (12ms)
          </div>
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-white/10">
            <span>Queue: 3 Jobs</span>
          </div>
        </div>
        <div className="hidden md:block font-mono">
          Vivid Core v2.4.1
        </div>
      </div>
    </div>
  );
}

