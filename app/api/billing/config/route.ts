import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS, TOPUP_PACKS, ACTION_COSTS } from '@/lib/plans';
import { resolveGeoFromHeaders } from '@/lib/geo';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const geo = resolveGeoFromHeaders(req.headers);

    return NextResponse.json({
      geo,
      plans: SUBSCRIPTION_PLANS,
      topupPacks: TOPUP_PACKS,
      actionCosts: ACTION_COSTS,
      paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
      stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    });
  } catch (error: any) {
    console.error('[/api/billing/config] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
