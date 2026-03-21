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