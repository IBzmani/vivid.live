import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { renewSubscriptionCredits, addTopupCredits } from '@/lib/credits';
import { PlanTier, SUBSCRIPTION_PLANS } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const paystackSignature = req.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_SECRET_KEY;

    // Verify Paystack HMAC SHA512 signature if secret is configured
    if (secret && paystackSignature) {
      const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
      if (hash !== paystackSignature) {
        return NextResponse.json({ error: 'Invalid Paystack signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const data = event.data;

    // Handle successful charge
    if (event.event === 'charge.success') {
      const metadata = data.metadata || {};
      const userId = metadata.userId;
      const type = metadata.type; // 'topup' | 'subscription'

      if (type === 'topup' && userId) {
        const packId = metadata.packId;
        const credits = Number(metadata.credits || 0);
        await addTopupCredits(userId, credits, packId, data.reference);
        console.log(`[Paystack Webhook] Fulfilled top-up of ${credits} credits for user ${userId}`);
      } else if (type === 'subscription' && userId) {
        const tier = (metadata.tier || 'starter') as PlanTier;
        const plan = SUBSCRIPTION_PLANS[tier];
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await renewSubscriptionCredits(userId, tier, plan.monthlyCredits, periodEnd, 'NGN', 'paystack', data.reference);
        console.log(`[Paystack Webhook] Activated ${tier} subscription in NGN for user ${userId}`);
      }
    }

    // Handle recurring subscription renewal
    if (event.event === 'subscription.create' || event.event === 'invoice.create') {
      console.log(`[Paystack Webhook] Subscription event: ${event.event}`, data);
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('[/api/billing/webhook/paystack] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
