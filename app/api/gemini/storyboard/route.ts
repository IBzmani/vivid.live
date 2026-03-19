// import { NextRequest, NextResponse } from 'next/server';
// import { GoogleGenAI } from '@google/genai';

// // Allow up to 5 minutes — interleaved multi-image generation takes time
// export const maxDuration = 300;

// const ai = new GoogleGenAI({
//   vertexai: true,
//   project: 'vivid-488415',
//   location: 'global', 
//   apiVersion: 'v1beta1'
// });

// const STYLE_GUIDE =
//   'Aesthetic: High-fidelity cinematic concept art. Professional cinematography, realistic volumetric lighting, deep shadows, sharp digital painting. 8k resolution look.';

// async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
//   let delay = 3000;
//   for (let i = 0; i < maxRetries; i++) {
//     try {
//       return await fn();
//     } catch (error: any) {
//       const errorStr =
//         String(error).toLowerCase() +
//         (error?.message ? ' ' + error.message.toLowerCase() : '');
//       const isRetryable =
//         error?.status === 429 ||
//         errorStr.includes('429') ||
//         errorStr.includes('resource_exhausted') ||
//         errorStr.includes('rate_limit') ||
//         error?.status === 503 ||
//         errorStr.includes('503') ||
//         errorStr.includes('unavailable') ||
//         errorStr.includes('deadline_exceeded');
//       if (isRetryable && i < maxRetries - 1) {
//         await new Promise((r) => setTimeout(r, delay + Math.random() * 1000));
//         delay *= 2;
//         continue;
//       }
//       throw error;
//     }
//   }
//   throw new Error('Max retries reached');
// }

// function parseInterleavedParts(parts: any[]): Array<{
//   title: string;
//   scriptSegment: string;
//   shotType: string;
//   characterId: string;
//   environmentId: string;
//   directorsBrief: { emotionalArc: string; lightingScheme: string; cameraLogic: string };
//   imageUrl: string;
// }> {
//   const frames: any[] = [];
//   let pendingMeta: any = null;

//   for (const part of parts) {
//     if (part.text) {
//       const trimmed = part.text.trim();
//       const jsonMatch = trimmed.match(/\{[\s\S]*?\}/);
//       if (jsonMatch) {
//         try {
//           pendingMeta = JSON.parse(jsonMatch[0]);
//         } catch {
//           // Skip non-JSON preamble or conversational text
//         }
//       }
//     } else if (part.inlineData) {
//       if (pendingMeta) {
//         frames.push({
//           title: pendingMeta.title || `Frame ${frames.length + 1}`,
//           scriptSegment: pendingMeta.scriptSegment || '',
//           shotType: pendingMeta.shotType || 'Medium Shot',
//           characterId: pendingMeta.characterId || '',
//           environmentId: pendingMeta.environmentId || '',
//           directorsBrief: pendingMeta.directorsBrief || {
//             emotionalArc: 'Neutral',
//             lightingScheme: 'Natural',
//             cameraLogic: 'Static',
//           },
//           imageUrl: `data:image/png;base64,${part.inlineData.data}`,
//         });
//         pendingMeta = null;
//       }
//     }
//   }
//   return frames;
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { script, manifest, genre } = await req.json();

//     const charList = manifest.characters
//       .map((c: any) => `${c.name} (ID: ${c.id})`)
//       .join(', ');
//     const envList = manifest.environments
//       .map((e: any) => `${e.name} (ID: ${e.id})`)
//       .join(', ');

//     // Atmosphere-First: Prioritizing Style and Strict Interleaved Rules
//     const prompt = `${STYLE_GUIDE}
// You are a Film Director creating a complete storyboard for a ${genre} film. 
// All images must be 16:9 aspect ratio.

// For EACH storyboard frame, output EXACTLY in this order:
// 1. A single-line raw JSON object (no markdown) with these fields:
//    {"title":"...","scriptSegment":"...","shotType":"...","characterId":"...","environmentId":"...","directorsBrief":{"emotionalArc":"...","lightingScheme":"...","cameraLogic":"..."}}
// 2. Immediately followed by the cinematic storyboard image for that frame.

