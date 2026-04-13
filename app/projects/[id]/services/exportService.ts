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
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed: ${url} (${response.status})`);
    const blob = await response.blob();
    return URL.createObjectURL(new Blob([blob], { type: mimeType }));
  } catch (e) {
    console.error(`Failed to create blob for ${url}:`, e);
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
    const [coreURL, wasmURL, workerURL] = await Promise.all([
      getAssetAsBlob(`${CORE_BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
      getAssetAsBlob(`${CORE_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
      getRewrittenWorkerURL(WRAPPER_BASE_URL)
    ]);

    console.log("Stage 2: Initializing FFmpeg with local Blobs...");
    console.log("Worker URL:", workerURL);

    await ff.load({
      coreURL,
      wasmURL,
      workerURL,
      // @ts-ignore - Some versions of @ffmpeg/ffmpeg use this key for the worker
      classWorkerURL: workerURL
    });
    
    console.log("Stage 3: FFmpeg ready.");
    return ff;
  })();

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
  onProgress: (progress: number) => void
) => {
  const ff = await loadFFmpeg();
  
  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress(Math.round(progress * 100));
  };
  ff.on('progress', progressHandler);

  try {
    // 1. Filter out only truly invalid frames (like those in loading state or without any image)
    const validFrames = frames.filter(f => f.image && !f.image.startsWith('loading://'));
    
    if (validFrames.length === 0) {
      const loadingCount = frames.filter(f => f.image?.startsWith('loading://')).length;
      throw new Error(`No synthesized frames found for export. ${loadingCount} frames are still generating images. Please wait for synthesis to complete.`);
    }

    console.log(`[Export] Processing ${validFrames.length} valid frames. (Total frames: ${frames.length})`);

    // Write frames to FS
    for (let i = 0; i < validFrames.length; i++) {
      const frame = validFrames[i];
      
      // Image
      const imgBytes = await getFileBytes(frame.image);
      await ff.writeFile(`img${i}.png`, imgBytes);
      
      // Audio (with silent fallback)
      if (frame.audioData) {
        let audioBytes: Uint8Array;
        if (frame.audioData.startsWith('http')) {
          const res = await fetch(frame.audioData);
          const buf = await res.arrayBuffer();
          audioBytes = new Uint8Array(buf);
        } else {
          const audioBinary = atob(frame.audioData);
          audioBytes = new Uint8Array(audioBinary.length);
          for (let j = 0; j < audioBinary.length; j++) audioBytes[j] = audioBinary.charCodeAt(j);
        }
        await ff.writeFile(`aud${i}.raw`, audioBytes);
      } else {
        console.warn(`[Export] Frame ${i} (${frame.id}) is missing audio. Using 2s silence fallback.`);
        // Create 2 seconds of silence (24000 samples/sec * 2 bytes/sample for 16-bit)
        const silentBytes = new Uint8Array(24000 * 2 * 2); 
        await ff.writeFile(`aud${i}.raw`, silentBytes);
      }
    }

    const segmentFiles: string[] = [];
    
    // Encode individual segments
    for (let i = 0; i < validFrames.length; i++) {
      const frame = validFrames[i];
      // If no audioData, use 2.0s as duration for the silent segment
      const duration = frame.audioData ? await getAudioDuration(frame.audioData) : 2.0;
      const outName = `seg${i}.mp4`;
      
      console.log(`[Export] Encoding segment ${i} (Duration: ${duration.toFixed(2)}s)...`);
      
      await ff.exec([
        '-loop', '1',
        '-t', duration.toFixed(3),
        '-i', `img${i}.png`,
        '-f', 's16le',
        '-ar', '24000',
        '-ac', '1',
        '-i', `aud${i}.raw`,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
        outName
      ]);
      segmentFiles.push(outName);
    }

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
    
    // Post-export cleanup
    try {
      for (let i = 0; i < validFrames.length; i++) {
        await ff.deleteFile(`img${i}.png`);
        await ff.deleteFile(`aud${i}.raw`);
        await ff.deleteFile(`seg${i}.mp4`);
      }
      await ff.deleteFile('list.txt');
      await ff.deleteFile('output.mp4');
    } catch (e) {
      console.warn("FS cleanup issue:", e);
    }

    return url;
  } finally {
    ff.off('progress', progressHandler);
  }
};
