import { NextResponse } from 'next/server';
import { saveAgentSettings } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { archetype, tone, noiseCancellation } = body;
    
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real app, we'd decode the token to get the userId.
    // For this mock, we'll use the token as the userId or a fixed identifier.
    const userId = authToken; 

    await saveAgentSettings(userId, {
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
