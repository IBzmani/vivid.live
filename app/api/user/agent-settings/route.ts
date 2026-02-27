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

    // Extract userId from token (format: token_ID)
    const userId = authToken.startsWith('token_') ? authToken.replace('token_', '') : authToken; 

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
