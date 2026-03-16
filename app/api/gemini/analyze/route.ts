import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
  vertexai: true,
  project: 'vivid-488415',
  location: 'global',
  apiVersion: 'v1beta1'
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
    const { manuscript } = await req.json();
    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: `Extract visual entities for a production bible.\nScript: ${manuscript}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              characters: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, role: { type: Type.STRING }, description: { type: Type.STRING } } } },
              environments: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, mood: { type: Type.STRING }, colors: { type: Type.ARRAY, items: { type: Type.STRING } } } } }
            }
          }
        }
      });
      return safeJsonParse(response.text);
    });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[/api/gemini/analyze]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
