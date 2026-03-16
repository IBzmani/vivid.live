import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({
  vertexai: true,
  project: 'vivid-488415',
  location: 'global',
  apiVersion: 'v1beta1'
});

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let delay = 2000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const errorStr = String(error).toLowerCase();
      const isRetryable =
        errorStr.includes('503') || errorStr.includes('429') ||
        errorStr.includes('unavailable') || errorStr.includes('resource_exhausted');
      if (isRetryable && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delay));
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
    const { archetypeName, archetypeDescription, voiceName } = await req.json();

    // 1. Generate the intro text
    const textResponse = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: `You are a creative AI agent with the archetype: ${archetypeName}. ${archetypeDescription}. 
        Briefly introduce yourself to your new partner (the user) in 2 short sentences. 
        Stay in character.`,
      })
    );

    const introText = textResponse.text || 'I am ready to build worlds with you.';

    // 2. Generate TTS for the intro
    const audioResponse = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: introText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' } },
          },
        },
      })
    );

    const audioData = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? null;

    return NextResponse.json({ introText, audioData });
  } catch (err: any) {
    console.error('[/api/gemini/agent-intro]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
