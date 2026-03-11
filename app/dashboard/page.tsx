'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/FirebaseProvider';
import { 
  Plus, 
  Film, 
  Trash2, 
  ExternalLink, 
  LogOut, 
  Clock, 
  Sparkles,
  Search,
  LayoutGrid,
  List as ListIcon,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  genre: string;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Project));
      setProjects(projs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createProject = async () => {
    if (!user) return;
    
    const newProject = {
      title: 'New Cinematic Lorecast',
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      script: '',
      genre: 'Drama',
      voice: 'Puck',
      language: 'English',
      playbackRate: 1.0
    };

    try {
      const docRef = await addDoc(collection(db, 'projects'), newProject);
      router.push(`/projects/${docRef.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const deleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
    
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-obsidian text-white font-sans selection:bg-primary selection:text-obsidian">
      <div className="film-grain opacity-20"></div>
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-obsidian/80 backdrop-blur-xl border-bottom border-white/5 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/30">
              <Film className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic">Vivid.live</h1>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Neural Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <img src={user?.photoURL || ''} alt="" className="size-6 rounded-full border border-primary/30" />
              <span className="text-xs font-bold text-slate-300">{user?.displayName}</span>
            </div>
            <button 
              onClick={logout}
              className="text-slate-500 hover:text-red-400 transition-colors p-2"
              title="Logout"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight">Your Universe</h2>
            <p className="text-slate-500 text-sm">Manage your cinematic projects and neural sessions.</p>
          </div>
          
          <button 
            onClick={createProject}
            className="bg-primary text-obsidian px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-[0.98] shadow-[0_0_30px_rgba(236,182,19,0.15)] flex items-center gap-3"
          >
            <Plus className="size-5" />
            New Lorecast
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary text-obsidian' : 'text-slate-500 hover:text-white'}`}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-primary text-obsidian' : 'text-slate-500 hover:text-white'}`}
            >
              <ListIcon className="size-4" />
            </button>
          </div>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="size-12 text-primary animate-spin mb-4" />
            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Accessing Archive...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className={`group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 transition-all hover:shadow-[0_0_40px_rgba(236,182,19,0.05)] ${viewMode === 'list' ? 'flex items-center p-4' : 'p-6'}`}
                >
                  <div className={`bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-obsidian transition-all ${viewMode === 'list' ? 'size-12 mb-0 mr-4' : 'size-14'}`}>
                    <Film className="size-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">{project.genre}</span>
                      <div className="size-1 rounded-full bg-slate-700"></div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                        <Clock className="size-3" />
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{project.title}</h3>
                  </div>

                  <div className={`flex items-center gap-2 ${viewMode === 'list' ? 'ml-4' : 'mt-6 pt-6 border-t border-white/5'}`}>
                    <button 
                      onClick={(e) => deleteProject(e, project.id)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                    <div className="ml-auto p-2 text-slate-500 group-hover:text-primary transition-colors">
                      <ExternalLink className="size-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-3xl">
            <Sparkles className="size-12 text-slate-700 mb-6" />
            <h3 className="text-xl font-bold text-slate-400 mb-2">No projects found</h3>
            <p className="text-slate-600 text-sm mb-8">Start your first cinematic journey today.</p>
            <button 
              onClick={createProject}
              className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-xl border border-white/10 transition-all font-bold uppercase tracking-widest text-xs"
            >
              Initialize Project
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
