'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Loader2, ArrowLeft } from 'lucide-react';

import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  collection, 
  deleteDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/FirebaseProvider';

import { INITIAL_SCENE } from './constants';
import { SceneState, Character, Environment, Frame, Genre, VoiceName } from './types';
import Header from './components/Header';
import SidebarScript from './components/SidebarScript';
import VisionStage from './components/VisionStage';
import WorldBible from './components/WorldBible';
import TimelineFooter from './components/TimelineFooter';
import CoCreatorAgent from './components/CoCreatorAgent';

import { 
  analyzeManuscriptDeep, 
  generateSceneWithBrief, 
  generateNanoBananaImage, 
  generateEmotionalAudio, 
  generateBibleAsset,
  chatWithCoCreator
} from './services/geminiService';
import { exportCinemaMovie } from './services/exportService';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { user } = useAuth();

  const [scene, setScene] = useState<SceneState>(INITIAL_SCENE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Firestore Retry Helper
  const withFirestoreRetry = async <T extends unknown>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
    let delay = 1000;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        const errStr = String(err).toLowerCase();
        const isRetryable = errStr.includes('503') || errStr.includes('unavailable') || errStr.includes('deadline');
        if (isRetryable && i < maxRetries - 1) {
          await new Promise(r => setTimeout(r, delay));
          delay *= 2;
          continue;
        }
        throw err;
      }
    }
    throw new Error('Max retries reached');
  };

  // Firestore Error Handler
  const handleFirestoreError = (error: any, operation: string, path: string) => {
    const errInfo = {
      error: error.message,
      operationType: operation,
      path,
      authInfo: {
        userId: user?.uid,
        email: user?.email,
      }
    };
    console.error('Firestore Error:', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  // Real-time Sync
  useEffect(() => {
    if (!user || !projectId) return;

    const projectRef = doc(db, 'projects', projectId);
    
    // Sync Project Base
    const unsubProject = onSnapshot(projectRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setScene(prev => ({
          ...prev,
          title: data.title || prev.title,
          script: data.script || prev.script,
          genre: data.genre || prev.genre,
          voice: data.voice || prev.voice,
          language: data.language || prev.language,
          playbackRate: data.playbackRate || prev.playbackRate,
        }));
      } else {
        // Create project if it doesn't exist
        setDoc(projectRef, {
          title: 'Untitled Lorecast',
          ownerId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          script: '',
          genre: 'Drama',
          voice: 'Puck',
          language: 'English',
          playbackRate: 1.0
        }).catch(err => handleFirestoreError(err, 'create', `projects/${projectId}`));
      }
      setIsInitialLoading(false);
    }, (err) => handleFirestoreError(err, 'list', `projects/${projectId}`));

    // Sync Characters
    const unsubChars = onSnapshot(collection(db, 'projects', projectId, 'characters'), (snap) => {
      const characters = snap.docs.map(d => ({ id: d.id, ...d.data() } as Character));
      setScene(prev => ({ ...prev, manifest: { ...prev.manifest, characters } }));
    }, (err) => handleFirestoreError(err, 'list', `projects/${projectId}/characters`));

    // Sync Environments
    const unsubEnvs = onSnapshot(collection(db, 'projects', projectId, 'environments'), (snap) => {
      const environments = snap.docs.map(d => ({ id: d.id, ...d.data() } as Environment));
      setScene(prev => ({ ...prev, manifest: { ...prev.manifest, environments } }));
    }, (err) => handleFirestoreError(err, 'list', `projects/${projectId}/environments`));

    // Sync Frames
    const unsubFrames = onSnapshot(collection(db, 'projects', projectId, 'frames'), (snap) => {
      const frames = snap.docs.map(d => ({ id: d.id, ...d.data() } as Frame)).sort((a, b) => (a as any).order - (b as any).order);
      setScene(prev => ({ ...prev, frames }));
    }, (err) => handleFirestoreError(err, 'list', `projects/${projectId}/frames`));

    return () => {
      unsubProject();
      unsubChars();
      unsubEnvs();
      unsubFrames();
    };
  }, [user, projectId]);

  const updateProjectField = async (field: string, value: any) => {
    if (!projectId) return;
    try {
      await withFirestoreRetry(() => updateDoc(doc(db, 'projects', projectId), {
        [field]: value,
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      handleFirestoreError(err, 'update', `projects/${projectId}`);
    }
  };

  const addCharacter = async (name: string, description: string, imageUrl?: string) => {
    const id = `c-${Date.now()}`;
    const charData = { name, role: "Principal", description, image: imageUrl || 'loading://character' };
    
    try {
      await withFirestoreRetry(() => setDoc(doc(db, 'projects', projectId, 'characters', id), charData));
      if (imageUrl) return;
      
      const img = await generateBibleAsset(name, description, 'character');
      if (img) {
        await withFirestoreRetry(() => updateDoc(doc(db, 'projects', projectId, 'characters', id), { image: img }));
      }
    } catch (err) {
      handleFirestoreError(err, 'write', `projects/${projectId}/characters/${id}`);
    }
  };

  const removeCharacter = async (id: string) => {
    try {
      await withFirestoreRetry(() => deleteDoc(doc(db, 'projects', projectId, 'characters', id)));
    } catch (err) {
      handleFirestoreError(err, 'delete', `projects/${projectId}/characters/${id}`);
    }
  };

  const updateCharacter = async (name: string, description: string) => {
    const existing = scene.manifest.characters.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      try {
        await withFirestoreRetry(() => updateDoc(doc(db, 'projects', projectId, 'characters', existing.id), { 
          description, 
          image: 'loading://character' 
        }));
        const img = await generateBibleAsset(name, description, 'character');
        if (img) {
          await withFirestoreRetry(() => updateDoc(doc(db, 'projects', projectId, 'characters', existing.id), { image: img }));
        }
      } catch (err) {
        handleFirestoreError(err, 'update', `projects/${projectId}/characters/${existing.id}`);
      }
    } else {
      addCharacter(name, description);
    }
  };

  const addEnvironment = async (name: string, description: string, imageUrl?: string) => {
    const id = `e-${Date.now()}`;
    const envData = { name, mood: "Concept", colors: ['#555'], image: imageUrl || 'loading://environment' };
    
    try {
      await withFirestoreRetry(() => setDoc(doc(db, 'projects', projectId, 'environments', id), envData));
      if (imageUrl) return;
      
      const img = await generateBibleAsset(name, description, 'environment');
      if (img) {
        await withFirestoreRetry(() => updateDoc(doc(db, 'projects', projectId, 'environments', id), { image: img }));
      }
    } catch (err) {
      handleFirestoreError(err, 'write', `projects/${projectId}/environments/${id}`);
    }
  };

  const removeEnvironment = async (id: string) => {
    try {
      await withFirestoreRetry(() => deleteDoc(doc(db, 'projects', projectId, 'environments', id)));
    } catch (err) {
      handleFirestoreError(err, 'delete', `projects/${projectId}/environments/${id}`);
    }
  };

  const updateEnvironment = async (name: string, description: string) => {
    const existing = scene.manifest.environments.find(e => e.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      try {
        await withFirestoreRetry(() => updateDoc(doc(db, 'projects', projectId, 'environments', existing.id), { 
          mood: description, 
          image: 'loading://environment' 
        }));
        const img = await generateBibleAsset(name, description, 'environment');
        if (img) {
          await withFirestoreRetry(() => updateDoc(doc(db, 'projects', projectId, 'environments', existing.id), { image: img }));
        }
      } catch (err) {
        handleFirestoreError(err, 'update', `projects/${projectId}/environments/${existing.id}`);
      }
    } else {
      addEnvironment(name, description);
    }
  };

  const assignAssetToFrame = async (assetId: string, type: 'char' | 'env') => {
    if (!selectedFrameId) return;
    try {
      await withFirestoreRetry(() => updateDoc(doc(db, 'projects', projectId, 'frames', selectedFrameId), {
        [type === 'char' ? 'characterId' : 'environmentId']: assetId
      }));
    } catch (err) {
      handleFirestoreError(err, 'update', `projects/${projectId}/frames/${selectedFrameId}`);
    }
  };

  const appendFrame = async () => {
    const id = `f-ext-${Date.now()}`;
    const newFrame = {
      title: `Frame ${String(scene.frames.length + 1).padStart(2, '0')}`,
      timeRange: "00:00 - 00:05",
      image: "https://placehold.co/1280x720/1a1a1a/444?text=Empty+Shot",
      prompt: "New shot description...",
      scriptSegment: "...",
      order: scene.frames.length,
      directorsBrief: { emotionalArc: "Neutral", lightingScheme: "Standard", cameraLogic: "Static", pacing: "Moderate" }
    };
    try {
      await withFirestoreRetry(() => setDoc(doc(db, 'projects', projectId, 'frames', id), newFrame));
      setSelectedFrameId(id);
    } catch (err) {
      handleFirestoreError(err, 'write', `projects/${projectId}/frames/${id}`);
    }
  };

  const handleManuscriptUpload = async (text: string) => {
    setIsGenerating(true);
    try {
      const analysis = await analyzeManuscriptDeep(text);
      await updateDoc(doc(db, 'projects', projectId), { script: text });
      
      // Clear old assets
      const charSnaps = await snapCollection(`projects/${projectId}/characters`);
      const envSnaps = await snapCollection(`projects/${projectId}/environments`);
      await Promise.all([
        ...charSnaps.docs.map(d => deleteDoc(d.ref)),
        ...envSnaps.docs.map(d => deleteDoc(d.ref))
      ]);

      // Add new ones
      for (let char of (analysis.characters || [])) {
        await addCharacter(char.name, char.description);
      }
      for (let env of (analysis.environments || [])) {
        await addEnvironment(env.name, env.mood);
      }
    } finally { setIsGenerating(false); }
  };

  const snapCollection = async (path: string) => {
    const { getDocs } = await import('firebase/firestore');
    return getDocs(collection(db, path));
  };

  const handleGenerateStoryboard = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const data = await generateSceneWithBrief(scene.script, scene.manifest, scene.genre);
      
      // Clear old frames
      const frameSnaps = await snapCollection(`projects/${projectId}/frames`);
      await Promise.all(frameSnaps.docs.map(d => deleteDoc(d.ref)));

      const newFrames = data.frames.map((f: any, i: number) => ({
        ...f,
        id: `f-${i}-${Date.now()}`,
        timeRange: `00:0${i*5} - 00:0${(i+1)*5}`,
        image: 'https://placehold.co/1280x720/1a1a1a/ecb613?text=Composing+Shot...',
        order: i
      }));

      for (let frame of newFrames) {
        await setDoc(doc(db, 'projects', projectId, 'frames', frame.id), frame);
      }
      
      if (newFrames.length > 0) setSelectedFrameId(newFrames[0].id);
      
      // Sequential image generation
      for (let frame of newFrames) {
        try {
          const url = await generateNanoBananaImage(frame.prompt, scene.manifest, { 
            charId: frame.characterId, 
            envId: frame.environmentId, 
            shotType: frame.shotType, 
            emotion: frame.directorsBrief?.emotionalArc 
          });
          if (url) {
            await updateDoc(doc(db, 'projects', projectId, 'frames', frame.id), { image: url });
          }
        } catch (err) {
          await updateDoc(doc(db, 'projects', projectId, 'frames', frame.id), { image: 'https://placehold.co/1280x720/333/fff?text=Error' });
        }
      }
    } finally { setIsGenerating(false); }
  };

  const handlePaintToEdit = async (frameId: string, instruction: string, coord?: { x: number, y: number }) => {
    const target = scene.frames.find(f => f.id === frameId);
    if (!target) return;
    
    try {
      // Update UI to show loading
      setScene(prev => ({ ...prev, frames: prev.frames.map(f => f.id === frameId ? { ...f, isGenerating: true } : f) }));
      
      const editedUrl = await generateNanoBananaImage(
        instruction, 
        scene.manifest, 
        { charId: target.characterId, envId: target.environmentId, shotType: target.shotType, emotion: target.directorsBrief?.emotionalArc }, 
        target.image, 
        coord
      );
      
      if (editedUrl) {
        await updateDoc(doc(db, 'projects', projectId, 'frames', frameId), { image: editedUrl });
      }
    } catch (err) {
      console.error("Paint to edit failed", err);
    } finally {
      setScene(prev => ({ ...prev, frames: prev.frames.map(f => f.id === frameId ? { ...f, isGenerating: false } : f) }));
    }
  };

  const handleSynthesizeAudio = async (frameId: string) => {
    const frame = scene.frames.find(f => f.id === frameId);
    if (!frame?.scriptSegment) return;

    if (frame.audioData) {
      playAudio(frame.audioData, scene.playbackRate);
      return;
    }

    try {
      setScene(prev => ({ ...prev, frames: prev.frames.map(f => f.id === frameId ? { ...f, isGeneratingAudio: true } : f) }));
      const audio = await generateEmotionalAudio(
        frame.scriptSegment, 
        frame.directorsBrief?.emotionalArc || "Dramatic", 
        scene.genre,
        scene.voice,
        scene.language
      );
      if (audio) {
        await updateDoc(doc(db, 'projects', projectId, 'frames', frameId), { audioData: audio });
        playAudio(audio, scene.playbackRate);
      }
    } catch (err) {
      console.error("Audio synthesis failed", err);
    } finally {
      setScene(prev => ({ ...prev, frames: prev.frames.map(f => f.id === frameId ? { ...f, isGeneratingAudio: false } : f) }));
    }
  };

  const playAudio = async (base64: string, rate: number = 1.0) => {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass({ sampleRate: 24000 });
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    source.connect(ctx.destination);
    source.start();
  };

  const [previewingVoice, setPreviewingVoice] = useState<VoiceName | null>(null);

  const handlePreviewVoice = async (voiceName: VoiceName) => {
    if (previewingVoice) return;
    setPreviewingVoice(voiceName);
    
    const previewSentences: Record<VoiceName, string> = {
      'Puck': "I'm Puck! I bring the energy, the wit, and just a touch of chaos to your story.",
      'Charon': "I am Charon. My voice carries the weight of history and the depth of the cinematic soul.",
      'Kore': "I am Kore. I find the heart in every line, bringing emotional truth to your characters.",
      'Fenrir': "They call me Fenrir. I thrive in the shadows, where intensity and grit define the narrative.",
      'Zephyr': "I am Zephyr. Precision and authority are my hallmarks. The future is spoken in my tone."
    };

    try {
      const audio = await generateEmotionalAudio(
        previewSentences[voiceName],
        "Preview",
        scene.genre,
        voiceName,
        scene.language
      );
      if (audio) {
        await playAudio(audio, 1.0);
      }
    } catch (err) {
      console.error("Preview failed", err);
    } finally {
      setPreviewingVoice(null);
    }
  };


  const handleExportMovie = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    try {
      const url = await exportCinemaMovie(scene.frames, (progress) => {
        setExportProgress(progress);
      });
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${scene.title || 'lorecast'}.mp4`;
        a.click();
      }
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedFrame = scene.frames.find(f => f.id === selectedFrameId);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center">
        <Loader2 className="size-12 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Syncing with Cloud Neural Link...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-obsidian text-white font-sans overflow-hidden relative">
      <Header 
        onGenerate={handleGenerateStoryboard} 
        onExport={handleExportMovie} 
        isGenerating={isGenerating} 
        isExporting={isExporting} 
      />
      <main className="flex flex-1 overflow-hidden">
        <SidebarScript 
          script={scene.script} 
          genre={scene.genre}
          voice={scene.voice}
          language={scene.language}
          playbackRate={scene.playbackRate}
          onScriptChange={(s) => updateProjectField('script', s)} 
          onGenreChange={(g) => updateProjectField('genre', g)}
          onVoiceChange={(v) => updateProjectField('voice', v)}
          onLanguageChange={(l) => updateProjectField('language', l)}
          onPlaybackRateChange={(r) => updateProjectField('playbackRate', r)}
          onPreviewVoice={handlePreviewVoice}
          previewingVoice={previewingVoice}
          location={scene.location} 
          title={scene.title} 
          highlightText={selectedFrame?.scriptSegment} 
          onUpload={handleManuscriptUpload} 
        />
        <VisionStage 
          frames={scene.frames} 
          selectedFrameId={selectedFrameId} 
          onSelectFrame={setSelectedFrameId} 
          onRefine={handlePaintToEdit} 
          onPlayAudio={handleSynthesizeAudio} 
          onAppendFrame={appendFrame} 
        />
        <WorldBible 
          manifest={scene.manifest} 
          onAddChar={addCharacter} 
          onRemoveChar={removeCharacter} 
          onAddEnv={addEnvironment} 
          onRemoveEnv={removeEnvironment} 
          onSelectAsset={assignAssetToFrame} 
          selectedFrameAssets={{ charId: selectedFrame?.characterId, envId: selectedFrame?.environmentId }} 
        />
      </main>
      <TimelineFooter 
        sentimentData={scene.sentimentData} 
        currentBrief={selectedFrame?.directorsBrief} 
        shotType={selectedFrame?.shotType} 
      />
      
        <CoCreatorAgent 
        script={scene.script}
        manifest={scene.manifest}
        genre={scene.genre}
        onUpdateScript={(s) => updateProjectField('script', s)}
        onAddCharacter={addCharacter}
        onUpdateCharacter={updateCharacter}
        onAddEnvironment={addEnvironment}
        onUpdateEnvironment={updateEnvironment}
      />
      
      <button 
        onClick={() => router.push('/dashboard')}
        className="fixed top-4 left-4 z-[150] bg-white/5 hover:bg-white/10 p-2 rounded-lg border border-white/10 transition-all group"
      >
        <ArrowLeft className="size-5 text-slate-400 group-hover:text-white" />
      </button>
      


      <AnimatePresence>
        {isExporting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center"
          >
            <div className="w-[500px] flex flex-col items-center">
              <RotateCw className="size-20 text-primary animate-spin mb-8 shadow-[0_0_30px_rgba(236,182,19,0.2)]" />
              <h2 className="text-2xl font-bold tracking-tight mb-2">Rendering Cinema Movie</h2>
              <p className="text-slate-500 text-sm uppercase tracking-widest font-bold mb-10">Stitching Sequence: {exportProgress}%</p>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-4">
                <motion.div 
                  className="h-full bg-primary" 
                  initial={{ width: 0 }}
                  animate={{ width: `${exportProgress}%` }}
                ></motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
