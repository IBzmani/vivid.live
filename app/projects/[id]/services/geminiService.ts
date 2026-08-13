/**
 * Client-side wrapper for the Gemini API routes.
 * All heavy lifting (Vertex AI, ADC auth) is done server-side.
 */
import { VisualManifest, Genre, VoiceName, VisualStyle } from '../types';

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
 * NEW: Uploads a giant Base64 string to GCS and returns a tiny URL string.
 * This prevents the "Property image is longer than 1048487 bytes" error.
 */
export async function uploadToGCS(base64: string, fileName: string, contentType?: string): Promise<string> {
  console.log(`[geminiService] Offloading large image to GCS: ${fileName}`);
  const data = await post<{ url: string }>('/api/storage/upload', { base64, fileName, contentType });
  return data.url;
}

/**
 * Converts a URL or data-URI to raw base64 + mimeType.
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
  type: 'character' | 'environment',
  genre: Genre,
  visualStyle: VisualStyle
): Promise<string | null> => {
  const data = await post<{ imageUrl: string | null }>('/api/gemini/bible-asset', { name, description, type, genre, visualStyle });
  return data.imageUrl;
};

export const analyzeManuscriptDeep = async (manuscript: string) => {
  return post<any>('/api/gemini/analyze', { manuscript });
};

export const generateStoryboard = async (
  script: string,
  manifest: VisualManifest,
  genre: Genre,
  visualStyle: VisualStyle
): Promise<{ frames: any[] }> => {
  const data = await post<{ frames: any[] }>('/api/gemini/storyboard', { script, manifest, genre, visualStyle });
  return data;
};

export const generateNanoBananaImage = async (
  prompt: string,
  manifest: VisualManifest,
  references: { charId?: string; envId?: string; shotType?: string; emotion?: string } = {},
  genre: Genre,
  visualStyle: VisualStyle,
  baseImage?: string,
  clickCoord?: { x: number; y: number }
): Promise<string | null> => {
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
    genre,
    visualStyle,
  });
  
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

export const generateDialogueAudio = async (
  dialogueText: string,
  speakerName?: string,
  voice?: VoiceName,
  genre?: Genre,
  language?: string
): Promise<{ audioUrl: string | null; audioData: string | null }> => {
  return post<{ audioUrl: string | null; audioData: string | null }>('/api/audio/dialogue', {
    dialogueText,
    speakerName,
    voice,
    genre,
    language,
  });
};

export const generateVideoMotion = async (
  imageUrl: string,
  prompt: string,
  cameraMotion?: string,
  shotAngle?: string
): Promise<{ videoUrl: string | null; motionPrompt: string }> => {
  return post<{ videoUrl: string | null; motionPrompt: string }>('/api/video/motion', {
    imageUrl,
    prompt,
    cameraMotion,
    shotAngle,
  });
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

