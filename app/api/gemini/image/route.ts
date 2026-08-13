import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { uploadBase64ToGCS } from '@/lib/gcs';
import { getStyleGuide } from '@/lib/prompts';

// GLOBAL Instance: Dedicated to Frontier Multimodal Models (Nano Banana 2)
const globalAi = new GoogleGenAI({
  vertexai: true,
  project: 'vivid-488415',
  location: 'global',
  apiVersion: 'v1beta1'
});

// REGIONAL Instance: Dedicated to Stable Production Models (Imagen 3)
const regionalAi = new GoogleGenAI({
  vertexai: true,
  project: 'vivid-488415',
  location: 'us-central1', 
});

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  let delay = 2000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const errorStr = String(error).toLowerCase();
      const isRetryable = error?.status === 429 || errorStr.includes('quota') || errorStr.includes('limit');
      if (isRetryable && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delay + Math.random() * 1000));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
}

export async function POST(req: NextRequest) {
  /**
   * Converts an image source (data URI or public URL) to an inlineData part.
   * Returns null if the image is unavailable or in a loading state.
   */
  async function toInlinePart(imageUrl: string | undefined): Promise<{ mimeType: string; data: string } | null> {
    if (!imageUrl || imageUrl.startsWith('loading://')) return null;
    if (imageUrl.startsWith('data:')) {
      const [header, data] = imageUrl.split(',');
      return { mimeType: header.split(':')[1].split(';')[0], data };
    }
    if (imageUrl.startsWith('http')) {
      try {
        const res = await fetch(imageUrl);
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        const b64 = Buffer.from(buf).toString('base64');
        const mime = res.headers.get('content-type') || 'image/png';
        return { mimeType: mime, data: b64 };
      } catch {
        return null;
      }
    }
    return null;
  }

  try {
    const { prompt, manifest, references, baseImageData, baseImageMime, clickCoord, genre, visualStyle } = await req.json();
    const STYLE_GUIDE = getStyleGuide(visualStyle ?? 'Cinematic', genre ?? 'Drama');
    const parts: any[] = [];

    // 1. GLOBAL STYLE & ATMOSPHERE
    parts.push({ text: `${STYLE_GUIDE} MOOD: ${references?.emotion || 'Cinematic'}.` });

    // 2. ENVIRONMENT MASTER PLATE & DNA
    if (references?.envId) {
      const env = manifest.environments?.find((e: any) => e.id === references.envId);
      const masterPlateUrl = env?.masterPlate || env?.image;
      const envPart = await toInlinePart(masterPlateUrl);
      if (envPart) {
        parts.push({ inlineData: envPart });
        parts.push({ text: `ENVIRONMENT MASTER PLATE: Extract architectural layout, set lighting, and color space from location "${env?.name || 'Environment'}".` });
      }
    }

    // 3. CHARACTER IDENTITY & MULTI-ANGLE TURNAROUND
    if (references?.charId) {
      const char = manifest.characters?.find((c: any) => c.id === references.charId);
      if (char) {
        // Main identity reference image
        const charPart = await toInlinePart(char.image);
        if (charPart) {
          parts.push({ inlineData: charPart });
          parts.push({ text: `PRIMARY CHARACTER IDENTITY: This is ${char.name} (${char.description || ''}). Match facial features, hair structure, eye shape, and clothing style precisely.` });
        }
        // Additional turnaround angle reference if available
        const profileAngleUrl = char.angles?.profile || char.angles?.front;
        if (profileAngleUrl && profileAngleUrl !== char.image) {
          const anglePart = await toInlinePart(profileAngleUrl);
          if (anglePart) {
            parts.push({ inlineData: anglePart });
            parts.push({ text: `CHARACTER TURNAROUND ANGLE: Secondary angle reference for ${char.name} to maintain 3D facial volume.` });
          }
        }
      }
    }

    // 4. MASKING / EDITS
    if (baseImageData) {
      parts.push({ inlineData: { mimeType: baseImageMime || 'image/png', data: baseImageData } });
      if (clickCoord) {
        parts.push({ text: `EDIT AREA: Target region [x:${clickCoord.x}%, y:${clickCoord.y}%]: ${prompt}` });
      } else {
        parts.push({ text: `REFINEMENT: Use this base: ${prompt}` });
      }
    }

    // 5. FINAL SHOT COMPOSITION & ANGLE
    const shotLabel = references?.shotAngle || references?.shotType || 'Cinematic Shot';
    parts.push({ text: `STORYBOARD FRAME: A ${shotLabel} showing ${prompt}. Maintain character identity and environment continuity accurately.` });

    const rawBase64 = await withRetry(async () => {
      try {
        // PRIMARY: Gemini 3.1 Flash Image
        const response = await globalAi.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: [{ role: 'user', parts: parts }],
          config: { 
            responseModalities: ['IMAGE'], 
            imageConfig: { aspectRatio: '16:9', imageSize: '1K' } 
          }
        });

        const imgPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (imgPart?.inlineData) return `data:image/png;base64,${imgPart.inlineData.data}`;
        throw new Error('Nano Banana 2 Quota Exhausted');

      } catch (err) {
        console.warn('[/api/gemini/image] Falling back to Imagen 3...');
        const fallback = await regionalAi.models.generateContent({
          model: 'imagen-3.0-generate-002',
          contents: [{ role: 'user', parts: parts }],
          config: { 
            responseModalities: ['IMAGE'], 
            imageConfig: { aspectRatio: '16:9' } 
          }
        });

        const fallPart = fallback.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        return fallPart?.inlineData ? `data:image/png;base64,${fallPart.inlineData.data}` : null;
      }
    });

    if (!rawBase64) throw new Error('Failed to generate image data');

    // --- NEW: UPLOAD TO GCS PIPELINE ---
    // Generate a unique filename to prevent overwriting
    const fileName = `storyboard/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    
    // This uploads the 2K image and returns the storage URL
    const publicUrl = await uploadBase64ToGCS(rawBase64, fileName);

    // Return the URL to the frontend. Frontend will save THIS to Firestore.
    return NextResponse.json({ imageUrl: publicUrl });

  } catch (err: any) {
    console.error('[/api/gemini/image] Critical Synthesis Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}