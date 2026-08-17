/**
 * @file lib/credits.ts
 * @description Production-grade Atomic Credit Ledger for Vivid.
 * Handles subscription credit expiration, top-up credit rollover,
 * real-time deduction precedence, and audit logging in Firestore.
 */

import { doc, getDoc, setDoc, updateDoc, runTransaction, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { PlanTier, Currency, FREE_TIER_SIGNUP_CREDITS, SUBSCRIPTION_PLANS, ACTION_COSTS } from './plans';

export interface UserCreditProfile {
  userId: string;
  email?: string;
  tier: PlanTier;
  subscriptionCredits: number;  // Resets each billing cycle (expires)
  topupCredits: number;         // Purchased packs: Rolls over indefinitely (never expires)
  freeCredits: number;          // One-time signup bonus
  totalCredits: number;         // Computed sum
  billingCycleEnd: string | null;
  status: 'active' | 'paused' | 'canceled' | 'past_due';
  currency: Currency;
  paymentGateway?: 'stripe' | 'paystack';
  subscriptionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditAuditLog {
  id?: string;
  userId: string;
  type: 'deduction' | 'refill_subscription' | 'refill_topup' | 'welcome_bonus' | 'pause_vault';
  amount: number;
  action: string;
  previousBalance: number;
  newBalance: number;
  breakdown: {
    subscriptionDeducted: number;
    freeDeducted: number;
    topupDeducted: number;
  };
  metadata?: Record<string, any>;
  createdAt: string;
}

/**
 * Retrieves or initializes a user's credit profile in Firestore.
 */
export async function getUserCreditProfile(userId: string, email?: string): Promise<UserCreditProfile> {
  if (!userId) {
    throw new Error("Cannot get credit profile without userId");
  }

  const userDocRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const subCredits = Number(data.subscriptionCredits ?? 0);
    const topupCredits = Number(data.topupCredits ?? 0);
    const freeCredits = Number(data.freeCredits ?? 0);

    return {
      userId,
      email: data.email || email,
      tier: (data.tier as PlanTier) || 'free',
      subscriptionCredits: subCredits,
      topupCredits: topupCredits,
      freeCredits: freeCredits,
      totalCredits: subCredits + topupCredits + freeCredits,
      billingCycleEnd: data.billingCycleEnd || null,
      status: data.status || 'active',
      currency: (data.currency as Currency) || 'USD',
      paymentGateway: data.paymentGateway,
      subscriptionId: data.subscriptionId,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  }

  // Create new profile with one-time 30 free credits
  const initialProfile: UserCreditProfile = {
    userId,
    email: email || '',
    tier: 'free',
    subscriptionCredits: 0,
    topupCredits: 0,
    freeCredits: FREE_TIER_SIGNUP_CREDITS,
    totalCredits: FREE_TIER_SIGNUP_CREDITS,
    billingCycleEnd: null,
    status: 'active',
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(userDocRef, initialProfile, { merge: true });
    
    // Log welcome bonus
    await addDoc(collection(db, 'users', userId, 'credit_logs'), {
      userId,
      type: 'welcome_bonus',
      amount: FREE_TIER_SIGNUP_CREDITS,
      action: 'Welcome signup gift (Explorer Tier)',
      previousBalance: 0,
      newBalance: FREE_TIER_SIGNUP_CREDITS,
      breakdown: { subscriptionDeducted: 0, freeDeducted: 0, topupDeducted: 0 },
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Could not save initial profile to Firestore (may be offline / read-only):", err);
  }

  return initialProfile;
}

/**
 * Deducts credits atomically using Firestore transactions.
 * Precedence Rule: Deduct expiring subscription credits first -> free credits -> non-expiring top-up credits.
 */
export async function deductCredits(
  userId: string,
  amount: number,
  action: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; remainingBalance: number; error?: string }> {
  if (amount <= 0) return { success: true, remainingBalance: 0 };

  const userDocRef = doc(db, 'users', userId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists()) {
        throw new Error("User record not found");
      }

      const data = userDoc.data();
      let subCredits = Number(data.subscriptionCredits ?? 0);
      let freeCredits = Number(data.freeCredits ?? 0);
      let topupCredits = Number(data.topupCredits ?? 0);

      const totalAvailable = subCredits + freeCredits + topupCredits;
      if (totalAvailable < amount) {
        throw new Error(`INSUFFICIENT_CREDITS: Required ${amount} credits, available ${totalAvailable}`);
      }

      let remainingToDeduct = amount;
      let subDeducted = 0;
      let freeDeducted = 0;
      let topupDeducted = 0;

      // 1. Deduct from Subscription Credits (which expire on billing cycle)
      if (subCredits > 0) {
        subDeducted = Math.min(subCredits, remainingToDeduct);
        subCredits -= subDeducted;
        remainingToDeduct -= subDeducted;
      }

      // 2. Deduct from Free Credits
      if (remainingToDeduct > 0 && freeCredits > 0) {
        freeDeducted = Math.min(freeCredits, remainingToDeduct);
        freeCredits -= freeDeducted;
        remainingToDeduct -= freeDeducted;
      }

      // 3. Deduct from Top-up Credits (never expire)
      if (remainingToDeduct > 0 && topupCredits > 0) {
        topupDeducted = Math.min(topupCredits, remainingToDeduct);
        topupCredits -= topupDeducted;
        remainingToDeduct -= topupDeducted;
      }

      const newTotal = subCredits + freeCredits + topupCredits;

      transaction.update(userDocRef, {
        subscriptionCredits: subCredits,
        freeCredits: freeCredits,
        topupCredits: topupCredits,
        updatedAt: new Date().toISOString()
      });

      return {
        previousBalance: totalAvailable,
        newBalance: newTotal,
        breakdown: {
          subscriptionDeducted: subDeducted,
          freeDeducted: freeDeducted,
          topupDeducted: topupDeducted,
        }
      };
    });

    // Write audit log (fire-and-forget)
    addDoc(collection(db, 'users', userId, 'credit_logs'), {
      userId,
      type: 'deduction',
      amount: -amount,
      action,
      previousBalance: result.previousBalance,
      newBalance: result.newBalance,
      breakdown: result.breakdown,
      metadata: metadata || {},
      createdAt: new Date().toISOString()
    }).catch(err => console.error("Credit log write failed:", err));

    return { success: true, remainingBalance: result.newBalance };
  } catch (err: any) {
    console.error(`[Credits] Failed to deduct ${amount} credits for user ${userId}:`, err);
    return { 
      success: false, 
      remainingBalance: 0, 
      error: err.message?.includes('INSUFFICIENT_CREDITS') ? 'INSUFFICIENT_CREDITS' : err.message 
    };
  }
}

/**
 * Adds Top-up Pack credits (non-expiring rollover).
 */
export async function addTopupCredits(
  userId: string,
  creditsToAdd: number,
  packId: string,
  txReference: string
): Promise<UserCreditProfile> {
  const userDocRef = doc(db, 'users', userId);

  await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) {
      throw new Error("User record not found");
    }

    const data = userDoc.data();
    const currentTopup = Number(data.topupCredits ?? 0);
    const newTopup = currentTopup + creditsToAdd;

    transaction.update(userDocRef, {
      topupCredits: newTopup,
      updatedAt: new Date().toISOString()
    });
  });

  // Log refill
  await addDoc(collection(db, 'users', userId, 'credit_logs'), {
    userId,
    type: 'refill_topup',
    amount: creditsToAdd,
    action: `Purchased Top-Up Pack (${packId})`,
    metadata: { packId, txReference },
    createdAt: new Date().toISOString()
  });

  return getUserCreditProfile(userId);
}

