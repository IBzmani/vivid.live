import { Frame } from "../types";

export const exportCinemaMovie = async (frames: Frame[], onProgress: (p: number) => void): Promise<string> => {
  // Simulate a long export process
  for (let i = 0; i <= 100; i += 5) {
    onProgress(i);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Return a dummy video URL or just one of the frame images as a "result"
  // In a real app, this would call a backend to stitch images into a video
  return frames[0]?.image || "https://picsum.photos/seed/export/1280/720";
};
