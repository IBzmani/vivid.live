import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  vertexai: true,
  project: 'vivid-488415',
  location: 'africa-south1',
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
    const { name, description, type } = await req.json();

    const prompt = type === 'character'
      ? `MASTER CHARACTER PLATE: ${name}. ${description}. Detailed character concept art, neutral background, cinematic design, ${STYLE_GUIDE}`
      : `WORLD BUILDING PLATE: ${name}. ${description}. Establishing shot showing architecture, textures, and lighting mood for this location. ${STYLE_GUIDE}`;

    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-preview-image-generation',
        contents: { parts: [{ text: prompt }] },
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio: '1:1', imageSize: '1K' }
        }
      });
      const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
    });

    return NextResponse.json({ imageUrl: result });
  } catch (err: any) {
    console.error('[/api/gemini/bible-asset]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
