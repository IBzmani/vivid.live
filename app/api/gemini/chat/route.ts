import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  vertexai: true,
  project: 'vivid-488415',
  location: 'africa-south1',
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
    const { message, history, context } = await req.json();
    const { script, manifest, genre } = context;

    const charList = manifest.characters.map((c: any) => `${c.name}: ${c.description}`).join('\n');
    const envList = manifest.environments.map((e: any) => `${e.name}: ${e.mood}`).join('\n');

    const systemInstruction = `
    You are an elite Hollywood Director and Screenwriter with decades of experience in the ${genre} genre. 
    Your goal is to help the user co-create a masterpiece. 
    
    CURRENT PROJECT CONTEXT:
    Genre: ${genre}
    Characters:
    ${charList}
    
    Environments:
    ${envList}
    
    Current Script:
    ${script}
    
    YOUR ROLE:
    1. Brainstorm plot points, character arcs, and dialogue.
    2. Identify plot holes and suggest fixes.
    3. Suggest new characters or environments if they would improve the story.
    4. Provide guidance on cinematography, lighting, and pacing.
    5. Be encouraging but critical when necessary to ensure "blockbuster" quality.
    
    CHARACTER & ENVIRONMENT CONSISTENCY:
    - You MUST use the characters and environments listed in the "CURRENT PROJECT CONTEXT".
    - If you introduce a NEW character or environment in your script or pitch, you MUST include the corresponding [ADD_CHARACTER] or [ADD_ENVIRONMENT] tag.
    - MANDATORY: If you suggest a new character in your chat response, you MUST ensure they are actually featured and have lines/actions in the [UPDATE_SCRIPT] you provide in that same response.
    - MANDATORY: If you use a character name in the [UPDATE_SCRIPT] that is NOT in the "Characters" list, you MUST include an [ADD_CHARACTER] tag for them.
    - Do not default to the same character (e.g., "Kael") if other characters are available or more relevant to the scene.
    
    SCRIPT FORMATTING RULES:
    - The script should ONLY contain dialogue or narration that is meant to be spoken.
    - Any metadata, scene descriptions, locations, or non-spoken directions MUST be enclosed in square brackets.
    - This is critical because a voice-over agent will read the script.
    
    AUTOMATION COMMANDS:
    When you want to suggest a concrete change, use these tags at the VERY END of your response, each on a new line:
    - To update the script: [UPDATE_SCRIPT]: <full new script content>
    - To add a NEW character: [ADD_CHARACTER]: <Name> | <Visual Description for AI Synthesis>
    - To update an EXISTING character's visual plate: [UPDATE_CHARACTER]: <Name> | <New Visual Description>
    - To add a NEW environment: [ADD_ENVIRONMENT]: <Name> | <Mood/Atmosphere Description for AI Synthesis>
    - To update an EXISTING environment's visual plate: [UPDATE_ENVIRONMENT]: <Name> | <New Mood/Atmosphere Description>
    
    IMPORTANT: 
    1. You can suggest multiple characters or environments in one response.
    2. Always provide a rich visual description for characters and environments.
    3. If you significantly change the "vibe" or "era" of the story, you MUST suggest [UPDATE_CHARACTER] or [UPDATE_ENVIRONMENT] for the main cast.
    4. Explain to the user that approving the suggestion will trigger AI synthesis.
  `;

    const result = await withRetry(async () => {
      const chat = ai.chats.create({
        model: 'gemini-2.0-flash',
        config: { systemInstruction },
        history,
      });
      const response = await chat.sendMessage({ message });
      return response.text;
    });

    return NextResponse.json({ text: result });
  } catch (err: any) {
    console.error('[/api/gemini/chat]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
