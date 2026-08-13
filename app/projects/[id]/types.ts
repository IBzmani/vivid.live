export type Genre = 'Drama' | 'Comedy' | 'Horror' | 'Action' | 'Sci-Fi' | 'Noir';
export type VisualStyle = 'Cinematic' | 'Anime' | 'Comic Book' | 'Watercolor' | '3D Render';
export type CameraMotion = 'Static' | 'Pan Left' | 'Pan Right' | 'Zoom In' | 'Zoom Out' | 'Tilt Up' | 'Tilt Down' | 'Dolly In';
export type ShotAngle = 'Wide Shot' | 'Medium Shot' | 'Close Up' | 'Over The Shoulder' | 'Extreme Close Up' | 'Low Angle' | 'High Angle';

export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  image: string;
  angles?: {
    front?: string;
    profile?: string;
    action?: string;
  };
}

export interface Environment {
  id: string;
  name: string;
  mood: string;
  colors: string[];
  image: string;
  masterPlate?: string;
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
  isGeneratingVideo?: boolean;
  audioData?: string;
  videoUrl?: string;
  characterId?: string;
  environmentId?: string;
  shotType?: string;
  shotAngle?: ShotAngle;
  cameraMotion?: CameraMotion;
  dialogueSpeaker?: string;
  dialogueText?: string;
  directorsBrief?: {
    emotionalArc: string;
    lightingScheme: string;
    cameraLogic: string;
    pacing: string;
  };
}

export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export interface SceneState {
  title: string;
  location: string;
  script: string;
  genre: Genre;
  visualStyle: VisualStyle;
  voice: VoiceName;
  language: string;
  playbackRate: number;
  manifest: VisualManifest;
  frames: Frame[];
  sentimentData: number[];
}

