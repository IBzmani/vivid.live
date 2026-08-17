import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';
import { deductCredits } from '@/lib/credits';
import { ACTION_COSTS } from '@/lib/plans';

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

export async function POST(req: NextRequest) {
  try {
    const { text, brief, genre, voice, language, userId } = await req.json();

    if (userId) {
      const deduction = await deductCredits(
        userId, 
        ACTION_COSTS.DIALOGUE_VOICEOVER, 
        'Synthesize Emotional Voiceover Audio',
        { voice, genre }
      );

      if (!deduction.success) {
        return NextResponse.json({ 
          error: 'Insufficient credits for voiceover audio.',
          code: 'INSUFFICIENT_CREDITS',
          requiredCredits: ACTION_COSTS.DIALOGUE_VOICEOVER 
        }, { status: 402 });
      }
    }

    const isDialogue = /[:""].*?[""]/.test(text) || text.includes('"') || text.includes("'");
    let voiceName: string = voice || 'Charon';
    let genreContext = '';

    if (!voice) {
      switch (genre) {
        case 'Comedy': voiceName = 'Puck'; genreContext = 'with perfect comedic timing, high energy, and sharp wit.'; break;
        case 'Horror': voiceName = 'Fenrir'; genreContext = 'with a deep, ominous, and terrifying atmosphere. Every pause should be heavy with dread.'; break;
        case 'Action': voiceName = 'Fenrir'; genreContext = 'with high intensity, grit, and aggressive pacing.'; break;
        case 'Drama':
        case 'Noir': voiceName = isDialogue ? 'Kore' : 'Charon'; genreContext = 'with deep emotional resonance and cinematic gravitas.'; break;
        case 'Sci-Fi': voiceName = 'Zephyr'; genreContext = 'with a precise, slightly detached, and futuristic authority.'; break;
      }
    }

    const performancePrompt = `
INSTRUCTION: Perform the following script ${genreContext} in ${language || 'English'}. 
The script contains bracketed emotional cues [like this]. 
STRICT RULE: DO NOT SPEAK THE BRACKETED TEXT ALOUD. Use it ONLY to guide your vocal delivery.
PERSONA: ${isDialogue ? 'Master Character Actor' : 'Cinematic Narrator'}.

SCRIPT: 
${text}`.trim();

    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        // FIX: Added the mandatory role: 'user' wrapper
        contents: [
          {
            role: 'user', 
            parts: [{ text: performancePrompt }]
          }
        ],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            voiceConfig: { 
              prebuiltVoiceConfig: { 
                voiceName: voiceName // Ensure this variable is used correctly
              } 
            } 
          }
        },
      });

      // Navigate carefully to the audio data
      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      return part?.inlineData?.data ?? null;
    });

    return NextResponse.json({ audioData: result });
  } catch (err: any) {
    console.error('[/api/gemini/audio] Full Error:', err);
    return NextResponse.json({ 
      error: err.message,
      details: err.response?.error || 'TTS Synthesis Failed'
    }, { status: 500 });
  }
}