// Available Characters (IDs): ${charList || 'none'}
// Available Environments (IDs): ${envList || 'none'}

// RULES:
// - You must use interleaved output: JSON text block then Image bytes.
// - "scriptSegment" must be verbatim from the script.
// - Shot types: ECU, CU, MCU, MS, MLS, LS, ELS, OTS, POV, Dutch Angle.
// - Genre: ${genre}
// - Script: ${script}`;

//     const result = await withRetry(async () => {
//       try {
//         // ATTEMPT 1: Frontier Gemini 3.1 Flash (The Interleaved Heavyweight)
//         const response = await ai.models.generateContent({
//           model: 'gemini-3.1-flash-image-preview',
//           contents: [{ role: 'user', parts: [{ text: prompt }] }],
//           config: {
//             responseModalities: ['TEXT', 'IMAGE'],
//             imageConfig: { aspectRatio: '16:9' },
//           },
//         });

//         const frames = parseInterleavedParts(response.candidates?.[0]?.content?.parts ?? []);
//         if (frames.length > 0) return { frames };
//         throw new Error('Empty 3.1 interleaved response');

//       } catch (err: any) {
//         // FALLBACK: Stable Gemini 2.5 Flash
//         // This ensures compliance with the interleaved requirement even if 3.1 is exhausted.
//         console.warn('[/api/gemini/storyboard] 3.1 Fallback triggered:', err.message);

//         const fallbackResponse = await ai.models.generateContent({
//           model: 'gemini-1.5-flash',
//           contents: [{ role: 'user', parts: [{ text: prompt }] }],
//           config: {
//             responseModalities: ['TEXT', 'IMAGE'],
//             imageConfig: { aspectRatio: '16:9' },
//           },
//         });

//         const frames = parseInterleavedParts(fallbackResponse.candidates?.[0]?.content?.parts ?? []);
//         return { frames };
//       }
//     });

//     return NextResponse.json(result);
//   } catch (err: any) {
//     console.error('[/api/gemini/storyboard] Critical Failure:', err);
//     return NextResponse.json({ 
//       error: err.message,
//       details: err.response?.error || null 
//     }, { status: 500 });
//   }
// }






import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

// Logic-Only Route: partitioning the script into frames
export const maxDuration = 300;

const ai = new GoogleGenAI({
  vertexai: true,
  project: 'vivid-488415',
  location: 'global', // Gemini 3.1 Lite is globally routed for speed
  apiVersion: 'v1beta1'
});

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let delay = 2000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const errorStr = String(error).toLowerCase();
      const isRetryable = error?.status === 429 || errorStr.includes('quota') || error?.status === 503;
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

export async function POST(req: NextRequest) {
  try {
    const { script, manifest, genre } = await req.json();

    const charList = manifest.characters.map((c: any) => `${c.name} (ID: ${c.id})`).join(', ');
    const envList = manifest.environments.map((e: any) => `${e.name} (ID: ${e.id})`).join(', ');

    const prompt = `As a Film Director specialized in ${genre} cinema, partition the ENTIRE provided script into a sequence of storyboard frames.

RULES:
1. Use the Bible entities: Characters: ${charList || 'none'}. Locations: ${envList || 'none'}.
2. The "scriptSegment" for each frame MUST be the actual original text.
3. For "prompt", write a detailed visual description for an AI image generator. Include lighting, camera angle, and character action.
4. "directorsBrief" must contain emotional and technical direction.

Script: ${script}`;

    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview', // Speed king for logic
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              frames: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    scriptSegment: { type: Type.STRING },
                    characterId: { type: Type.STRING },
                    environmentId: { type: Type.STRING },
                    shotType: { type: Type.STRING },
                    directorsBrief: {
                      type: Type.OBJECT,
                      properties: {
                        emotionalArc: { type: Type.STRING },
                        lightingScheme: { type: Type.STRING },
                        cameraLogic: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Gemini 3.1 handles the JSON schema natively, no regex needed
      return JSON.parse(response.candidates?.[0]?.content?.parts?.[0]?.text || '{"frames":[]}');
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[/api/gemini/storyboard] Logic Failure:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}