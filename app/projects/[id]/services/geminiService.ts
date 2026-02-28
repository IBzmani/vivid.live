import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VisualManifest, Genre } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

export const analyzeManuscriptDeep = async (text: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this script and extract key characters and environments. Return JSON.
    Script: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          characters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          environments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                mood: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const generateSceneWithBrief = async (script: string, manifest: VisualManifest, genre: Genre) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on this script and manifest, generate a sequence of storyboard frames. Return JSON.
    Genre: ${genre}
    Script: ${script}
    Manifest: ${JSON.stringify(manifest)}`,
    config: {
      responseMimeType: "application/json",
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
                    cameraLogic: { type: Type.STRING },
                    pacing: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const generateNanoBananaImage = async (
  prompt: string, 
  manifest: VisualManifest, 
  context: { charId?: string, envId?: string, shotType?: string, emotion?: string },
  baseImage?: string,
  coord?: { x: number, y: number }
) => {
  const char = manifest.characters.find(c => c.id === context.charId);
  const env = manifest.environments.find(e => e.id === context.envId);
  
  const fullPrompt = `Cinematic storyboard frame: ${prompt}. 
  Character: ${char?.name} (${char?.description}). 
  Environment: ${env?.name} (${env?.mood}). 
  Shot Type: ${context.shotType}. 
  Emotion: ${context.emotion}. 
  Style: High-end cinematic production, detailed textures, professional lighting.`;

  const contents: any = {
    parts: [{ text: fullPrompt }]
  };

  if (baseImage) {
    contents.parts.push({
      inlineData: {
        mimeType: "image/png",
        data: baseImage.split(',')[1]
      }
    });
    if (coord) {
      contents.parts[0].text += ` Focus edit on coordinates [${coord.x}, ${coord.y}].`;
    }
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents,
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateEmotionalAudio = async (text: string, emotion: string, genre: string) => {
  const prompt = `Say ${emotion}ly in a ${genre} style: ${text}`;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
};

export const generateBibleAsset = async (name: string, description: string, type: 'character' | 'environment') => {
  const prompt = `Cinematic concept art for a ${type} named ${name}. Description: ${description}. High quality, detailed, professional concept art.`;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: type === 'character' ? "1:1" : "16:9"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
