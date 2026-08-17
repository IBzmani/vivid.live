import { NextRequest, NextResponse } from 'next/server';
import { getUserCreditProfile } from '@/lib/credits';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email') || undefined;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const profile = await getUserCreditProfile(userId, email);
    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('[/api/credits/balance] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
