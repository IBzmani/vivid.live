import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
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

function safeJsonParse(text: string | undefined): any {
  if (!text) return {};
  try {
    return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch {
    const match = text?.match(/\{[\s\S]*\}/);
    if (match) { try { return JSON.parse(match[0]); } catch { return {}; } }
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const { script, manifest, genre } = await req.json();
    const charList = manifest.characters.map((c: any) => `${c.name} (ID: ${c.id})`).join(', ');
    const envList = manifest.environments.map((e: any) => `${e.name} (ID: ${e.id})`).join(', ');

    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `As a Film Director specialized in ${genre} cinema, partition the ENTIRE provided script into a sequence of storyboard frames.
        
RULES:
1. Use the Bible entities: Characters: ${charList}. Locations: ${envList}.
2. The "scriptSegment" for each frame MUST be the actual original text.
3. Use intense EMOTIONAL PERFORMANCE TAGS suited for the ${genre} genre (e.g., if Comedy: [deadpan sarcasm], if Horror: [terrified stuttering]).

Genre: ${genre}
Script: ${script}`,
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
                    directorsBrief: { type: Type.OBJECT, properties: { emotionalArc: { type: Type.STRING }, lightingScheme: { type: Type.STRING }, cameraLogic: { type: Type.STRING } } }
                  }
                }
              }
            }
          }
        }
      });
      return safeJsonParse(response.text);
    });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[/api/gemini/scene]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
