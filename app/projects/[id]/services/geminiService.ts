/**
 * Client-side wrapper for the Gemini API routes.
 * All heavy lifting (Vertex AI, ADC auth) is done server-side.
 */
import { VisualManifest, Genre, VoiceName } from '../types';

/**
 * Compresses a base64 image string to ensure it fits within Firestore's 1MB limit.
 * Targets ~800KB to be safe with document overhead.
 */
async function compressImage(base64: string, quality = 0.7, maxWidth = 1024): Promise<string> {
  if (!base64 || !base64.startsWith('data:image')) return base64;
  
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64);

      ctx.drawImage(img, 0, 0, width, height);
      // Iteratively reduce quality if still too large? For now 0.7 is a good balance.
      const compressed = canvas.toDataURL('image/jpeg', quality);
      console.log(`[geminiService] Compressed image: ${base64.length} -> ${compressed.length} bytes`);
      resolve(compressed);
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

async function post<T>(path: string, body: unknown): Promise<T> {
  console.log(`[geminiService] POST ${path}`, body);
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    console.log(`[geminiService] Response from ${path}: ${res.status}`);
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      console.error(`[geminiService] Error from ${path}:`, err);
      throw new Error(err.error || `${path} failed with status ${res.status}`);
    }

    const data = await res.json();
    
    // Robustness: Sometimes the model/API might return a JSON-stringified string
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return data as unknown as T;
      }
    }
    
    return data;
  } catch (error) {
    console.error(`[geminiService] Fetch failed for ${path}:`, error);
    throw error;
  }
}

/**
 * Converts a URL or data-URI to raw base64 + mimeType.
 * Runs in the browser before sending to the API route.
 */
async function toBase64(url: string): Promise<{ data: string; mimeType: string }> {
  if (url.startsWith('data:')) {
    const [header, data] = url.split(',');
    return { data, mimeType: header.split(':')[1].split(';')[0] };
  }
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve({ data: (reader.result as string).split(',')[1], mimeType: blob.type });
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return { data: '', mimeType: 'image/png' };
  }
}

// ---------------------------------------------------------------------------

export const generateBibleAsset = async (
  name: string,
  description: string,
  type: 'character' | 'environment'
): Promise<string | null> => {
  const data = await post<{ imageUrl: string | null }>('/api/gemini/bible-asset', { name, description, type });
  if (data.imageUrl && data.imageUrl.startsWith('data:image')) {
    return compressImage(data.imageUrl);
  }
  return data.imageUrl;
};

export const analyzeManuscriptDeep = async (manuscript: string) => {
  return post<any>('/api/gemini/analyze', { manuscript });
};

export const generateSceneWithBrief = async (
  script: string,
  manifest: VisualManifest,
  genre: Genre
) => {
  return post<any>('/api/gemini/scene', { script, manifest, genre });
};

/** 
 * Interleaved storyboard generation — one API call returns frames with
 * both metadata (text) and images already synthesised, interleaved in the
 * model response. Replaces the separate scene + per-frame image calls.
 */
export const generateStoryboard = async (
  script: string,
  manifest: VisualManifest,
  genre: Genre
): Promise<{ frames: Array<{
  title: string;
  scriptSegment: string;
  shotType: string;
  characterId: string;
  environmentId: string;
  directorsBrief: { emotionalArc: string; lightingScheme: string; cameraLogic: string };
  imageUrl: string;
}> }> => {
  const data = await post<{ frames: any[] }>('/api/gemini/storyboard', { script, manifest, genre });
  
  if (data.frames) {
    data.frames = await Promise.all(data.frames.map(async (frame: any) => {
      if (frame.imageUrl && frame.imageUrl.startsWith('data:image')) {
        frame.imageUrl = await compressImage(frame.imageUrl);
      }
      return frame;
    }));
  }
  
  return data;
};


export const generateNanoBananaImage = async (
  prompt: string,
  manifest: VisualManifest,
  references: { charId?: string; envId?: string; shotType?: string; emotion?: string } = {},
  baseImage?: string,
  clickCoord?: { x: number; y: number }
): Promise<string | null> => {
  // Resolve base image to raw base64 on the client before sending
  let baseImageData: string | undefined;
  let baseImageMime: string | undefined;
  if (baseImage) {
    const b64 = await toBase64(baseImage);
    baseImageData = b64.data || undefined;
    baseImageMime = b64.mimeType;
  }

  const data = await post<{ imageUrl: string | null }>('/api/gemini/image', {
    prompt,
    manifest,
    references,
    baseImageData,
    baseImageMime,
    clickCoord,
  });
  
  if (data.imageUrl && data.imageUrl.startsWith('data:image')) {
    return compressImage(data.imageUrl);
  }
  return data.imageUrl;
};

export const generateEmotionalAudio = async (
  text: string,
  brief: string,
  genre: Genre,
  voice?: VoiceName,
  language?: string
): Promise<string | null> => {
  const data = await post<{ audioData: string | null }>('/api/gemini/audio', {
    text,
    brief,
    genre,
    voice,
    language,
  });
  return data.audioData;
};

export const chatWithCoCreator = async (
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  context: { script: string; manifest: VisualManifest; genre: Genre }
): Promise<string | null> => {
  const data = await post<{ text: string | null }>('/api/gemini/chat', {
    message,
    history,
    context,
  });
  return data.text;
};
