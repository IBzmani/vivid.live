import { NextRequest, NextResponse } from 'next/server';
import { pauseToProjectVault, getUserCreditProfile } from '@/lib/credits';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId, reason } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const currentProfile = await getUserCreditProfile(userId);
    const updatedProfile = await pauseToProjectVault(userId, currentProfile.subscriptionId || undefined);

    return NextResponse.json({
      success: true,
      message: 'Your account has been switched to Project Vault ($4.99/mo). Your character turnarounds, bibles, and top-up credits are preserved.',
      profile: updatedProfile
    });
  } catch (error: any) {
    console.error('[/api/billing/pause] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
