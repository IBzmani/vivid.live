import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS, TOPUP_PACKS, PlanTier, Currency, BillingCycle } from '@/lib/plans';
import { addTopupCredits, renewSubscriptionCredits } from '@/lib/credits';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userId, 
      email, 
      mode, // 'subscription' | 'topup'
      planId, // PlanTier
      packId, // string
      cycle = 'monthly', // 'monthly' | 'annual'
      currency = 'USD', // 'USD' | 'NGN'
      successUrl,
      cancelUrl
    } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: 'userId and email are required' }, { status: 400 });
    }

    const isNigeria = currency === 'NGN';
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const finalSuccessUrl = successUrl || `${origin}/dashboard?billing=success`;
    const finalCancelUrl = cancelUrl || `${origin}/dashboard?billing=cancel`;

    // -------------------------------------------------------------
    // CASE A: TOP-UP PACK PURCHASE (One-time)
    // -------------------------------------------------------------
    if (mode === 'topup') {
      const pack = TOPUP_PACKS.find(p => p.id === packId);
      if (!pack) {
        return NextResponse.json({ error: 'Invalid packId' }, { status: 400 });
      }

      const amount = isNigeria ? pack.price.NGN : pack.price.USD;
      const txRef = `vivid_topup_${userId}_${packId}_${Date.now()}`;

      // 1. Paystack for Nigeria (NGN)
      if (isNigeria) {
        const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
        if (PAYSTACK_SECRET_KEY) {
          const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              amount: amount * 100, // Paystack takes kobo (100 kobo = 1 NGN)
              reference: txRef,
              callback_url: `${finalSuccessUrl}&ref=${txRef}&pack=${packId}`,
              metadata: {
                userId,
                packId,
                credits: pack.credits,
                type: 'topup',
                currency: 'NGN'
              }
            })
          });

          const data = await response.json();
          if (data.status && data.data?.authorization_url) {
            return NextResponse.json({ url: data.data.authorization_url, reference: txRef });
          }
        }

        // Demo / Development instant fulfillment fallback if API key not configured
        await addTopupCredits(userId, pack.credits, pack.id, txRef);
        return NextResponse.json({ 
          url: `${finalSuccessUrl}&ref=${txRef}&demo=true`,
          demoFulfilled: true,
          message: `Demo Mode: Added ${pack.credits} top-up credits to your account.`
        });
      }

      // 2. Stripe for International (USD)
      const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
      if (STRIPE_SECRET_KEY) {
        // Stripe checkout session creation
        const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'success_url': `${finalSuccessUrl}&session_id={CHECKOUT_SESSION_ID}`,
            'cancel_url': finalCancelUrl,
            'payment_method_types[0]': 'card',
            'mode': 'payment',
            'customer_email': email,
            'client_reference_id': userId,
            'line_items[0][price_data][currency]': 'usd',
            'line_items[0][price_data][product_data][name]': `Vivid ${pack.name} (${pack.credits} Credits)`,
            'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
            'line_items[0][quantity]': '1',
            'metadata[userId]': userId,
            'metadata[packId]': packId,
            'metadata[credits]': String(pack.credits),
            'metadata[type]': 'topup'
          }).toString()
        });

        const stripeData = await stripeRes.json();
        if (stripeData.url) {
          return NextResponse.json({ url: stripeData.url, id: stripeData.id });
        }
      }

      // Demo fallback
      await addTopupCredits(userId, pack.credits, pack.id, txRef);
      return NextResponse.json({ 
        url: `${finalSuccessUrl}&ref=${txRef}&demo=true`,
        demoFulfilled: true,
        message: `Demo Mode: Added ${pack.credits} top-up credits.`
      });
    }

    // -------------------------------------------------------------
    // CASE B: SUBSCRIPTION PLAN (Starter / Pro / Studio / Vault)
    // -------------------------------------------------------------
    const plan = SUBSCRIPTION_PLANS[planId as PlanTier];
    if (!plan || plan.id === 'free') {
      return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 });
    }

    const priceInfo = isNigeria ? plan.price.NGN : plan.price.USD;
    const priceAmount = cycle === 'annual' ? priceInfo.annualTotal : priceInfo.monthly;
    const subRef = `vivid_sub_${userId}_${planId}_${Date.now()}`;

    // 1. Paystack Recurring Subscription for Nigeria (NGN)
    if (isNigeria) {
      const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
      if (PAYSTACK_SECRET_KEY) {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            amount: priceAmount * 100, // in kobo
            reference: subRef,
            callback_url: `${finalSuccessUrl}&ref=${subRef}&tier=${planId}`,
            metadata: {
              userId,
              tier: planId,
              monthlyCredits: plan.monthlyCredits,
              cycle,
              type: 'subscription',
              currency: 'NGN'
            }
          })
        });

        const data = await response.json();
        if (data.status && data.data?.authorization_url) {
          return NextResponse.json({ url: data.data.authorization_url, reference: subRef });
        }
      }

      // Demo instant subscription activation
      const periodEnd = new Date(Date.now() + (cycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();
      await renewSubscriptionCredits(userId, planId as PlanTier, plan.monthlyCredits, periodEnd, 'NGN', 'paystack', subRef);
      return NextResponse.json({ 
        url: `${finalSuccessUrl}&ref=${subRef}&demo=true`,
        demoFulfilled: true,
        message: `Demo Mode: Upgraded to ${plan.name} (${plan.monthlyCredits} credits/mo).`
      });
    }

    // 2. Stripe Recurring Subscription for International (USD)
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    if (STRIPE_SECRET_KEY) {
      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'success_url': `${finalSuccessUrl}&session_id={CHECKOUT_SESSION_ID}`,
          'cancel_url': finalCancelUrl,
          'payment_method_types[0]': 'card',
          'mode': 'subscription',
          'customer_email': email,
          'client_reference_id': userId,
          'line_items[0][price_data][currency]': 'usd',
          'line_items[0][price_data][recurring][interval]': cycle === 'annual' ? 'year' : 'month',
          'line_items[0][price_data][product_data][name]': `Vivid ${plan.name} Plan (${cycle === 'annual' ? 'Annual' : 'Monthly'})`,
          'line_items[0][price_data][unit_amount]': String(Math.round(priceAmount * 100)),
          'line_items[0][quantity]': '1',
          'metadata[userId]': userId,
          'metadata[tier]': planId,
          'metadata[monthlyCredits]': String(plan.monthlyCredits),
          'metadata[type]': 'subscription'
        }).toString()
      });

      const stripeData = await stripeRes.json();
      if (stripeData.url) {
        return NextResponse.json({ url: stripeData.url, id: stripeData.id });
      }
    }

    // Demo activation fallback
    const periodEnd = new Date(Date.now() + (cycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();
    await renewSubscriptionCredits(userId, planId as PlanTier, plan.monthlyCredits, periodEnd, 'USD', 'stripe', subRef);
    return NextResponse.json({ 
      url: `${finalSuccessUrl}&ref=${subRef}&demo=true`,
      demoFulfilled: true,
      message: `Demo Mode: Upgraded to ${plan.name} (${plan.monthlyCredits} credits/mo).`
    });

  } catch (error: any) {
    console.error('[/api/billing/checkout] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
