import { NextResponse } from 'next/server';
import { getAgentSettings } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authToken.startsWith('token_') ? authToken.replace('token_', '') : authToken;
    const settings = await getAgentSettings(userId);
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
