import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getStyleGuide } from '@/lib/prompts';

// 1. Instance for Gemini 3.1 (Global)
const globalAi = new GoogleGenAI({
  vertexai: true,
  project: 'vivid-488415',
  location: 'global',
  apiVersion: 'v1beta1'
});

// 2. Instance for Imagen 3 (Regional)
const regionalAi = new GoogleGenAI({
  vertexai: true,
  project: 'vivid-488415',
  location: 'us-central1', // Imagen 3 lives here
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

export async function POST(req: NextRequest) {
  try {
    const { name, description, type, genre, visualStyle } = await req.json();
    const STYLE_GUIDE = getStyleGuide(visualStyle ?? 'Cinematic', genre ?? 'Drama');

    const prompt = type === 'character'
      ? `${STYLE_GUIDE}\n\nMASTER CHARACTER PLATE: ${name}. ${description}.`
      : `${STYLE_GUIDE}\n\nWORLD BUILDING PLATE: ${name}. ${description}.`;

    const result = await withRetry(async () => {
      try {
        // ATTEMPT 1: Gemini 3.1 (Global)
        const response = await globalAi.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseModalities: ['IMAGE'],
            imageConfig: { aspectRatio: '1:1', imageSize: '1K' }
          }
        });

        const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        throw new Error('3.1 Quota Exhausted');

      } catch (geminiError: any) {
        console.warn('Falling back to Regional Imagen 3...');
        
        // FALLBACK: Use regionalAi for Imagen
        const fallbackResponse = await regionalAi.models.generateContent({
          model: 'imagen-3.0-generate-002', 
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseModalities: ['IMAGE'],
            imageConfig: { aspectRatio: '1:1' }
          }
        });

        const fallbackPart = fallbackResponse.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (fallbackPart?.inlineData) return `data:image/png;base64,${fallbackPart.inlineData.data}`;
        
        throw geminiError;
      }
    });

    return NextResponse.json({ imageUrl: result });
  } catch (err: any) {
    console.error('[/api/gemini/bible-asset] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}