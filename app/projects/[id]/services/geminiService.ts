import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VisualManifest, Genre } from "../types";

/**
 * Robust retry wrapper with exponential backoff to handle 429 (Rate Limit) errors.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.status === 429;
      if (isRateLimit && i < maxRetries - 1) {
        console.warn(`Rate limit hit (429). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 500));
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
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    const match = text?.match(/\{[\s\S]*\}/);
    if (match) {
        try {
            return JSON.parse(match[0]);
        } catch (innerE) {
            console.error("Failed to parse JSON even with regex match", innerE);
            return {};
        }
    }
    return {};
  }
}

async function toBase64(url: string): Promise<{ data: string, mimeType: string }> {
  if (url.startsWith('data:')) {
    const [header, data] = url.split(',');
    const mimeType = header.split(':')[1].split(';')[0];
    return { data, mimeType };
  }
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ data: (reader.result as string).split(',')[1], mimeType: blob.type });
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Failed to convert URL to base64", err);
    return { data: "", mimeType: "image/png" };
  }
}

const STYLE_GUIDE = "Aesthetic: High-fidelity cinematic concept art. Professional cinematography, realistic volumetric lighting, deep shadows, sharp digital painting. 8k resolution look.";

export const generateBibleAsset = async (name: string, description: string, type: 'character' | 'environment') => {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
  const prompt = type === 'character' 
    ? `MASTER CHARACTER PLATE: ${name}. ${description}. Detailed character concept art, neutral background, cinematic design, ${STYLE_GUIDE}` 
    : `WORLD BUILDING PLATE: ${name}. ${description}. Establishing shot showing architecture, textures, and lighting mood for this location. ${STYLE_GUIDE}`;

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
  });
};

export const analyzeManuscriptDeep = async (manuscript: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview', // Upgraded to Pro for larger context window
      contents: `Extract visual entities for a production bible.
      Script: ${manuscript}`,
      config: {
        responseMimeType: "application/json",
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
};

export const generateSceneWithBrief = async (script: string, manifest: VisualManifest, genre: Genre) => {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
  // We avoid stringifying the whole manifest to prevent token overflow (images are large)
  const charList = manifest.characters.map(c => `${c.name} (ID: ${c.id})`).join(', ');
  const envList = manifest.environments.map(e => `${e.name} (ID: ${e.id})`).join(', ');

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview', // Upgraded to Pro for larger context window and better reasoning
      contents: `As a Film Director specialized in ${genre} cinema, partition the ENTIRE provided script into a sequence of storyboard frames. 
      
      RULES:
      1. Use the Bible entities: Characters: ${charList}. Locations: ${envList}.
      2. The "scriptSegment" for each frame MUST be the actual original text.
      3. Use intense EMOTIONAL PERFORMANCE TAGS suited for the ${genre} genre (e.g., if Comedy: [deadpan sarcasm], if Horror: [terrified stuttering]).
      
      Genre: ${genre}
      Script: ${script}`,
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
};

export const generateNanoBananaImage = async (
  prompt: string, 
  manifest: VisualManifest, 
  references: { charId?: string, envId?: string, shotType?: string, emotion?: string } = {},
  baseImage?: string,
  clickCoord?: { x: number, y: number }
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
  const parts: any[] = [];
  
  if (references.charId) {
    const char = manifest.characters.find(c => c.id === references.charId);
    if (char?.image && !char.image.startsWith('loading://')) {
      const b64 = await toBase64(char.image);
      if (b64.data) {
        parts.push({ inlineData: { mimeType: b64.mimeType, data: b64.data } });
        parts.push({ text: `CHARACTER IDENTITY: This is ${char.name}.` });
      }
    }
  }
  
  if (references.envId) {
    const env = manifest.environments.find(e => e.id === references.envId);
    if (env?.image && !env.image.startsWith('loading://')) {
      const b64 = await toBase64(env.image);
      if (b64.data) {
        parts.push({ inlineData: { mimeType: b64.mimeType, data: b64.data } });
        parts.push({ text: `VISUAL DNA: Architecture and lighting from this world.` });
      }
    }
  }
  
  if (baseImage) {
    const b64 = await toBase64(baseImage);
    if (b64.data) {
      parts.push({ inlineData: { mimeType: b64.mimeType, data: b64.data } });
      if (clickCoord) parts.push({ text: `LOCAL EDIT at [x:${clickCoord.x}, y:${clickCoord.y}]: ${prompt}` });
    }
  }
  
  parts.push({ text: `CINEMATIC STORYBOARD: ${references.shotType || ''} showing ${prompt}. EMOTION: ${references.emotion || 'Intense'}. ${STYLE_GUIDE}` });
  
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const imgPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return imgPart?.inlineData ? `data:image/png;base64,${imgPart.inlineData.data}` : null;
  });
};

export const generateEmotionalAudio = async (text: string, brief: string, genre: Genre) => {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
  
  const isDialogue = /[:"].*?"/g.test(text) || text.includes('"') || text.includes("'");
  
  // Dynamic Voice selection based on Genre
  let voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Charon';
  let genreContext = "";

  switch (genre) {
    case 'Comedy':
      voiceName = 'Puck'; 
      genreContext = "with perfect comedic timing, high energy, and sharp wit.";
      break;
    case 'Horror':
      voiceName = 'Fenrir';
      genreContext = "with a deep, ominous, and terrifying atmosphere. Every pause should be heavy with dread.";
      break;
    case 'Action':
      voiceName = 'Fenrir';
      genreContext = "with high intensity, grit, and aggressive pacing.";
      break;
    case 'Drama':
    case 'Noir':
      voiceName = isDialogue ? 'Kore' : 'Charon';
      genreContext = "with deep emotional resonance and cinematic gravitas.";
      break;
    case 'Sci-Fi':
      voiceName = 'Zephyr';
      genreContext = "with a precise, slightly detached, and futuristic authority.";
      break;
  }

  const performancePrompt = `
    INSTRUCTION: Perform the following script ${genreContext}. 
    The script contains bracketed emotional cues [like this]. 
    STRICT RULE: DO NOT SPEAK THE BRACKETED TEXT ALOUD. Use it ONLY to guide your vocal delivery.
    PERSONA: ${isDialogue ? 'Master Character Actor' : 'Cinematic Narrator'}.
    
    SCRIPT: 
    ${text}
  `.trim();

  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: performancePrompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            voiceConfig: { 
              prebuiltVoiceConfig: { voiceName } 
            } 
          }
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (err) {
      console.error("Advanced TTS synthesis failed:", err);
      return null;
    }
  });
};

export const chatWithCoCreator = async (
  message: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  context: { script: string, manifest: VisualManifest, genre: Genre }
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
  
  const charList = context.manifest.characters.map(c => `${c.name}: ${c.description}`).join('\n');
  const envList = context.manifest.environments.map(e => `${e.name}: ${e.mood}`).join('\n');

  const systemInstruction = `
    You are an elite Hollywood Director and Screenwriter with decades of experience in the ${context.genre} genre. 
    Your goal is to help the user co-create a masterpiece. 
    
    CURRENT PROJECT CONTEXT:
    Genre: ${context.genre}
    Characters:
    ${charList}
    
    Environments:
    ${envList}
    
    Current Script:
    ${context.script}
    
    YOUR ROLE:
    1. Brainstorm plot points, character arcs, and dialogue.
    2. Identify plot holes and suggest fixes.
    3. Suggest new characters or environments if they would improve the story.
    4. Provide guidance on cinematography, lighting, and pacing.
    5. Be encouraging but critical when necessary to ensure "blockbuster" quality.
    
    AUTOMATION COMMANDS:
    When you want to suggest a concrete change, use these tags at the END of your response. 
    The user will see these as "Suggestions" they can Approve or Decline.
    - To update the script: [UPDATE_SCRIPT]: <full new script content>
    - To add a character: [ADD_CHARACTER]: <Name> | <Visual Description for AI Synthesis>
    - To add an environment: [ADD_ENVIRONMENT]: <Name> | <Mood/Atmosphere Description for AI Synthesis>
    
    IMPORTANT: When suggesting a character or environment, explain to the user that approving the suggestion will trigger AI synthesis to create a high-quality visual asset for their World Bible.
  `;

  return withRetry(async () => {
    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction,
      },
      history,
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  });
};
