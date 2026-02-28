export type Genre = 'Drama' | 'Comedy' | 'Horror' | 'Action' | 'Sci-Fi' | 'Noir';

export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  image: string;
}

export interface Environment {
  id: string;
  name: string;
  mood: string;
  colors: string[];
  image: string;
}

export interface VisualManifest {
  characters: Character[];
  environments: Environment[];
}

export interface Frame {
  id: string;
  title: string;
  timeRange: string;
  image: string;
  prompt: string;
  scriptSegment: string;
  isGenerating?: boolean;
  isGeneratingAudio?: boolean;
  audioData?: string;
  characterId?: string;
  environmentId?: string;
  shotType?: string;
  directorsBrief?: {
    emotionalArc: string;
    lightingScheme: string;
    cameraLogic: string;
    pacing: string;
  };
}

export interface SceneState {
  title: string;
  location: string;
  script: string;
  genre: Genre;
  manifest: VisualManifest;
  frames: Frame[];
  sentimentData: number[];
}
