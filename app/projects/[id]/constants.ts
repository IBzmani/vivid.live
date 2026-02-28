import { SceneState } from './types';

export const INITIAL_SCENE: SceneState = {
  title: "The Neon Silence",
  location: "Lower Sector 7 - Rain-slicked Alleyway",
  script: "EXT. ALLEYWAY - NIGHT\n\nThe rain falls in heavy, rhythmic sheets. Kael stands in the shadows, his cybernetic eye pulsing a faint crimson. He's waiting for the contact.\n\nA hover-cab splashes through a puddle nearby. The neon signs flicker, casting long, distorted shadows across the wet pavement.",
  genre: "Sci-Fi",
  manifest: {
    characters: [
      {
        id: "c1",
        name: "Kael",
        role: "Protagonist",
        description: "A weary tech-noir detective with a glowing cybernetic eye.",
        image: "https://picsum.photos/seed/kael/400/400"
      }
    ],
    environments: [
      {
        id: "e1",
        name: "Rainy Alley",
        mood: "Dystopian",
        colors: ["#0a0a12", "#1a1a2e"],
        image: "https://picsum.photos/seed/alley/800/450"
      }
    ]
  },
  frames: [
    {
      id: "f1",
      title: "Shot 01",
      timeRange: "00:00 - 00:05",
      image: "https://picsum.photos/seed/shot1/1280/720",
      prompt: "Wide shot of a rain-slicked neon alleyway at night, dystopian atmosphere.",
      scriptSegment: "EXT. ALLEYWAY - NIGHT. The rain falls in heavy, rhythmic sheets.",
      directorsBrief: {
        emotionalArc: "Melancholy",
        lightingScheme: "Neon Noir",
        cameraLogic: "Static Wide",
        pacing: "Slow"
      }
    }
  ],
  sentimentData: [2, 6, 8, 4, 10, 5, 12, 6, 8, 4, 3, 7, 5, 9, 2, 6, 4, 8, 3, 5, 7, 9, 4, 2]
};
