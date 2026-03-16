import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Allow up to 5 minutes — interleaved multi-image generation takes time
export const maxDuration = 300;

const ai = new GoogleGenAI({
  vertexai: true,
  project: 'vivid-488415',
  location: 'us-central1',
});

const STYLE_GUIDE =
  'Aesthetic: High-fidelity cinematic concept art. Professional cinematography, realistic volumetric lighting, deep shadows, sharp digital painting. 8k resolution look.';

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let delay = 3000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const errorStr =
        String(error).toLowerCase() +
        (error?.message ? ' ' + error.message.toLowerCase() : '');
      const isRetryable =
        error?.status === 429 ||
        errorStr.includes('429') ||
        errorStr.includes('resource_exhausted') ||
        errorStr.includes('rate_limit') ||
        error?.status === 503 ||
        errorStr.includes('503') ||
        errorStr.includes('unavailable') ||
        errorStr.includes('deadline_exceeded');
      if (isRetryable && i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, delay + Math.random() * 1000));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
}

/**
 * Parses the interleaved response parts array from Gemini.
 * The model alternates between JSON text (frame metadata) and image inline data.
 *
 * Expected pattern per frame:
 *   parts[N]   → text: raw JSON object string
 *   parts[N+1] → inlineData: image bytes
 */
function parseInterleavedParts(parts: any[]): Array<{
  title: string;
  scriptSegment: string;
  shotType: string;
  characterId: string;
  environmentId: string;
  directorsBrief: { emotionalArc: string; lightingScheme: string; cameraLogic: string };
  imageUrl: string;
}> {
  const frames: any[] = [];
  let pendingMeta: any = null;

  for (const part of parts) {
    if (part.text) {
      // Try to extract a JSON object from the text part
      const trimmed = part.text.trim();
      const jsonMatch = trimmed.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          pendingMeta = JSON.parse(jsonMatch[0]);
        } catch {
          // Not valid JSON — could be preamble text, skip
        }
      }
    } else if (part.inlineData) {
      // Pair this image with the most recent pending metadata
      if (pendingMeta) {
        frames.push({
          title: pendingMeta.title || `Frame ${frames.length + 1}`,
          scriptSegment: pendingMeta.scriptSegment || '',
          shotType: pendingMeta.shotType || 'Medium Shot',
          characterId: pendingMeta.characterId || '',
          environmentId: pendingMeta.environmentId || '',
          directorsBrief: pendingMeta.directorsBrief || {
            emotionalArc: 'Neutral',
            lightingScheme: 'Natural',
            cameraLogic: 'Static',
          },
          imageUrl: `data:image/png;base64,${part.inlineData.data}`,
        });
        pendingMeta = null;
      }
    }
  }

  return frames;
}

export async function POST(req: NextRequest) {
  try {
    const { script, manifest, genre } = await req.json();

    const charList = manifest.characters
      .map((c: any) => `${c.name} (ID: ${c.id})`)
      .join(', ');
    const envList = manifest.environments
      .map((e: any) => `${e.name} (ID: ${e.id})`)
      .join(', ');

    const prompt = `You are a Film Director creating a complete storyboard for a ${genre} film.

For EACH storyboard frame, output EXACTLY in this order — no extra text before or between:
1. A single-line raw JSON object (no markdown, no code fences) with these fields:
   {"title":"...","scriptSegment":"...","shotType":"...","characterId":"...","environmentId":"...","directorsBrief":{"emotionalArc":"...","lightingScheme":"...","cameraLogic":"..."}}
2. Immediately followed by the cinematic storyboard image for that frame. ${STYLE_GUIDE} 16:9 aspect ratio.

Available Characters (use their IDs in characterId): ${charList || 'none'}
Available Environments (use their IDs in environmentId): ${envList || 'none'}

RULES:
- The "scriptSegment" must be verbatim text from the script.
- Use cinematic shot types: ECU, CU, MCU, MS, MLS, LS, ELS, OTS, POV, Dutch Angle.
- Use emotional performance tags in scriptSegment: [e.g., terrified whisper], [deadpan sarcasm].
- Output ALL frames covering the ENTIRE script. Do not truncate.
- ONLY output JSON lines and images. No other text whatsoever.

Genre: ${genre}
Script: ${script}`;

    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio: '16:9' },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const frames = parseInterleavedParts(parts);

      return { frames };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[/api/gemini/storyboard]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
