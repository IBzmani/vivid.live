import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { archetype, tone, noiseCancellation, userId } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await setDoc(doc(db, 'users', userId, 'settings', 'agent'), {
      archetype,
      tone,
      noiseCancellation,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save agent settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
