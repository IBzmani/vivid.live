import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';
import { uploadBase64ToGCS } from '@/lib/gcs';

const ai = new GoogleGenAI({
  vertexai: true,
  project: 'vivid-488415',
  location: 'us-central1',
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
  throw new Error('TTS retry limit exceeded');
}

const VOICE_MAPPING: Record<string, string> = {
  Puck: 'Puck',
  Charon: 'Charon',
  Kore: 'Kore',
  Fenrir: 'Fenrir',
  Zephyr: 'Zephyr',
};

export async function POST(req: NextRequest) {
  try {
    const { dialogueText, speakerName, voice, genre, language } = await req.json();

    if (!dialogueText) {
      return NextResponse.json({ error: 'dialogueText is required' }, { status: 400 });
    }

    const selectedVoice = VOICE_MAPPING[voice] || 'Charon';

    const prompt = `Perform the dialogue for character ${speakerName || 'Character'} in a ${genre || 'Cinematic'} film style:
"${dialogueText}"
Language: ${language || 'English'}. Deliver with natural emotional cadence. Do not output metadata or background commentary.`.trim();

    const rawBase64Audio = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: selectedVoice,
              },
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      return part?.inlineData?.data || null;
    });

    if (!rawBase64Audio) {
      throw new Error('No audio data generated');
    }

    const fileName = `audio/dialogue-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
    const publicAudioUrl = await uploadBase64ToGCS(rawBase64Audio, fileName);

    return NextResponse.json({
      audioUrl: publicAudioUrl,
      audioData: `data:audio/mp3;base64,${rawBase64Audio}`,
    });
  } catch (err: any) {
    console.error('[/api/audio/dialogue] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