/**
 * Subscription Renewal Handler (Stripe / Paystack Webhook).
 * Resets subscription credits to tier allowance, preserves all topup credits (Rollover Rule!).
 */
export async function renewSubscriptionCredits(
  userId: string,
  tier: PlanTier,
  monthlyCredits: number,
  billingCycleEnd: string,
  currency: Currency,
  gateway: 'stripe' | 'paystack',
  subscriptionId?: string
): Promise<UserCreditProfile> {
  const userDocRef = doc(db, 'users', userId);

  await updateDoc(userDocRef, {
    tier,
    subscriptionCredits: monthlyCredits,
    billingCycleEnd,
    status: 'active',
    currency,
    paymentGateway: gateway,
    subscriptionId: subscriptionId || null,
    updatedAt: new Date().toISOString()
  });

  // Log subscription refill
  await addDoc(collection(db, 'users', userId, 'credit_logs'), {
    userId,
    type: 'refill_subscription',
    amount: monthlyCredits,
    action: `Monthly Subscription Refill (${tier.toUpperCase()} Plan)`,
    metadata: { tier, billingCycleEnd, gateway, subscriptionId },
    createdAt: new Date().toISOString()
  });

  return getUserCreditProfile(userId);
}

/**
 * Downgrades/Pauses user to the $4.99 "Project Vault" plan to prevent churn.
 */
export async function pauseToProjectVault(userId: string, subscriptionId?: string): Promise<UserCreditProfile> {
  const userDocRef = doc(db, 'users', userId);
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await updateDoc(userDocRef, {
    tier: 'vault',
    subscriptionCredits: 50,
    billingCycleEnd: nextMonth,
    status: 'paused',
    updatedAt: new Date().toISOString()
  });

  await addDoc(collection(db, 'users', userId, 'credit_logs'), {
    userId,
    type: 'pause_vault',
    amount: 50,
    action: 'Paused to Project Vault ($4.99/mo) — Preserving character turnarounds & credits',
    metadata: { subscriptionId },
    createdAt: new Date().toISOString()
  });

  return getUserCreditProfile(userId);
}
