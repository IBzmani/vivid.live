import { FFmpeg } from '@ffmpeg/ffmpeg';
import { Frame } from '../types';

/**
 * Manual implementation of toBlobURL to avoid @ffmpeg/util dependency
 * which may trigger read-only fetch errors in some environments.
 */
async function toBlobURL(url: string, mimeType: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return URL.createObjectURL(new Blob([blob], { type: mimeType }));
}

let loadPromise: Promise<FFmpeg> | null = null;

const FFMPEG_VERSION = '0.12.10';
const CORE_VERSION = '0.12.6';

// Using unpkg for asset resolution as it's a literal file provider
const WRAPPER_BASE_URL = `https://unpkg.com/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/esm`;
const CORE_BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`;

/**
 * Creates a Blob URL for a remote asset.
 */
async function getAssetAsBlob(url: string, mimeType: string): Promise<string> {
  console.log(`[FFmpeg] Fetching asset: ${url} (${mimeType})...`);
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`Fetch failed with status: ${response.status}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(new Blob([blob], { type: mimeType }));
    console.log(`[FFmpeg] Asset loaded successfully: ${url} -> ${blobUrl}`);
    return blobUrl;
  } catch (e) {
    console.error(`[FFmpeg] Primary fetch failed for ${url}. Attempting manual conversion fallback...`, e);
    // Fallback to library utility
    return await toBlobURL(url, mimeType);
  }
}

/**
 * Deeply rewrites the worker script to satisfy CORS Worker policies.
 * 1. Fetches worker.js text.
 * 2. Replaces all relative imports (e.g., ./index.js) with absolute CDN URLs.
 * 3. Returns a same-origin Blob URL.
 */
