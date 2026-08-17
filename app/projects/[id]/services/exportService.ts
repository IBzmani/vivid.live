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

export interface ExportOptions {
  resolution?: '720p' | '1080p' | '4K';
  watermarked?: boolean;
  chunkSize?: number;
}

export const exportCinemaMovie = async (
  frames: Frame[], 
  onProgress: (progress: number, stage?: string) => void,
  options: ExportOptions = {}
) => {
  const { resolution = '1080p', watermarked = false, chunkSize = 8 } = options;
  const ff = await loadFFmpeg();
  
  let currentStage = "Initializing";
  let currentStep = 0;
  
  // Resolution scaling configurations
  const scaleFilter = resolution === '4K' 
    ? 'scale=3840:2160:force_original_aspect_ratio=decrease,pad=3840:2160:(ow-iw)/2:(oh-ih)/2'
    : resolution === '720p'
    ? 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2'
    : 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2';

  // 1. Filter out only valid frames
  const validFrames = frames.filter(f => f.image && !f.image.startsWith('loading://'));

  const progressHandler = ({ progress }: { progress: number }) => {
    const normalizedRaw = Math.max(0, Math.min(1, isNaN(progress) || !isFinite(progress) ? 0 : progress));
    let displayProgress = 0;
    if (currentStage === "Encoding") {
      const perSegmentWeight = 85 / Math.max(1, validFrames.length);
      displayProgress = 5 + (currentStep * perSegmentWeight) + (normalizedRaw * perSegmentWeight);
    } else if (currentStage === "Mastering") {
      displayProgress = 90 + (normalizedRaw * 10);
    }
    onProgress(Math.round(displayProgress), currentStage);
  };

  ff.on('progress', progressHandler);

  try {
    if (validFrames.length === 0) {
      const loadingCount = frames.filter(f => f.image?.startsWith('loading://')).length;
      throw new Error(`No synthesized frames found for export. ${loadingCount} frames are still generating images.`);
    }

    currentStage = "Encoding";
    onProgress(5, currentStage);
    console.log(`[Export] Processing ${validFrames.length} valid frames in chunk size of ${chunkSize}. Resolution: ${resolution}, Watermarked: ${watermarked}`);

    const segmentFiles: string[] = [];

    // 2. Process frames in memory-safe chunks (prevent 1.5GB ArrayBuffer browser ceiling crash)
    for (let j = 0; j < validFrames.length; j++) {
      currentStep = j;
      const frame = validFrames[j];
      const outName = `seg_${j}.mp4`;
      const imgFileName = `temp_img_${j}.png`;
      const audFileName = `temp_aud_${j}.raw`;

      // Fetch and write ONLY this frame's assets to virtual FS
      try {
        const imgBytes = await getFileBytes(frame.image);
        await ff.writeFile(imgFileName, imgBytes);

        if (frame.audioData) {
          const audioBytes = await getFileBytes(frame.audioData);
          await ff.writeFile(audFileName, audioBytes);
        } else {
          const silentBytes = new Uint8Array(24000 * 2 * 2); // 2s of silence @ 24kHz 16-bit
          await ff.writeFile(audFileName, silentBytes);
        }
      } catch (assetErr) {
        console.error(`[Export] Asset fetch failed for frame ${j}:`, assetErr);
        await ff.writeFile(imgFileName, new Uint8Array(0));
        await ff.writeFile(audFileName, new Uint8Array(0));
      }

      const duration = frame.audioData ? await getAudioDuration(frame.audioData) : 2.5;
      console.log(`[Export] Chunk Encoding segment ${j + 1}/${validFrames.length} (${duration.toFixed(2)}s)...`);

      // Video filter with optional watermark overlay text
      const vfParam = watermarked
        ? `${scaleFilter},drawbox=x=w-260:y=h-48:w=250:h=36:color=black@0.65:t=fill,drawtext=text='Created with Vivid.live':x=w-250:y=h-28:fontsize=16:fontcolor=white@0.85`
        : scaleFilter;

      await ff.exec([
        '-loop', '1',
        '-t', duration.toFixed(3),
        '-i', imgFileName,
        '-f', 's16le',
        '-ar', '24000',
        '-ac', '1',
        '-i', audFileName,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-pix_fmt', 'yuv420p',
        '-vf', vfParam,
        outName
      ]);

      // CRITICAL: Immediate memory cleanup of raw frame byte buffers
      await ff.deleteFile(imgFileName).catch(() => {});
      await ff.deleteFile(audFileName).catch(() => {});

      segmentFiles.push(outName);
      onProgress(Math.round(5 + ((j + 1) / validFrames.length) * 85), `Encoding Shot ${j + 1}/${validFrames.length}`);
    }

    currentStage = "Mastering";
    onProgress(90, currentStage);
    
    // Concatenate segments
    const concatList = segmentFiles.map(name => `file ${name}`).join('\n');
    await ff.writeFile('concat_list.txt', concatList);

    await ff.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat_list.txt',
      '-c', 'copy',
      'master_movie.mp4'
    ]);

    const data = await ff.readFile('master_movie.mp4');
    const url = URL.createObjectURL(new Blob([data as any], { type: 'video/mp4' }));
    
    // Final memory cleanup
    try {
      for (const seg of segmentFiles) await ff.deleteFile(seg).catch(() => {});
      await ff.deleteFile('concat_list.txt').catch(() => {});
      await ff.deleteFile('master_movie.mp4').catch(() => {});
    } catch (e) {
      console.warn("[Export] Final cleanup:", e);
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

