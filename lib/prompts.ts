/**
 * @file lib/prompts.ts
 * @description Central prompt engineering module for Vivid.
 *
 * Generates dynamic, genre-aware style guides for image generation.
 * This is the single source of truth for all visual style instructions
 * sent to our AI models (Gemini 3.1 Flash Image / Imagen 3).
 *
 * Adding a new style: add a case to STYLE_BASES and GENRE_STYLE_OVERLAYS.
 */

export type VisualStyle = 'Cinematic' | 'Anime' | 'Comic Book' | 'Watercolor' | '3D Render';
export type Genre = 'Drama' | 'Comedy' | 'Horror' | 'Action' | 'Sci-Fi' | 'Noir';

/**
 * Base visual descriptors for each style, genre-agnostic.
 * These define the core aesthetic "DNA" of the output.
 */
const STYLE_BASES: Record<VisualStyle, string> = {
  'Cinematic':
    'Aesthetic: High-fidelity cinematic concept art. Anamorphic lens, real-world proportions, ' +
    'photorealistic textures, professional volumetric lighting with deep shadows and film grain. ' +
    '8K resolution digital painting. Color graded, practical lighting, atmospheric depth of field.',

  'Anime':
    'Aesthetic: High-quality anime illustration. Crisp cel-shaded line art with bold ink outlines. ' +
    'Clean, vibrant colors with strong saturation blocks. Large expressive eyes, stylized hair with ' +
    'individual strand detail, smooth skin. Inspired by modern high-budget anime studios (e.g. MAPPA, Ufotable). ' +
    'Dramatic speed lines, dynamic posing, intentional flattened perspective.',

  'Comic Book':
    'Aesthetic: Western comic book art. Bold, crisp ink outlines with Ben-Day dot halftone shading. ' +
    'Strong primary colors and high contrast black shadows. Dynamic, energetic panel composition. ' +
    'Bold action lines and graphic design elements. Inspired by Marvel and DC house style art.',

  'Watercolor':
    'Aesthetic: Expressive watercolor illustration. Soft, translucent washes of color with visible ' +
    'paper texture and pigment blooms. Loose, gestural brushstrokes with ink line-art anchoring. ' +
    'Warm and organic color palette. Impressionistic, slightly dreamlike quality with soft edges ' +
    'bleeding into white space.',

  '3D Render':
    'Aesthetic: High-end 3D CGI render. Photorealistic 3D characters and environments rendered with ' +
    'ray-traced global illumination. Subsurface scattering on skin, physically-based materials. ' +
    'Inspired by Pixar and DreamWorks feature film quality. Clean, polished surfaces with cinematic depth of field.',
};

/**
 * Genre-specific modifiers that are applied on top of the base style.
 * The key is `${visualStyle}:${genre}`. If no specific combo exists,
 * falls back to the genre-only modifier.
 *
 * CRITICAL RULE FOR AI: These instructions modify EXPRESSION and ATMOSPHERE,
 * not the core visual style. A Cinematic Horror frame must still look cinematic,
 * just with horror atmosphere.
 */
