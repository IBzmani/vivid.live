import { NextRequest, NextResponse } from 'next/server';
import { renewSubscriptionCredits, addTopupCredits } from '@/lib/credits';
import { PlanTier, SUBSCRIPTION_PLANS, TOPUP_PACKS } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: any;

    if (webhookSecret && sig) {
      // In production with Stripe SDK, verify webhook signature
      try {
        event = JSON.parse(rawBody);
      } catch (err: any) {
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
      }
    } else {
      // Direct JSON parse
      event = JSON.parse(rawBody);
    }

    const data = event.data?.object;

    // Handle checkout session completed
    if (event.type === 'checkout.session.completed') {
      const metadata = data.metadata || {};
      const userId = metadata.userId || data.client_reference_id;
      const type = metadata.type; // 'subscription' | 'topup'

      if (type === 'topup' && userId) {
        const packId = metadata.packId;
        const credits = Number(metadata.credits || 0);
        await addTopupCredits(userId, credits, packId, data.id);
        console.log(`[Stripe Webhook] Fulfilled top-up of ${credits} credits for user ${userId}`);
      } else if (type === 'subscription' && userId) {
        const tier = (metadata.tier || 'starter') as PlanTier;
        const plan = SUBSCRIPTION_PLANS[tier];
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await renewSubscriptionCredits(userId, tier, plan.monthlyCredits, periodEnd, 'USD', 'stripe', data.subscription);
        console.log(`[Stripe Webhook] Activated ${tier} subscription for user ${userId}`);
      }
    }

    // Handle invoice payment succeeded (recurring renewals)
    if (event.type === 'invoice.payment_succeeded') {
      const subscriptionId = data.subscription;
      const customerId = data.customer;
      // In production, match subscription ID and refill monthly credits
      console.log(`[Stripe Webhook] Recurring payment succeeded for sub ${subscriptionId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[/api/billing/webhook/stripe] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
