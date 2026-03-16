import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  vertexai: true,
  project: 'vivid-488415',
  location: 'us-central1',
});

const STYLE_GUIDE = 'Aesthetic: High-fidelity cinematic concept art. Professional cinematography, realistic volumetric lighting, deep shadows, sharp digital painting. 8k resolution look.';

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  let delay = 2000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const errorStr = String(error).toLowerCase() + (error?.message ? ' ' + error.message.toLowerCase() : '');
      const isRetryable =
        error?.status === 429 || errorStr.includes('429') || errorStr.includes('resource_exhausted') ||
        errorStr.includes('rate_limit') || error?.status === 503 || errorStr.includes('503') ||
        errorStr.includes('unavailable') || errorStr.includes('deadline_exceeded');
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
  try {
    const { prompt, manifest, references, baseImageData, baseImageMime, clickCoord } = await req.json();
    const parts: any[] = [];

    if (references?.charId) {
      const char = manifest.characters.find((c: any) => c.id === references.charId);
      if (char?.image && !char.image.startsWith('loading://') && char.image.startsWith('data:')) {
        const [header, data] = char.image.split(',');
        const mimeType = header.split(':')[1].split(';')[0];
        if (data) {
          parts.push({ inlineData: { mimeType, data } });
          parts.push({ text: `CHARACTER IDENTITY: This is ${char.name}.` });
        }
      }
    }

    if (references?.envId) {
      const env = manifest.environments.find((e: any) => e.id === references.envId);
      if (env?.image && !env.image.startsWith('loading://') && env.image.startsWith('data:')) {
        const [header, data] = env.image.split(',');
        const mimeType = header.split(':')[1].split(';')[0];
        if (data) {
          parts.push({ inlineData: { mimeType, data } });
          parts.push({ text: 'VISUAL DNA: Architecture and lighting from this world.' });
        }
      }
    }

    if (baseImageData) {
      parts.push({ inlineData: { mimeType: baseImageMime || 'image/png', data: baseImageData } });
      if (clickCoord) parts.push({ text: `LOCAL EDIT at [x:${clickCoord.x}, y:${clickCoord.y}]: ${prompt}` });
    }

    parts.push({ text: `CINEMATIC STORYBOARD: ${references?.shotType || ''} showing ${prompt}. EMOTION: ${references?.emotion || 'Intense'}. ${STYLE_GUIDE}` });

    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts },
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio: '16:9', imageSize: '1K' }
        }
      });
      const imgPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      return imgPart?.inlineData ? `data:image/png;base64,${imgPart.inlineData.data}` : null;
    });

    return NextResponse.json({ imageUrl: result });
  } catch (err: any) {
    console.error('[/api/gemini/image]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
