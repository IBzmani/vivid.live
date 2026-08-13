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
import { SceneState, Character, Environment, Frame, Genre, VoiceName, VisualStyle } from './types';
import Header from './components/Header';
import SidebarScript from './components/SidebarScript';
import VisionStage from './components/VisionStage';
import WorldBible from './components/WorldBible';
import TimelineFooter from './components/TimelineFooter';
import CoCreatorAgent from './components/CoCreatorAgent';

import { 
  analyzeManuscriptDeep, 
  generateNanoBananaImage, 
  generateEmotionalAudio, 
  generateBibleAsset,
  generateStoryboard,
  chatWithCoCreator,
  uploadToGCS
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
  const [synthImages, setSynthImages] = useState<Record<string, string>>({});

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
          visualStyle: data.visualStyle || prev.visualStyle,
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
          visualStyle: 'Cinematic',
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

  // Merge manifest with synthesized images that aren't persisted to Firestore yet
  const mergedManifest = React.useMemo(() => {
    return {
      characters: scene.manifest.characters.map(c => ({ 
        ...c, 
        image: synthImages[c.id] || c.image 
      })),
      environments: scene.manifest.environments.map(e => ({ 
        ...e, 
        image: synthImages[e.id] || e.image 
      }))
    };
  }, [scene.manifest, synthImages]);

  const mergedFrames = React.useMemo(() => {
    return scene.frames.map(f => ({
      ...f,
      image: synthImages[f.id] || f.image
    }));
  }, [scene.frames, synthImages]);

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
    console.log(`[Page] addCharacter: ${name}`);
    const id = `char_${crypto.randomUUID()}`;
    // If it's a data URI, we don't want to save it to Firestore yet.
    const isDataUri = imageUrl?.startsWith('data:');
    const initialImageUrl = isDataUri ? 'loading://character' : (imageUrl || 'loading://character');

    const charData = { name, role: "Principal", description, image: initialImageUrl };
    
    // Optimistic Update: Add to local state immediately
    setScene(prev => ({
      ...prev,
      manifest: {
        ...prev.manifest,
        characters: [...prev.manifest.characters, { ...charData, id, image: imageUrl || initialImageUrl }]
      }
    }));

    if (imageUrl) {
      setSynthImages(prev => ({ ...prev, [id]: imageUrl }));
    }
    try {
      // Start both operations. If setDoc hangs, the API call should still proceed in the network tab if we don't await it too early.
      console.log(`[Page] Writing character ${id} to Firestore...`);
      const firestorePromise = withFirestoreRetry(() => setDoc(doc(db, 'projects', projectId, 'characters', id), charData));
      
      if (imageUrl) {
        if (isDataUri) {
          // Offload to GCS
          const finalImageUrl = await uploadToGCS(imageUrl, `${id}.png`);
          await firestorePromise;
          await updateDoc(doc(db, 'projects', projectId, 'characters', id), { image: finalImageUrl });
        } else {
          await firestorePromise;
        }
        return;
      }
      
      console.log(`[Page] Triggering image synthesis for ${name}...`);
      const apiPromise = generateBibleAsset(name, description, 'character', scene.genre, scene.visualStyle);
      
      // DECOUPLE: Update local state immediately upon API resolution
      apiPromise.then(async (img) => {
        if (img) {
          console.log(`[Page] Synthesis successful for ${id}, checking if GCS offload needed...`);
          setSynthImages(prev => ({ ...prev, [id]: img }));
          
          let finalImageUrl = img;
          if (img.startsWith('data:')) {
            finalImageUrl = await uploadToGCS(img, `${id}.png`);
          }
          
          await updateDoc(doc(db, 'projects', projectId, 'characters', id), { image: finalImageUrl });
        }
      }).catch(err => console.error(`[Page] Synthesis failed for ${id}:`, err));

      await firestorePromise;
      
    } catch (err) {
      console.error(`[Page] addCharacter failed:`, err);
      // Ensure we don't leave it in loading state in Firestore if possible
      try {
        await updateDoc(doc(db, 'projects', projectId, 'characters', id), { 
          image: "https://placehold.co/1024x1024/333/fff?text=Error" 
        });
      } catch {}
      handleFirestoreError(err, 'write/synthesize', `projects/${projectId}/characters/${id}`);
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
        const img = await generateBibleAsset(name, description, 'character', scene.genre, scene.visualStyle);
        if (img) {
          console.log(`[Page] Update successful, showing image locally...`);
          setSynthImages(prev => ({ ...prev, [existing.id]: img }));
          
          let finalImageUrl = img;
          if (img.startsWith('data:')) {
            finalImageUrl = await uploadToGCS(img, `${existing.id}.png`);
          }
          await updateDoc(doc(db, 'projects', projectId, 'characters', existing.id), { image: finalImageUrl });
        } else {
          await updateDoc(doc(db, 'projects', projectId, 'characters', existing.id), { image: "https://placehold.co/1024x1024/333/fff?text=No+Image" });
        }
      } catch (err) {
        handleFirestoreError(err, 'update', `projects/${projectId}/characters/${existing.id}`);
      }
    } else {
      addCharacter(name, description);
    }
  };

  const addEnvironment = async (name: string, description: string, imageUrl?: string) => {
    console.log(`[Page] addEnvironment: ${name}`);
    const id = `env_${crypto.randomUUID()}`;
    // If it's a data URI, we don't want to save it to Firestore yet.
    const isDataUri = imageUrl?.startsWith('data:');
    const initialImageUrl = isDataUri ? 'loading://environment' : (imageUrl || 'loading://environment');

    const envData = { name, mood: "Concept", colors: ['#555'], image: initialImageUrl };
    
    // Optimistic Update: Add to local state immediately
    setScene(prev => ({
      ...prev,
      manifest: {
        ...prev.manifest,
        environments: [...prev.manifest.environments, { ...envData, id, image: imageUrl || initialImageUrl }]
      }
    }));

    if (imageUrl) {
      setSynthImages(prev => ({ ...prev, [id]: imageUrl }));
    }
    try {
      console.log(`[Page] Writing environment ${id} to Firestore...`);
      const firestorePromise = withFirestoreRetry(() => setDoc(doc(db, 'projects', projectId, 'environments', id), envData));
      
      if (imageUrl) {
        if (isDataUri) {
          // Offload to GCS
          const finalImageUrl = await uploadToGCS(imageUrl, `${id}.png`);
          await firestorePromise;
          await updateDoc(doc(db, 'projects', projectId, 'environments', id), { image: finalImageUrl });
        } else {
          await firestorePromise;
        }
        return;
      }
      
      console.log(`[Page] Triggering environment synthesis for ${name}...`);
      const apiPromise = generateBibleAsset(name, description, 'environment', scene.genre, scene.visualStyle);
      
      // DECOUPLE: Update local state immediately upon API resolution
      apiPromise.then(async (img) => {
        if (img) {
          console.log(`[Page] Env synthesis successful for ${id}, checking if GCS offload needed...`);
          setSynthImages(prev => ({ ...prev, [id]: img }));
          
          let finalImageUrl = img;
          if (img.startsWith('data:')) {
            finalImageUrl = await uploadToGCS(img, `${id}.png`);
          }
          
          await updateDoc(doc(db, 'projects', projectId, 'environments', id), { image: finalImageUrl });
        }
      }).catch(err => console.error(`[Page] Env synthesis failed for ${id}:`, err));

      await firestorePromise;

    } catch (err) {
      console.error(`[Page] addEnvironment failed:`, err);
      try {
        await updateDoc(doc(db, 'projects', projectId, 'environments', id), { 
          image: "https://placehold.co/1280x720/333/fff?text=Error" 
        });
      } catch {}
      handleFirestoreError(err, 'write/synthesize', `projects/${projectId}/environments/${id}`);
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
        const img = await generateBibleAsset(name, description, 'environment', scene.genre, scene.visualStyle);
        if (img) {
          console.log(`[Page] Update successful, showing environment locally...`);
          setSynthImages(prev => ({ ...prev, [existing.id]: img }));
          
          let finalImageUrl = img;
          if (img.startsWith('data:')) {
            finalImageUrl = await uploadToGCS(img, `${existing.id}.png`);
          }
          await updateDoc(doc(db, 'projects', projectId, 'environments', existing.id), { image: finalImageUrl });
        } else {
          await updateDoc(doc(db, 'projects', projectId, 'environments', existing.id), { image: "https://placehold.co/1280x720/333/fff?text=No+Image" });
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

    // Don't await these individual additions if you want them to pop in 
    // as they finish. Trigger them and let the local state handle the rest.
    analysis.characters?.forEach((char: any) => addCharacter(char.name, char.description));
    analysis.environments?.forEach((env: any) => addEnvironment(env.name, env.mood));

  } catch (err) {
    console.error("Manuscript analysis failed:", err);
  } finally {
    setIsGenerating(false); 
  }
};

  const snapCollection = async (path: string) => {
    const { getDocs } = await import('firebase/firestore');
    return getDocs(collection(db, path));
  };

  /**
   * Silently generates audio for every frame in the background after storyboard
   * creation. Runs sequentially to respect TTS rate limits. Saves audioData to
   * Firestore as each frame completes — no user click needed.
   */
  const autoGenerateAudio = async (frames: { id: string; scriptSegment: string; directorsBrief?: any }[]) => {
    for (const frame of frames) {
      if (!frame.scriptSegment) continue;
      try {
        const audio = await generateEmotionalAudio(
          frame.scriptSegment,
          frame.directorsBrief?.emotionalArc || 'Dramatic',
          scene.genre,
          scene.voice,
          scene.language
        );
        if (audio) {
          const finalAudioUrl = await uploadToGCS(audio, `${frame.id}.raw`, 'audio/pcm');
          await updateDoc(doc(db, 'projects', projectId, 'frames', frame.id), { audioData: finalAudioUrl });
        }
      } catch (err) {
        console.warn(`Auto-audio failed for frame ${frame.id}:`, err);
        // Non-fatal — user can still click to generate on demand
      }
    }
  };

  const handleGenerateStoryboard = async () => {
  if (isGenerating) return;
  setIsGenerating(true);

  let frameDataArray: any[] = [];
  try {
    // 1. Get the JSON metadata (The logic)
    const data = await generateStoryboard(scene.script, scene.manifest, scene.genre, scene.visualStyle);
    
    // Clear old frames
    const frameSnaps = await snapCollection(`projects/${projectId}/frames`);
    await Promise.all(frameSnaps.docs.map(d => deleteDoc(d.ref)));



    // 2. Create the frames in Firestore with 'loading' state
    frameDataArray = (data.frames || []).map((f: any, i: number) => {
      const id = `f-${crypto.randomUUID()}`;
      return { ...f, id, image: 'loading://storyboard', order: i };
    });

    await Promise.all(
      frameDataArray.map(f => 
        setDoc(doc(db, 'projects', projectId, 'frames', f.id), f).catch(e => console.error("Initial frame save failed:", e))
      )
    );

    // 3. FAN OUT: Trigger high-fidelity synthesis in parallel
  frameDataArray.forEach(async (f) => {
    try {
      // We use the 'f.prompt' here—this is the detailed description 
      // generated by the 3.1 Flash Lite architect.
      console.log(`[Vivid] Dispatching Frame ${f.id} to Nano Banana 2...`);
      const img = await generateNanoBananaImage(
        f.prompt, 
        scene.manifest, 
        { 
          charId: f.characterId, 
          envId: f.environmentId, 
          shotType: f.shotType, 
          emotion: f.directorsBrief?.emotionalArc 
        },
        scene.genre,
        scene.visualStyle
      );
      console.log(`[Vivid] Received URL for Frame ${f.id}:`, img);

      if (img) {
        // 1. OPTIMISTIC UPDATE: Show it to the user INSTANTLY
        setSynthImages(prev => ({ ...prev, [f.id]: img }));
        
        // 2. BACKGROUND SYNC: Offload to GCS and update Firestore
        try {
          let finalImageUrl = img;
          if (img.startsWith('data:')) {
            finalImageUrl = await uploadToGCS(img, `${f.id}.png`);
          }
          await updateDoc(doc(db, 'projects', projectId, 'frames', f.id), { image: finalImageUrl });
          console.log(`[Vivid] Cloud sync complete for Frame ${f.id}`);
        } catch (dbErr) {
          console.error(`[Vivid] Cloud sync failed for Frame ${f.id}:`, dbErr);
        }
      }
    } catch (e) {
      console.error(`Frame ${f.id} synthesis failed:`, e);
      // Fallback image so the user isn't stuck with a spinner forever
      await updateDoc(doc(db, 'projects', projectId, 'frames', f.id), { 
        image: 'https://placehold.co/1280x720/1a1a1a/666?text=Synthesis+Error' 
      });
    }
  });

  } catch (err) {
    console.error('Storyboard failed:', err);
  } finally {
    setIsGenerating(false);

    // 3. Now 'finally' can see 'frameDataArray' because it was declared at the top!
    if (frameDataArray.length > 0) {
      console.log("[Vivid] Starting background audio synthesis...");
      autoGenerateAudio(frameDataArray);
    }
  }
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
        scene.genre,
        scene.visualStyle,
        target.image, 
        coord
      );
      
      if (editedUrl) {
        setSynthImages(prev => ({ ...prev, [frameId]: editedUrl }));
        
        let finalImageUrl = editedUrl;
        if (editedUrl.startsWith('data:')) {
          finalImageUrl = await uploadToGCS(editedUrl, `${frameId}_refined.png`);
        }
        await updateDoc(doc(db, 'projects', projectId, 'frames', frameId), { image: finalImageUrl });
      }
    } catch (err) {
      console.error("Paint to edit failed", err);
    } finally {
      setScene(prev => ({ ...prev, frames: prev.frames.map(f => f.id === frameId ? { ...f, isGenerating: false } : f) }));
    }
  };

  const handleSynthesizeAudio = async (frameId: string) => {
    // 1. Check local state AND a direct Firestore fetch to be absolutely sure
    const frame = scene.frames.find(f => f.id === frameId);
    if (!frame?.scriptSegment) return;

    // Guard: Prevent concurrent generations for the same frame
    if (frame.isGeneratingAudio) {
      console.log(`[Vivid] Audio already synthesizing for frame ${frameId}. Ignoring request.`);
      return;
    }

    if (frame.audioData) {
      console.log(`[Vivid] Audio already exists in local state for frame ${frameId}. Playing...`);
      playAudio(frame.audioData, scene.playbackRate);
      return;
    }

    try {
      // 2. Set loading state locally IMMEDIATELY
      setScene(prev => ({ 
        ...prev, 
        frames: prev.frames.map(f => f.id === frameId ? { ...f, isGeneratingAudio: true } : f) 
      }));

      // 3. Double-check Firestore before calling API (functional patterns might be slightly behind)
      const frameRef = doc(db, 'projects', projectId, 'frames', frameId);
      const snap = await withFirestoreRetry(() => getDoc(frameRef));
      const remoteData = snap.exists() ? snap.data() : null;

      if (remoteData?.audioData) {
        console.log(`[Vivid] Found audio in Firestore for frame ${frameId}. Syncing and playing.`);
        setScene(prev => ({
          ...prev,
          frames: prev.frames.map(f => 
            f.id === frameId ? { ...f, audioData: remoteData.audioData, isGeneratingAudio: false } : f
          )
        }));
        playAudio(remoteData.audioData, scene.playbackRate);
        return;
      }

      // 4. Truly generate if NOT found in Firestore
      console.log(`[Vivid] No audio found for frame ${frameId}. Triggering synthesis...`);
      const audio = await generateEmotionalAudio(
        frame.scriptSegment,
        frame.directorsBrief?.emotionalArc || 'Dramatic',
        scene.genre,
        scene.voice,
        scene.language
      );

      if (audio) {
        console.log(`[Vivid] Audio synthesized for frame ${frameId}. Persisting...`);
        
        const finalAudioUrl = await uploadToGCS(audio, `${frameId}.raw`, 'audio/pcm');

        // 5. Update local state IMMEDIATELY
        setScene(prev => ({
          ...prev,
          frames: prev.frames.map(f => 
            f.id === frameId ? { ...f, audioData: finalAudioUrl, isGeneratingAudio: false } : f
          )
        }));

        // 6. Play immediately
        playAudio(finalAudioUrl, scene.playbackRate);

        // 7. Background sync to Firestore
        await updateDoc(frameRef, { audioData: finalAudioUrl });
        console.log(`[Vivid] Audio synced to Firestore for frame ${frameId}`);
      }
    } catch (err) {
      console.error('Audio synthesis failed', err);
      // Reset loading state on error
      setScene(prev => ({ 
        ...prev, 
        frames: prev.frames.map(f => f.id === frameId ? { ...f, isGeneratingAudio: false } : f) 
      }));
    }
  };

  const playAudio = async (audioSource: string, rate: number = 1.0) => {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass({ sampleRate: 24000 });
    
    let bytes: Uint8Array;
    if (audioSource.startsWith('http')) {
      const res = await fetch(audioSource);
      const buf = await res.arrayBuffer();
      bytes = new Uint8Array(buf);
    } else {
      const binary = atob(audioSource);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    }
    
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

//   const autoGenerateAllAudio = async (framesToProcess: any[]) => {
//   console.log("[Vivid] Starting sequential background audio synthesis...");
//   for (const f of framesToProcess) {
//     // Skip if already has audio
//     if (f.audioData) continue; 
    
//     try {
//       const audio = await generateEmotionalAudio(
//         f.scriptSegment,
//         f.directorsBrief?.emotionalArc || 'Dramatic',
//         scene.genre,
//         scene.voice,
//         scene.language
//       );
//       if (audio) {
//         await updateDoc(doc(db, 'projects', projectId, 'frames', f.id), { audioData: audio });
//         // Update local state so the UI shows the "Audio Ready" status
//         setScene(prev => ({
//           ...prev,
//           frames: prev.frames.map(frame => frame.id === f.id ? { ...frame, audioData: audio } : frame)
//         }));
//       }
//     } catch (e) {
//       console.warn(`Auto-audio failed for ${f.id}`, e);
//     }
//   }
// };

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


  const [exportStage, setExportStage] = useState<string>("");

  const handleExportMovie = async () => {
    if (isExporting) return;
    
    const validFrames = scene.frames.filter(f => f.image && !f.image.startsWith('loading://'));
    if (validFrames.length === 0) {
      alert("No rendered frames available to export. Please wait for image synthesis to finish.");
      return;
    }

    console.log(`[Vivid] Starting Cinema Export for ${validFrames.length} frames...`);
    setIsExporting(true);
    setExportProgress(0);
    setExportStage("Initializing FFmpeg...");

    try {
      const url = await exportCinemaMovie(scene.frames, (progress, stage) => {
        setExportProgress(Math.min(100, progress));
        if (stage) setExportStage(stage);
      });
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${scene.title || 'lorecast'}.mp4`;
        a.click();
      }
    } catch (err: any) {
      console.error("[Vivid] Export failed critical error:", err);
      alert(`Export Failed: ${err.message || "Unknown error"}. Check console for details.`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setExportStage("");
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

  const handleGenerateVideoMotion = async (frameId: string) => {
    const frame = scene.frames.find(f => f.id === frameId);
    if (!frame || !frame.image || frame.image.startsWith('loading://')) return;

    try {
      setScene(prev => ({
        ...prev,
        frames: prev.frames.map(f => f.id === frameId ? { ...f, isGeneratingVideo: true } : f)
      }));

      const { generateVideoMotion } = await import('./services/geminiService');
      const { videoUrl } = await generateVideoMotion(
        frame.image,
        frame.prompt,
        frame.cameraMotion,
        frame.shotAngle || frame.shotType
      );

      if (videoUrl) {
        setScene(prev => ({
          ...prev,
          frames: prev.frames.map(f => f.id === frameId ? { ...f, videoUrl, isGeneratingVideo: false } : f)
        }));
        await updateDoc(doc(db, 'projects', projectId, 'frames', frameId), { videoUrl });
      }
    } catch (err) {
      console.error('Video motion generation failed:', err);
    } finally {
      setScene(prev => ({
        ...prev,
        frames: prev.frames.map(f => f.id === frameId ? { ...f, isGeneratingVideo: false } : f)
      }));
    }
  };

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
          visualStyle={scene.visualStyle}
          voice={scene.voice}
          language={scene.language}
          playbackRate={scene.playbackRate}
          onScriptChange={(s) => updateProjectField('script', s)} 
          onGenreChange={(g) => updateProjectField('genre', g)}
          onVisualStyleChange={(vs) => updateProjectField('visualStyle', vs)}
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
          frames={mergedFrames} 
          selectedFrameId={selectedFrameId} 
          onSelectFrame={setSelectedFrameId} 
          onRefine={handlePaintToEdit} 
          onPlayAudio={handleSynthesizeAudio} 
          onGenerateVideo={handleGenerateVideoMotion}
          onAppendFrame={appendFrame} 
        />
        <WorldBible 
          manifest={mergedManifest} 
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
        manifest={mergedManifest}
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
              <p className="text-slate-500 text-sm uppercase tracking-widest font-bold mb-10">{exportStage || "Stitching Sequence"}: {exportProgress}%</p>
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
