// import { NextRequest, NextResponse } from 'next/server';
// import { GoogleGenAI } from '@google/genai';

// const globalAi = new GoogleGenAI({
//   vertexai: true,
//   project: 'vivid-488415',
//   location: 'global',
//   apiVersion: 'v1beta1'
// });

// const regionalAi = new GoogleGenAI({
//   vertexai: true,
//   project: 'vivid-488415',
//   location: 'us-central1', // Imagen 3 lives here
// });

// const STYLE_GUIDE = 'Aesthetic: High-fidelity cinematic concept art. Professional cinematography, realistic volumetric lighting, deep shadows, sharp digital painting. 8k resolution look.';

// async function withRetry<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
//   let delay = 2000;
//   for (let i = 0; i < maxRetries; i++) {
//     try {
//       return await fn();
//     } catch (error: any) {
//       const errorStr = String(error).toLowerCase() + (error?.message ? ' ' + error.message.toLowerCase() : '');
//       const isRetryable =
//         error?.status === 429 || errorStr.includes('429') || errorStr.includes('resource_exhausted') ||
//         errorStr.includes('rate_limit') || error?.status === 503 || errorStr.includes('503') ||
//         errorStr.includes('unavailable') || errorStr.includes('deadline_exceeded');
//       if (isRetryable && i < maxRetries - 1) {
//         await new Promise(r => setTimeout(r, delay + Math.random() * 1000));
//         delay *= 2;
//         continue;
//       }
//       throw error;
//     }
//   }
//   throw new Error('Max retries reached');
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { prompt, manifest, references, baseImageData, baseImageMime, clickCoord } = await req.json();
//     const parts: any[] = [];

//     parts.push({ text: `${STYLE_GUIDE} EMOTION: ${references?.emotion || 'Intense'}.` });

//     if (references?.envId) {
//       const env = manifest.environments.find((e: any) => e.id === references.envId);
//       if (env?.image?.startsWith('data:')) {
//         const [header, data] = env.image.split(',');
//         parts.push({ inlineData: { mimeType: header.split(':')[1].split(';')[0], data } });
//         parts.push({ text: 'VISUAL DNA: Use the architecture and lighting from this world.' });
//       }
//     }

//     if (references?.charId) {
//       const char = manifest.characters.find((c: any) => c.id === references.charId);
//       if (char?.image?.startsWith('data:')) {
//         const [header, data] = char.image.split(',');
//         parts.push({ inlineData: { mimeType: header.split(':')[1].split(';')[0], data } });
//         parts.push({ text: `CHARACTER IDENTITY: This is ${char.name}.` });
//       }
//     }

//     if (baseImageData) {
//       parts.push({ inlineData: { mimeType: baseImageMime || 'image/png', data: baseImageData } });
//       if (clickCoord) parts.push({ text: `LOCAL EDIT at [x:${clickCoord.x}, y:${clickCoord.y}]: ${prompt}` });
//     }

//     parts.push({ text: `CINEMATIC STORYBOARD: ${references?.shotType || ''} showing ${prompt}.` });

//     const result = await withRetry(async () => {
//       try {
//         // Attempt 1: Gemini 3.1 (Global)
//         const response = await globalAi.models.generateContent({
//           model: 'gemini-3.1-flash-image-preview',
//           contents: [{ role: 'user', parts: parts }],
//           config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9', imageSize: '1K' } }
//         });

//         const imgPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
//         if (imgPart?.inlineData) return `data:image/png;base64,${imgPart.inlineData.data}`;
//         throw new Error('3.1 Quota Exhausted');

//       } catch (err) {
//         // Attempt 2: Imagen 3 (Regional)
//         const fallback = await regionalAi.models.generateContent({
//           model: 'imagen-3.0-generate-002',
//           contents: [{ role: 'user', parts: parts }],
//           config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9' } }
//         });

//         const fallPart = fallback.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
//         return fallPart?.inlineData ? `data:image/png;base64,${fallPart.inlineData.data}` : null;
//       }
//     });

//     return NextResponse.json({ imageUrl: result });
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }





import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

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

const STYLE_GUIDE = 'Aesthetic: High-fidelity cinematic concept art. Professional cinematography, realistic volumetric lighting, deep shadows, sharp digital painting. 8k resolution look.';

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
  try {
    const { prompt, manifest, references, baseImageData, baseImageMime, clickCoord } = await req.json();
    const parts: any[] = [];

    // 1. GLOBAL STYLE & ATMOSPHERE
    parts.push({ text: `${STYLE_GUIDE} MOOD: ${references?.emotion || 'Cinematic'}.` });

    // 2. ENVIRONMENT DNA (Reference Image + Instruction)
    if (references?.envId) {
      const env = manifest.environments.find((e: any) => e.id === references.envId);
      if (env?.image?.startsWith('data:')) {
        const [header, data] = env.image.split(',');
        parts.push({ inlineData: { mimeType: header.split(':')[1].split(';')[0], data } });
        parts.push({ text: 'ENVIRONMENT CONTEXT: Extract the architectural style, color palette, and lighting from this reference image.' });
      }
    }

    // 3. CHARACTER IDENTITY (Reference Image + Instruction)
    if (references?.charId) {
      const char = manifest.characters.find((c: any) => c.id === references.charId);
      if (char?.image?.startsWith('data:')) {
        const [header, data] = char.image.split(',');
        parts.push({ inlineData: { mimeType: header.split(':')[1].split(';')[0], data } });
        parts.push({ text: `CHARACTER IDENTITY: This is ${char.name}. Match their specific facial features, hair, and clothing style precisely.` });
      }
    }

    // 4. MASKING / EDITING (For 'Repaint' functionality)
    if (baseImageData) {
      parts.push({ inlineData: { mimeType: baseImageMime || 'image/png', data: baseImageData } });
      if (clickCoord) {
        parts.push({ text: `EDIT AREA: Target the specific region at [x:${clickCoord.x}%, y:${clickCoord.y}%] and modify it based on this instruction: ${prompt}` });
      } else {
        parts.push({ text: `REFINEMENT: Use this existing image as a structural base for the following prompt: ${prompt}` });
      }
    }

    // 5. FINAL SHOT PROMPT
    parts.push({ text: `STORYBOARD FRAME: A ${references?.shotType || 'cinematic shot'} showing ${prompt}. High-fidelity digital concept art.` });

    const result = await withRetry(async () => {
      try {
        // PRIMARY: Gemini 3.1 Flash Image (Nano Banana 2)
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
        console.warn('[/api/gemini/image] Falling back to Stable Imagen 3...');
        
        // BACKUP: Imagen 3 (Regional)
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

    return NextResponse.json({ imageUrl: result });
  } catch (err: any) {
    console.error('[/api/gemini/image] Critical Synthesis Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}