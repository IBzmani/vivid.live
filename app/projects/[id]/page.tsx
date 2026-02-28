'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw } from 'lucide-react';

import { INITIAL_SCENE } from './constants';
import { SceneState, Character, Environment, Frame, Genre } from './types';
import Header from './components/Header';
import SidebarScript from './components/SidebarScript';
import VisionStage from './components/VisionStage';
import WorldBible from './components/WorldBible';
import TimelineFooter from './components/TimelineFooter';

import { 
  analyzeManuscriptDeep, 
  generateSceneWithBrief, 
  generateNanoBananaImage, 
  generateEmotionalAudio, 
  generateBibleAsset 
} from './services/geminiService';
import { exportCinemaMovie } from './services/exportService';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [scene, setScene] = useState<SceneState>(INITIAL_SCENE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);

  useEffect(() => {
    if (scene.frames.length > 0 && !selectedFrameId) {
      setSelectedFrameId(scene.frames[0].id);
    }
  }, [scene.frames, selectedFrameId]);

  const addCharacter = async (name: string, description: string, imageUrl?: string) => {
    const id = `c-${Date.now()}`;
    const newChar: Character = { id, name, role: "Principal", description, image: imageUrl || 'loading://character' };
    setScene(prev => ({ ...prev, manifest: { ...prev.manifest, characters: [...prev.manifest.characters, newChar] } }));
    if (imageUrl) return;
    try {
      const img = await generateBibleAsset(name, description, 'character');
      if (img) setScene(prev => ({ ...prev, manifest: { ...prev.manifest, characters: prev.manifest.characters.map(c => c.id === id ? { ...c, image: img } : c) } }));
    } catch (err) { 
      setScene(prev => ({ ...prev, manifest: { ...prev.manifest, characters: prev.manifest.characters.filter(c => c.id !== id) } }));
    }
  };

  const removeCharacter = (id: string) => setScene(prev => ({ ...prev, manifest: { ...prev.manifest, characters: prev.manifest.characters.filter(c => c.id !== id) } }));

  const addEnvironment = async (name: string, description: string, imageUrl?: string) => {
    const id = `e-${Date.now()}`;
    const newEnv: Environment = { id, name, mood: "Concept", colors: ['#555'], image: imageUrl || 'loading://environment' };
    setScene(prev => ({ ...prev, manifest: { ...prev.manifest, environments: [...prev.manifest.environments, newEnv] } }));
    if (imageUrl) return;
    try {
      const img = await generateBibleAsset(name, description, 'environment');
      if (img) setScene(prev => ({ ...prev, manifest: { ...prev.manifest, environments: prev.manifest.environments.map(e => e.id === id ? { ...e, image: img } : e) } }));
    } catch (err) { 
      setScene(prev => ({ ...prev, manifest: { ...prev.manifest, environments: prev.manifest.environments.filter(e => e.id !== id) } }));
    }
  };

  const removeEnvironment = (id: string) => setScene(prev => ({ ...prev, manifest: { ...prev.manifest, environments: prev.manifest.environments.filter(e => e.id !== id) } }));

  const assignAssetToFrame = (assetId: string, type: 'char' | 'env') => {
    if (!selectedFrameId) return;
    setScene(prev => ({
      ...prev,
      frames: prev.frames.map(f => {
        if (f.id === selectedFrameId) {
          return type === 'char' ? { ...f, characterId: assetId } : { ...f, environmentId: assetId };
        }
        return f;
      })
    }));
  };

  const appendFrame = () => {
    const id = `f-ext-${Date.now()}`;
    const newFrame: Frame = {
      id,
      title: `Frame ${String(scene.frames.length + 1).padStart(2, '0')}`,
      timeRange: "00:00 - 00:05",
      image: "https://placehold.co/1280x720/1a1a1a/444?text=Empty+Shot",
      prompt: "New shot description...",
      scriptSegment: "...",
      directorsBrief: { emotionalArc: "Neutral", lightingScheme: "Standard", cameraLogic: "Static", pacing: "Moderate" }
    };
    setScene(prev => ({ ...prev, frames: [...prev.frames, newFrame] }));
    setSelectedFrameId(id);
  };

  const handleManuscriptUpload = async (text: string) => {
    setIsGenerating(true);
    try {
      const analysis = await analyzeManuscriptDeep(text);
      const characters = (analysis.characters || []).map((c: any, i: number) => ({ ...c, id: `c-auto-${i}`, image: 'loading://character' }));
      const environments = (analysis.environments || []).map((e: any, i: number) => ({ ...e, id: `e-auto-${i}`, image: 'loading://environment' }));
      setScene(prev => ({ ...prev, script: text, manifest: { ...prev.manifest, characters, environments } }));
      
      // Parallel generation of images for characters and environments
      characters.forEach(async (char: any) => {
        const img = await generateBibleAsset(char.name, char.description, 'character');
        if (img) setScene(prev => ({ ...prev, manifest: { ...prev.manifest, characters: prev.manifest.characters.map(c => c.id === char.id ? { ...c, image: img } : c) } }));
      });
      environments.forEach(async (env: any) => {
        const img = await generateBibleAsset(env.name, env.mood, 'environment');
        if (img) setScene(prev => ({ ...prev, manifest: { ...prev.manifest, environments: prev.manifest.environments.map(e => e.id === env.id ? { ...e, image: img } : e) } }));
      });
    } finally { setIsGenerating(false); }
  };

  const handleGenerateStoryboard = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const data = await generateSceneWithBrief(scene.script, scene.manifest, scene.genre);
      const newFrames = data.frames.map((f: any, i: number) => ({
        ...f,
        id: `f-${i}-${Date.now()}`,
        timeRange: `00:0${i*5} - 00:0${(i+1)*5}`,
        image: 'https://placehold.co/1280x720/1a1a1a/ecb613?text=Composing+Shot...',
        isGenerating: true
      }));
      setScene(prev => ({ ...prev, frames: newFrames }));
      if (newFrames.length > 0) setSelectedFrameId(newFrames[0].id);
      
      // Sequential image generation to avoid overwhelming the API
      for (let frame of newFrames) {
        try {
          const url = await generateNanoBananaImage(frame.prompt, scene.manifest, { 
            charId: frame.characterId, 
            envId: frame.environmentId, 
            shotType: frame.shotType, 
            emotion: frame.directorsBrief?.emotionalArc 
          });
          if (url) setScene(prev => ({ ...prev, frames: prev.frames.map(f => f.id === frame.id ? { ...f, image: url, isGenerating: false } : f) }));
        } catch (err) {
          setScene(prev => ({ ...prev, frames: prev.frames.map(f => f.id === frame.id ? { ...f, isGenerating: false, image: 'https://placehold.co/1280x720/333/fff?text=Error' } : f) }));
        }
      }
    } finally { setIsGenerating(false); }
  };

  const handleExportMovie = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    try {
      const videoUrl = await exportCinemaMovie(scene.frames, (p) => setExportProgress(p));
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `${scene.title || 'Lorecast'}.mp4`;
      a.click();
    } catch (err) { 
      alert("Export failed."); 
    } finally { 
      setIsExporting(false); 
    }
  };

  const handlePaintToEdit = async (frameId: string, instruction: string, coord?: { x: number, y: number }) => {
    const target = scene.frames.find(f => f.id === frameId);
    if (!target) return;
    setScene(prev => ({ ...prev, frames: prev.frames.map(f => f.id === frameId ? { ...f, isGenerating: true } : f) }));
    try {
      const editedUrl = await generateNanoBananaImage(
        instruction, 
        scene.manifest, 
        { charId: target.characterId, envId: target.environmentId, shotType: target.shotType, emotion: target.directorsBrief?.emotionalArc }, 
        target.image, 
        coord
      );
      if (editedUrl) setScene(prev => ({ ...prev, frames: prev.frames.map(f => f.id === frameId ? { ...f, image: editedUrl, isGenerating: false } : f) }));
    } catch (err) { 
      setScene(prev => ({ ...prev, frames: prev.frames.map(f => f.id === frameId ? { ...f, isGenerating: false } : f) })); 
    }
  };

  const handleSynthesizeAudio = async (frameId: string) => {
    const frame = scene.frames.find(f => f.id === frameId);
    if (!frame?.scriptSegment) return;
    setScene(prev => ({ ...prev, frames: prev.frames.map(f => f.id === frameId ? { ...f, isGeneratingAudio: true } : f) }));
    try {
      const audio = await generateEmotionalAudio(frame.scriptSegment, frame.directorsBrief?.emotionalArc || "Dramatic", scene.genre);
      if (audio) {
        setScene(prev => ({ ...prev, frames: prev.frames.map(f => f.id === frameId ? { ...f, audioData: audio, isGeneratingAudio: false } : f) }));
        playAudio(audio);
      }
    } catch (err) { 
      setScene(prev => ({ ...prev, frames: prev.frames.map(f => f.id === frameId ? { ...f, isGeneratingAudio: false } : f) })); 
    }
  };

  const playAudio = async (base64: string) => {
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
    source.connect(ctx.destination);
    source.start();
  };

  const selectedFrame = scene.frames.find(f => f.id === selectedFrameId);

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
          onScriptChange={(s) => setScene(prev => ({ ...prev, script: s }))} 
          onGenreChange={(g) => setScene(prev => ({ ...prev, genre: g }))}
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
