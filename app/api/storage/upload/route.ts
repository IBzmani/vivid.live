import { NextResponse } from 'next/server';
import { uploadBase64ToGCS } from '@/lib/gcs';

export async function POST(req: Request) {
  try {
    const { base64, fileName } = await req.json();

    if (!base64) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    // Use a unique name to prevent overwriting
    const uniqueName = `${crypto.randomUUID()}-${fileName}`;
    
    // This calls your existing GCS logic
    const publicUrl = await uploadBase64ToGCS(base64, `uploads/${uniqueName}`);

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error('[Storage API] Upload failed:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