const GENRE_STYLE_OVERLAYS: Partial<Record<string, string>> = {

  // --- ANIME GENRE OVERLAYS ---
  // Anime comedy is the most nuanced: requires specific manga comedy tropes.
  'Anime:Comedy':
    'GENRE MODIFIER — ANIME COMEDY: Apply exaggerated comedic expressions. Use chibi/super-deformed ' +
    'style for comedic moments. Include sweat drops (汗), pulsing veins of frustration, ' +
    'cross-pop eyes for anger/shock, dramatic tsukkomi (straight-man) reaction poses. ' +
    'Characters can have ridiculously oversized reactions: eyes popping out, jaws dropping to floor, ' +
    'steam from ears. Use speed lines for comedic rushes. Bright, saturated panel backgrounds. ' +
    'The art should feel like a high-energy shonen gag scene.',

  'Anime:Drama':
    'GENRE MODIFIER — ANIME DRAMA: Use detailed, emotionally raw character expressions informed by ' +
    'shojo and seinen drama conventions. Glistening eyes with visible light reflections and tears. ' +
    'Soft background bokeh with petals or light particles. Dramatic hair movement even in still scenes. ' +
    'Melancholic color toning — dusk palettes, desaturated blues. Stillness and weight in the composition.',

  'Anime:Horror':
    'GENRE MODIFIER — ANIME HORROR: Apply grotesque body horror aesthetics inspired by Junji Ito. ' +
    'Extreme contrast between cute/normal art and horrifying elements. Distorted, spiraling eyes. ' +
    'Monochromatic panic: drain saturation and push deep blacks. Unsettling anatomical distortion. ' +
    'Claustrophobic, angular compositions. Deeply unsettling, surreal imagery.',

  'Anime:Action':
    'GENRE MODIFIER — ANIME ACTION: High-octane shonen battle aesthetic. Extreme dynamic angles and ' +
    'foreshortening. Explosive energy effects (aura, ki, particle bursts). Multiple motion trails and ' +
    'afterimage effects. Torn clothing, battle damage. Intense, asymmetric composition for impact. ' +
    'Inspired by Naruto, Dragon Ball, My Hero Academia.',

  'Anime:Sci-Fi':
    'GENRE MODIFIER — ANIME SCI-FI: Mecha and cyberpunk anime aesthetic. Highly detailed mechanical ' +
    'design with panel lines and joint articulation. Holographic UI overlays. LED glow effects in ' +
    'neon blues, cyans, and purples. Cityscapes inspired by Ghost in the Shell and Akira. ' +
    'Both organic and mechanical elements coexisting with deliberate contrast.',

  'Anime:Noir':
    'GENRE MODIFIER — ANIME NOIR: Mature seinen aesthetic with Film Noir shadows. Fedoras and trench ' +
    'coats rendered in anime style. Rain-slicked streets in deep blue-black. Expressive, shadowed eyes ' +
    'with a world-weary quality. Half-shadow compositions hiding character faces. ' +
    'Cigarette smoke rendered as delicate stylized wisps.',

  // --- COMIC BOOK GENRE OVERLAYS ---
  'Comic Book:Comedy':
    'GENRE MODIFIER — COMIC COMEDY: Slapstick visual gags. Exaggerated cartoonish reactions with ' +
    'big stars replacing eyes, birds circling heads, and action sound effects rendered as bold typography ' +
    '(POW!, BONK!, SPLAT!). Looney Tunes-inspired elastic body physics. Bright, cheerful palette.',

  'Comic Book:Horror':
    'GENRE MODIFIER — COMIC HORROR: EC Comics horror aesthetic. Heavy cross-hatching, high-contrast ' +
    'black ink with sparse, sickly green or blood-red spot color. Grotesque, creeping imagery. ' +
    'Dramatic word balloons with jagged edges. Classic 1950s horror comic composition.',

  'Comic Book:Action':
    'GENRE MODIFIER — COMIC ACTION: Peak Marvel/DC superhero aesthetic. Full-page splash composition. ' +
    'Radial action lines emanating from the focal point. Power surge effects rendered as overlapping ' +
    'color blocks. Heroic, low-angle "worm\'s eye view" perspective to amplify scale.',

  'Comic Book:Sci-Fi':
    'GENRE MODIFIER — COMIC SCI-FI: Retro-futurism Silver Age sci-fi aesthetic. Sleek rocket ships, ' +
    'ray guns, and chrome robots alongside bold retrofuturistic typography. Primary color scheme with ' +
    'metallic highlights. Clean, optimistic composition inspired by 1960s sci-fi comics.',

  // --- CINEMATIC GENRE OVERLAYS ---
  'Cinematic:Comedy':
    'GENRE MODIFIER — CINEMATIC COMEDY: Warm, slightly overexposed lighting with a bright, sunny palette. ' +
    'Characters caught mid-exaggerated-expression. Natural, relatable composition — wide shots showing ' +
    'physical comedy context. Slight warm color grade, soft shadows.',

  'Cinematic:Horror':
    'GENRE MODIFIER — CINEMATIC HORROR: Extremely desaturated. Cold, sickly blues and greens. ' +
    'Near-black shadows with a single harsh practical light source. Negative space used to imply ' +
    'an unseen threat. Dutch angle to create unease. Shallow depth of field obscuring the background threat.',

  'Cinematic:Action':
    'GENRE MODIFIER — CINEMATIC ACTION: High-energy, unstable camera feel. Motion blur on fast elements. ' +
    'Warm, golden hour or harsh midday sun backlight for silhouette. Orange-and-teal color grade. ' +
    'Low-angle, close-to-the-ground camera. Environmental destruction in the background.',

  'Cinematic:Sci-Fi':
    'GENRE MODIFIER — CINEMATIC SCI-FI: Cold, desaturated blues and purples with sharp neon accents. ' +
    'Inspired by Blade Runner 2049 and Dune. Vast, awe-inspiring scale. Geometric architecture. ' +
    'Lens flares from artificial light sources. High-contrast, near future aesthetics.',

  'Cinematic:Drama':
    'GENRE MODIFIER — CINEMATIC DRAMA: Rembrandt lighting. Warm, intimate color palette. Close-up ' +
    'compositions capturing micro-expressions. Shallow depth of field. Golden hour or interior candlelight. ' +
    'Still, deliberate composition with emotional weight.',

  'Cinematic:Noir':
    'GENRE MODIFIER — CINEMATIC NOIR: Monochromatic or near-monochromatic with a single amber or ' +
    'neon color accent. Hard, raking side-light casting deep dramatic shadows. Venetian blind shadow ' +
    'patterns. Rain on windows. Cigarette smoke. Classic noir iconography rendered photorealistically.',

  // --- 3D RENDER GENRE OVERLAYS ---
  '3D Render:Comedy':
    'GENRE MODIFIER — 3D COMEDY: Pixar-style expressive character animation aesthetic. Over-the-top ' +
    'rubbery facial deformation for comedic expressions. Bright, saturated environments. Soft, ' +
    'diffused studio lighting. Characters with big, appealing shapes.',

  '3D Render:Horror':
    'GENRE MODIFIER — 3D HORROR: Hyper-detailed, uncanny valley aesthetic. Photorealistic skin with ' +
    'subtle wrongness. Cold, de-saturated lighting. Every surface rendered in extreme detail to make ' +
    'the horror feel real and tangible.',

  // --- WATERCOLOR GENRE OVERLAYS ---
  'Watercolor:Comedy':
    'GENRE MODIFIER — WATERCOLOR COMEDY: Playful, whimsical loose illustration. Bright, cheery washes. ' +
    'Characters with simple, funny proportions. Splashes of accidental pigment used as comedic effect.',

  'Watercolor:Horror':
    'GENRE MODIFIER — WATERCOLOR HORROR: Bleed the colors — let dark crimson and shadow-black pigments ' +
    'run and bloom into whites. The looseness of watercolor creates an unsettling, unstable image. ' +
    'Use negative space and unpainted white areas as the most frightening elements.',
};

/**
 * Primary export: Generates a complete style guide string for an AI prompt.
 *
 * @param visualStyle - The selected visual style (e.g., 'Anime')
 * @param genre - The selected genre (e.g., 'Comedy')
 * @returns A fully composed string of prompt instructions ready to be injected.
 */
export function getStyleGuide(visualStyle: VisualStyle | string, genre: Genre | string): string {
  const base = STYLE_BASES[visualStyle as VisualStyle] ?? STYLE_BASES['Cinematic'];
  const comboKey = `${visualStyle}:${genre}`;
  const overlay = GENRE_STYLE_OVERLAYS[comboKey] ?? '';
  return overlay ? `${base}\n\n${overlay}` : base;
}