async function getRewrittenWorkerURL(baseUrl: string): Promise<string> {
  const url = `${baseUrl}/worker.js`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Worker fetch failed: ${response.status}`);
    const code = await response.text();
    
    // Replace relative imports: from "./index.js" -> from "https://unpkg.com/.../index.js"
    const rewrittenCode = code.replace(/from\s+['"]\.\/(.*?)['"]/g, (match, p1) => {
      return `from '${baseUrl}/${p1}'`;
    });
    
    const blob = new Blob([rewrittenCode], { type: 'text/javascript' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.warn("Worker rewrite failed, attempting fallback blob...", error);
    return getAssetAsBlob(url, 'text/javascript');
  }
}

async function loadFFmpeg(): Promise<FFmpeg> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ff = new FFmpeg();
    
    console.log("Stage 1: Creating same-origin Blobs for FFmpeg assets...");
    
    // We create Blob URLs for EVERYTHING to ensure no cross-origin construction happens
    const assets = await Promise.all([
      getAssetAsBlob(`${CORE_BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
      getAssetAsBlob(`${CORE_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
      getRewrittenWorkerURL(WRAPPER_BASE_URL)
    ]).catch(err => {
      console.error("[FFmpeg] Asset loading phase failed critical block:", err);
      throw err;
    });

    const [coreURL, wasmURL, workerURL] = assets;

    console.log("Stage 2: Initializing FFmpeg with local Blobs...");
    console.log("Worker URL:", workerURL);
    console.log("WASM URL:", wasmURL);

    // Provide detailed options to help debugging and ensure compatibility
    await ff.load({
      coreURL,
      wasmURL,
      workerURL,
      // Some versions expect this key
      // @ts-ignore
      classWorkerURL: workerURL
    }).catch(err => {
      console.error("[FFmpeg] ff.load() failed. Page may not be correctly Cross-Origin Isolated.", err);
      throw err;
    });
    
    console.log("Stage 3: FFmpeg ready.");
    return ff;
  })().catch((err) => {
    // CRITICAL: Clear the cache so the next export attempt can retry loading.
    // Without this, a single failure permanently kills the export button.
    console.error("[FFmpeg] Load failed, clearing cache for retry:", err);
    loadPromise = null;
    throw err;
  });

  return loadPromise;
}

/**
 * Converts image source to Uint8Array.
 */
async function getFileBytes(url: string): Promise<Uint8Array> {
  if (!url) return new Uint8Array();
  if (url.startsWith('data:')) {
    const base64 = url.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Calculates audio duration for FFmpeg -t flag.
 */
async function getAudioDuration(audioSource: string): Promise<number> {
  try {
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
    
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass({ sampleRate: 24000 });
    
    try {
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      return buffer.duration;
    } finally {
      ctx.close();
    }
  } catch (e) {
    console.error("Duration calc failed:", e);
    return 5.0; // Fallback duration
  }
}

export const exportCinemaMovie = async (
  frames: Frame[], 
  onProgress: (progress: number, stage?: string) => void
) => {
  const ff = await loadFFmpeg();
  
  let currentStage = "Initializing";
  let currentGlobalProgress = 0;
  let currentStep = 0;
  
  // Weights: 
  // 0-10%: Loading Assets
  // 10-90%: Encoding Segments
  // 90-100%: Mastering Final Movie
  
  const progressHandler = ({ progress }: { progress: number }) => {
    // Standardize the raw progress from FFmpeg (0-1)
    const normalizedRaw = Math.max(0, Math.min(1, isNaN(progress) || !isFinite(progress) ? 0 : progress));
    
    let displayProgress = 0;
    if (currentStage === "Encoding") {
      const perSegmentWeight = 80 / validFrames.length;
      displayProgress = 10 + (currentStep * perSegmentWeight) + (normalizedRaw * perSegmentWeight);
    } else if (currentStage === "Mastering") {
      displayProgress = 90 + (normalizedRaw * 10);
    }
    
    onProgress(Math.round(displayProgress), currentStage);
  };

  ff.on('progress', progressHandler);

  // 1. Filter out only truly invalid frames (like those in loading state or without any image)
  const validFrames = frames.filter(f => f.image && !f.image.startsWith('loading://'));

  try {
    if (validFrames.length === 0) {
      const loadingCount = frames.filter(f => f.image?.startsWith('loading://')).length;
      throw new Error(`No synthesized frames found for export. ${loadingCount} frames are still generating images. Please wait for synthesis to complete.`);
    }

    currentStage = "Loading Assets";
    onProgress(5, currentStage);
    console.log(`[Export] Processing ${validFrames.length} valid frames. (Total frames: ${frames.length})`);

    // Write frames to FS
    for (let i = 0; i < validFrames.length; i++) {
      const frame = validFrames[i];
      try {
        // Image
        const imgBytes = await getFileBytes(frame.image);
        await ff.writeFile(`img${i}.png`, imgBytes);
        
        // Audio (with silent fallback)
        if (frame.audioData) {
          const audioBytes = await getFileBytes(frame.audioData);
          await ff.writeFile(`aud${i}.raw`, audioBytes);
        } else {
          console.warn(`[Export] Frame ${i} is missing audio. Using silence fallback.`);
          const silentBytes = new Uint8Array(24000 * 2 * 2); // 2s of silence @ 24kHz 16-bit
          await ff.writeFile(`aud${i}.raw`, silentBytes);
        }
      } catch (assetErr) {
        console.error(`[Export] Failed to load assets for frame ${i}:`, assetErr);
        // We write a small empty file to prevent FFmpeg from hanging on missing input
        await ff.writeFile(`img${i}.png`, new Uint8Array(0));
        await ff.writeFile(`aud${i}.raw`, new Uint8Array(0));
      }
      onProgress(5 + (i / validFrames.length) * 5, currentStage);
    }

    const segmentFiles: string[] = [];
    currentStage = "Encoding";
    
    // Encode individual segments
    for (let j = 0; j < validFrames.length; j++) {
      currentStep = j;
      const frame = validFrames[j];
      const duration = frame.audioData ? await getAudioDuration(frame.audioData) : 2.0;
      const outName = `seg${j}.mp4`;
      
      console.log(`[Export] Encoding segment ${j}/${validFrames.length} (Duration: ${duration.toFixed(2)}s)...`);
      
      await ff.exec([
        '-loop', '1',
        '-t', duration.toFixed(3),
        '-i', `img${j}.png`,
        '-f', 's16le',
        '-ar', '24000',
        '-ac', '1',
        '-i', `aud${j}.raw`,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
        outName
      ]);
      
      // Immediate cleanup of raw assets to save WASM memory
      await ff.deleteFile(`img${j}.png`).catch(() => {});
      await ff.deleteFile(`aud${j}.raw`).catch(() => {});
      
      segmentFiles.push(outName);
    }

    currentStage = "Mastering";
    onProgress(90, currentStage);
    
    // Concatenate segments
    const concatList = segmentFiles.map(name => `file ${name}`).join('\n');
    await ff.writeFile('list.txt', concatList);

    await ff.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'list.txt',
      '-c', 'copy',
      'output.mp4'
    ]);

    const data = await ff.readFile('output.mp4');
    const url = URL.createObjectURL(new Blob([data as any], { type: 'video/mp4' }));
    
    // Final cleanup
    try {
      for (const seg of segmentFiles) await ff.deleteFile(seg).catch(() => {});
      await ff.deleteFile('list.txt').catch(() => {});
      await ff.deleteFile('output.mp4').catch(() => {});
    } catch (e) {
      console.warn("[Export] Final FS cleanup issue:", e);
    }

    currentStage = "Complete";
    onProgress(100, currentStage);
    return url;

  } catch (err: any) {
    console.error("[Export] Critical error during movie generation:", err);
    throw err;
  } finally {
    ff.off('progress', progressHandler);
  }
};
