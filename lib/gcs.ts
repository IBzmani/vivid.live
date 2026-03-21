import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: 'vivid-488415',
});

const bucketName = 'vivid-assets-488415';

export async function uploadBase64ToGCS(base64Data: string, fileName: string): Promise<string> {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);

  // 1. Strip the header safely
  const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const buffer = Buffer.from(base64Content, 'base64');

  // 2. Save WITHOUT 'public: true'
  await file.save(buffer, {
    metadata: { 
      contentType: 'image/png',
      // Optional: cache control helps images load faster on repeat visits
      cacheControl: 'public, max-age=31536000',
    },
    resumable: false, // Better for small/medium images
  });

  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}