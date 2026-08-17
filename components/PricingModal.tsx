'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Check, Zap, Sparkles, Film, Video, ShieldCheck, 
  Coins, ArrowRight, Loader2, Globe, HeartHandshake, CheckCircle2 
} from 'lucide-react';
import { 
  SUBSCRIPTION_PLANS, 
  TOPUP_PACKS, 
  PlanTier, 
  Currency, 
  BillingCycle, 
  formatPrice 
} from '@/lib/plans';
import { detectClientCurrency } from '@/lib/geo';
import { useAuth } from '@/components/FirebaseProvider';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: PlanTier;
  initialTab?: 'plans' | 'topup';
  onSuccess?: () => void;
}

export default function PricingModal({
  isOpen,
  onClose,
  currentTier = 'free',
  initialTab = 'plans',
  onSuccess
}: PricingModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'plans' | 'topup'>(initialTab);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-detect geo currency on open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/billing/config')
        .then(res => res.json())
        .then(data => {
          if (data.geo?.currency) {
            setCurrency(data.geo.currency);
          }
        })
        .catch(() => {
          setCurrency(detectClientCurrency());
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckout = async (planId?: PlanTier, packId?: string) => {
    if (!user) {
      setErrorMessage("Please sign in to upgrade or top up credits.");
      return;
    }

    setLoadingPlan(planId || packId || 'loading');
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email || `${user.uid}@vivid.live`,
          mode: packId ? 'topup' : 'subscription',
          planId,
          packId,
          cycle,
          currency,
          successUrl: `${window.location.origin}/dashboard?billing=success`,
          cancelUrl: window.location.href,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate checkout');
      }

      if (data.demoFulfilled) {
        setSuccessMessage(data.message);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 2200);
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment initiation failed');
    } finally {
      setLoadingPlan(null);
    }
  };

  const plansList = [
    SUBSCRIPTION_PLANS.starter,
    SUBSCRIPTION_PLANS.pro,
    SUBSCRIPTION_PLANS.studio
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-obsidian border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <Film className="size-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Vivid Studio Plans & Credits
                </h2>
                <p className="text-xs text-slate-400">Unlock 1080p/4K master exports, character bibles, and AI video motion</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Currency Selector */}
              <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10 text-xs font-bold">
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-2.5 py-1 rounded-md transition-all ${currency === 'USD' ? 'bg-primary text-obsidian shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  USD ($)
                </button>
                <button
                  onClick={() => setCurrency('NGN')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${currency === 'NGN' ? 'bg-primary text-obsidian shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  <span>NGN (₦)</span>
                  <span className="text-[9px] opacity-75 font-mono">Paystack</span>
                </button>
              </div>

              <button 
                onClick={onClose}
                className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Feedback Banners */}
          {successMessage && (
            <div className="bg-emerald-500/20 border-b border-emerald-500/30 p-3 text-center text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="size-4" />
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-500/20 border-b border-red-500/30 p-3 text-center text-red-400 text-xs font-bold">
              {errorMessage}
            </div>
          )}

          {/* Tab Selector & Billing Cycle Toggle */}
          <div className="px-8 pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab('plans')}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'plans' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <Sparkles className="size-3.5 text-primary" />
                Subscription Plans
              </button>
              <button
                onClick={() => setActiveTab('topup')}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'topup' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <Coins className="size-3.5 text-amber-400" />
                Top-Up Credit Packs
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Rollover</span>
              </button>
            </div>

            {activeTab === 'plans' && (
              <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setCycle('monthly')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${cycle === 'monthly' ? 'bg-primary text-obsidian shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setCycle('annual')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${cycle === 'annual' ? 'bg-primary text-obsidian shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  <span>Annual</span>
                  <span className="bg-emerald-500/30 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-black uppercase">
                    Save 20%
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="p-8">
            {activeTab === 'plans' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plansList.map((plan) => {
                  const isCurrent = currentTier === plan.id;
                  const priceObj = currency === 'NGN' ? plan.price.NGN : plan.price.USD;
                  const displayMonthlyPrice = cycle === 'annual' ? priceObj.annualMonthly : priceObj.monthly;
                  const isPopular = plan.popular;

                  return (
                    <div 
                      key={plan.id}
                      className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all border ${
                        isPopular 
                          ? 'bg-gradient-to-b from-primary/10 via-white/[0.02] to-transparent border-primary/40 shadow-2xl shadow-primary/10' 
                          : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-obsidian px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow">
                          Most Popular · Manga & Animatic
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-base font-bold text-white uppercase tracking-wider">{plan.name}</h3>
                          {plan.badge && !isPopular && (
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                              {plan.badge}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 min-h-[32px] mb-4">{plan.tagline}</p>

                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="text-3xl font-extrabold text-white">
                            {formatPrice(displayMonthlyPrice, currency)}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">/ month</span>
                        </div>

                        {cycle === 'annual' && priceObj.annualTotal > 0 && (
                          <p className="text-[10px] text-emerald-400 font-medium mb-4">
                            Billed annually ({formatPrice(priceObj.annualTotal, currency)}/yr)
                          </p>
                        )}

                        <div className="my-4 py-3 px-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="size-4 text-primary" />
                            <span className="text-xs font-bold text-white">Monthly Credits</span>
                          </div>
                          <span className="text-sm font-extrabold text-primary font-mono">
                            {plan.monthlyCredits.toLocaleString()}
                          </span>
                        </div>

                        <ul className="space-y-2.5 my-6">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              {feature.included ? (
                                <Check className={`size-3.5 mt-0.5 flex-shrink-0 ${feature.highlight ? 'text-primary' : 'text-emerald-400'}`} />
                              ) : (
                                <X className="size-3.5 mt-0.5 text-slate-600 flex-shrink-0" />
                              )}
                              <span className={feature.included ? (feature.highlight ? 'text-white font-semibold' : 'text-slate-300') : 'text-slate-500 line-through'}>
                                {feature.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => handleCheckout(plan.id)}
                        disabled={loadingPlan !== null || isCurrent}
                        className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                          isCurrent
                            ? 'bg-white/10 text-slate-400 cursor-default'
                            : isPopular
                            ? 'bg-primary text-obsidian hover:brightness-110 shadow-lg shadow-primary/20'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {loadingPlan === plan.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : isCurrent ? (
                          'Current Active Plan'
                        ) : (
                          <>
                            <span>Upgrade to {plan.name}</span>
                            <ArrowRight className="size-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Coins className="size-6 text-amber-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Non-Expiring Rollover Credits</h4>
                      <p className="text-xs text-slate-400">Top-up credits never expire and roll over indefinitely across billing cycles.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-amber-300 block">Video Motion Rate</span>
                    <span className="text-xs font-bold text-white font-mono">35 Credits / 5s Shot</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {TOPUP_PACKS.map((pack) => {
                    const priceAmount = currency === 'NGN' ? pack.price.NGN : pack.price.USD;
                    const isPopular = pack.popular;

                    return (
                      <div 
                        key={pack.id}
                        className={`rounded-2xl p-5 flex flex-col justify-between border transition-all ${
                          isPopular 
                            ? 'bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/40 shadow-xl' 
                            : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div>
                          {pack.bonusPercentage ? (
                            <span className="text-[9px] font-black uppercase bg-amber-500 text-obsidian px-2 py-0.5 rounded-full mb-2 inline-block font-mono">
                              +{pack.bonusPercentage}% Bonus
                            </span>
                          ) : null}

                          <h4 className="text-sm font-bold text-white mb-1">{pack.name}</h4>
                          <div className="text-2xl font-black text-amber-400 font-mono my-2">
                            {pack.credits.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-medium">Credits</span>
                          </div>

                          <p className="text-xs text-slate-400 mb-4">
                            ~{Math.floor(pack.credits / 35)} Video Motion shots or {Math.floor(pack.credits / 3)} Storyboard frames
                          </p>
                        </div>

                        <div>
                          <div className="text-lg font-bold text-white mb-3">
                            {formatPrice(priceAmount, currency)}
                          </div>

                          <button
                            onClick={() => handleCheckout(undefined, pack.id)}
                            disabled={loadingPlan !== null}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                              isPopular 
                                ? 'bg-amber-400 text-obsidian hover:brightness-110' 
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            {loadingPlan === pack.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <>
                                <span>Buy {pack.credits} Credits</span>
                                <Coins className="size-3" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="px-8 py-4 bg-white/[0.01] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Encrypted 256-bit checkout via Stripe & Paystack (Nigeria NGN)</span>
            </div>
            <div className="flex items-center gap-4">
              <span>WASM Client Rendering ($0 Server Fees)</span>
              <span>•</span>
              <span>Cancel Anytime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
