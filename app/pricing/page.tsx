'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Film, Check, X, Zap, Sparkles, Coins, ArrowRight, 
  HelpCircle, ChevronDown, ShieldCheck, Video, 
  Lock, Flame, Layers, Award, Loader2, CheckCircle2 
} from 'lucide-react';
import { 
  SUBSCRIPTION_PLANS, 
  TOPUP_PACKS, 
  PlanTier, 
  Currency, 
  BillingCycle, 
  formatPrice,
  ACTION_COSTS 
} from '@/lib/plans';
import { detectClientCurrency } from '@/lib/geo';
import { useAuth } from '@/components/FirebaseProvider';
import PricingModal from '@/components/PricingModal';

export default function PricingPage() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<Currency>('USD');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'plans' | 'topup'>('plans');
  const [selectedPlanId, setSelectedPlanId] = useState<PlanTier>('starter');
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);

  // Auto-detect currency based on location
  useEffect(() => {
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
  }, []);

  const handlePlanSelect = (planId: PlanTier) => {
    setSelectedPlanId(planId);
    if (!user) {
      // Redirect to signup with redirect back
      window.location.href = `/signup?redirect=/pricing`;
      return;
    }
    setModalTab('plans');
    setIsModalOpen(true);
  };

  const handleTopupSelect = (packId: string) => {
    if (!user) {
      window.location.href = `/signup?redirect=/pricing`;
      return;
    }
    setModalTab('topup');
    setIsModalOpen(true);
  };

  const corePlans = [
    SUBSCRIPTION_PLANS.free,
    SUBSCRIPTION_PLANS.starter,
    SUBSCRIPTION_PLANS.pro,
    SUBSCRIPTION_PLANS.studio,
  ];

  const comparisonRows = [
    {
      category: "Compute & Production Volume",
      items: [
        { name: "Monthly Production Credits", free: "30 (One-time)", starter: "500 / mo", pro: "1,800 / mo", studio: "6,500 / mo", vault: "50 / mo" },
        { name: "Included Team Seats", free: "1", starter: "1", pro: "1", studio: "3 Seats", vault: "1" },
        { name: "Extra Team Seats", free: "-", starter: "-", pro: "$19 / ₦29,000", studio: "$29 / ₦44,000", vault: "-" },
        { name: "Active Storyboard Projects", free: "1 Project", starter: "10 Projects", pro: "Unlimited", studio: "Unlimited", vault: "10 Projects" },
        { name: "Character DNA Turnaround Slots", free: "2 Slots", starter: "8 per Project", pro: "Unlimited", studio: "Unlimited", vault: "Preserved" },
      ]
    },
    {
      category: "Cinematography & Video Engine",
      items: [
        { name: "Maximum Export Resolution", free: "720p HD", starter: "1080p Full HD", pro: "4K Master UHD", studio: "4K Master UHD", vault: "1080p Full HD" },
        { name: "WASM Client-Side Rendering ($0 Server Cost)", free: "✓ Unlimited", starter: "✓ Unlimited", pro: "✓ Unlimited", studio: "✓ Unlimited", vault: "✓ Unlimited" },
        { name: "Watermark-Free Clean Master Exports", free: "No (Watermarked)", starter: "✓ Clean Export", pro: "✓ Clean Export", studio: "✓ Clean Export", vault: "✓ Clean Export" },
        { name: "AI Video Motion (Wan 2.1)", free: "1 Preview", starter: "Via Top-Up", pro: "✓ Included (~40 shots)", studio: "✓ Included (~150 shots)", vault: "Via Top-Up" },
        { name: "Full Commercial YouTube Rights", free: "Non-Commercial", starter: "✓ Full License", pro: "✓ Full License", studio: "✓ Full License", vault: "✓ Full License" },
      ]
    },
    {
      category: "Audio, Directing & Studio Integration",
      items: [
        { name: "Multimodal Showrunner Co-Creator", free: "Standard", starter: "✓ Advanced", pro: "✓ Advanced", studio: "✓ Dedicated", vault: "✓ Standard" },
        { name: "Dialogue Narration & Emotional TTS", free: "Standard", starter: "✓ HD Emotional", pro: "✓ Voice Cloning", studio: "✓ Voice Cloning", vault: "✓ Standard" },
        { name: "NLE Timeline Export (Premiere / FCPXML)", free: "✗", starter: "PDF Only", pro: "✓ FCPXML & EDL", studio: "✓ FCPXML & EDL", vault: "PDF Only" },
        { name: "Generation Queue Priority", free: "Standard", starter: "Standard", pro: "⚡ VIP Priority", studio: "⚡ Dedicated GPU", vault: "Standard" },
        { name: "Batch Generation REST API", free: "✗", starter: "✗", pro: "✗", studio: "✓ Full Access", vault: "✗" },
      ]
    }
  ];

  const faqs = [
    {
      q: "Can I monetize my animated videos and animatics on YouTube?",
      a: "Yes! All Starter, Pro, and Studio plans include a 100% royalty-free commercial license. You own full commercial rights to all generated storyboards, character turnarounds, voiceovers, and exported movies for YouTube monetization, client pitches, Patreon, and TV/streaming productions."
    },
    {
      q: "How does Vivid keep subscription prices so affordable?",
      a: "Unlike traditional AI video tools that charge high server rendering fees, Vivid uses client-side WebAssembly (@ffmpeg/ffmpeg) running directly inside your browser. This eliminates costly cloud video rendering fees, allowing us to pass 100% of those infrastructure savings directly to you in the form of lower monthly plans and higher generation credits."
    },
    {
      q: "How do credit rollovers and Top-Up Packs work?",
      a: "Subscription credits refresh each month on your billing cycle. Any Top-Up Credit Packs you purchase NEVER expire and roll over indefinitely across billing cycles. Our atomic credit engine automatically spends your expiring monthly subscription credits first before touching your permanent top-up bank."
    },
    {
      q: "What is the $4.99 / ₦7,500 Project Vault / Pause plan?",
      a: "Creators often work in episodic bursts between releases. Instead of canceling and losing your consistent character turnarounds, world bibles, and project history, you can switch to the Project Vault. It preserves your entire studio workspace, retains all your purchased rollover credits, and gives you 50 monthly credits for just $4.99/mo (₦7,500/mo)."
    },
    {
      q: "Which payment methods are accepted?",
      a: "We support instant, secure payments worldwide. In Nigeria, we accept all Nigerian bank debit cards (Mastercard, Visa, Verve), bank transfers, and USSD via Paystack in Naira (₦). Internationally, we accept all major credit/debit cards, Apple Pay, and Google Pay via Stripe in USD ($)."
    },
    {
      q: "How many credits do AI actions cost?",
      a: "Script Breakdowns cost 1 credit; Storyboard Keyframes cost 3 credits; 3-Angle Character DNA Turnarounds cost 12 credits; Dialogue Voiceovers cost 1 credit; and 5-second 720p AI Video Motion shots cost 35 credits. Client-side animatic rendering is always 100% FREE."
    }
  ];

  return (
    <div className="min-h-screen bg-obsidian text-white font-sans selection:bg-primary selection:text-obsidian relative">
      <div className="film-grain opacity-20"></div>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 w-full px-6 py-4 bg-obsidian/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="size-8 bg-primary rounded flex items-center justify-center text-obsidian shadow-md shadow-primary/20">
              <Film className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase">
              Vivid<span className="text-primary">.live</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Canvas
            </Link>
            <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              World Bible
            </Link>
            <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Director
            </Link>
            <Link href="/pricing" className="text-sm font-bold text-primary border-b-2 border-primary pb-1">
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency Switcher */}
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1.5 rounded-lg transition-all ${currency === 'USD' ? 'bg-primary text-obsidian shadow' : 'text-slate-400 hover:text-white'}`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency('NGN')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${currency === 'NGN' ? 'bg-primary text-obsidian shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <span>NGN (₦)</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-mono">Paystack</span>
              </button>
            </div>

            {user ? (
              <Link
                href="/dashboard"
                className="bg-primary text-obsidian px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all shadow-md shadow-primary/20"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-white/10 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-all border border-white/10"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="relative pt-20 pb-12 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
          <Sparkles className="size-3.5" />
          Predictable Pricing · Zero Server Render Fees
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
          Supercharge Your Anime, Manga & <br className="hidden sm:inline" />
          <span className="text-primary italic">Film Production Pipeline</span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
          From manga recap voiceovers to 4K cinematic animatics with consistent character DNA. 
          Choose a transparent plan with non-expiring rollover top-ups.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="inline-flex items-center bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
          <button
            onClick={() => setCycle('monthly')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${cycle === 'monthly' ? 'bg-primary text-obsidian shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setCycle('annual')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${cycle === 'annual' ? 'bg-primary text-obsidian shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
          >
            <span>Annual Billing</span>
            <span className="bg-emerald-500/30 text-emerald-300 text-[10px] px-2 py-0.5 rounded-md font-black uppercase">
              Save 20%
            </span>
          </button>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {corePlans.map((plan) => {
            const isFree = plan.id === 'free';
            const priceObj = currency === 'NGN' ? plan.price.NGN : plan.price.USD;
            const displayMonthlyPrice = cycle === 'annual' ? priceObj.annualMonthly : priceObj.monthly;
            const isPopular = plan.popular;

            return (
              <div 
                key={plan.id}
                className={`relative rounded-3xl p-6 md:p-7 flex flex-col justify-between transition-all duration-300 border ${
                  isPopular 
                    ? 'bg-gradient-to-b from-primary/15 via-white/[0.03] to-transparent border-primary/50 shadow-2xl shadow-primary/10 ring-1 ring-primary/40 lg:-translate-y-2' 
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-obsidian px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                    <Flame className="size-3.5 fill-current" />
                    Most Popular · Manga & Film
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">{plan.name}</h3>
                    {plan.badge && !isPopular && (
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 min-h-[36px] mb-6 leading-relaxed">{plan.tagline}</p>

                  {isFree ? (
                    <>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-4xl md:text-5xl font-black text-white tracking-tight">
                          $0
                        </span>
                        <span className="text-sm text-slate-400 font-medium">/ free forever</span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mb-6">
                        No credit card required
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-4xl md:text-5xl font-black text-white tracking-tight">
                          {formatPrice(displayMonthlyPrice, currency)}
                        </span>
                        <span className="text-sm text-slate-400 font-medium">/ month</span>
                      </div>

                      {cycle === 'annual' && priceObj.annualTotal > 0 ? (
                        <p className="text-xs text-emerald-400 font-medium mb-6">
                          Billed annually ({formatPrice(priceObj.annualTotal, currency)}/yr)
                        </p>
                      ) : (
                        <div className="h-6 mb-2"></div>
                      )}
                    </>
                  )}

                  <div className="my-6 p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        <Zap className="size-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {isFree ? 'Welcome Film Credits' : 'Monthly Film Credits'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {isFree ? 'One-time test allowance' : 'Renews every 30 days'}
                        </span>
                      </div>
                    </div>
                    <span className="text-base font-black text-primary font-mono">
                      {plan.monthlyCredits.toLocaleString()}
                    </span>
                  </div>

                  <ul className="space-y-3.5 my-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs leading-relaxed">
                        {feature.included ? (
                          <Check className={`size-4 mt-0.5 flex-shrink-0 ${feature.highlight ? 'text-primary' : 'text-emerald-400'}`} />
                        ) : (
                          <X className="size-4 mt-0.5 text-slate-600 flex-shrink-0" />
                        )}
                        <span className={feature.included ? (feature.highlight ? 'text-white font-bold' : 'text-slate-300') : 'text-slate-500 line-through'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {isFree ? (
                  <Link
                    href={user ? "/dashboard" : "/signup"}
                    className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-white/10 text-white hover:bg-white/20"
                  >
                    <span>{user ? "Go to Dashboard" : "Get Started Free"}</span>
                    <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                      isPopular
                        ? 'bg-primary text-obsidian hover:brightness-110 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <span>Start with {plan.name}</span>
                    <ArrowRight className="size-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Project Vault / Pause Plan Banner */}
        <div className="mt-8 p-6 md:p-8 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="size-4 text-amber-400" />
              <h4 className="text-sm font-black text-white uppercase tracking-wider">Project Vault / Pause Plan</h4>
              <span className="text-xs font-black text-amber-400 font-mono bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                {formatPrice(currency === 'NGN' ? 7500 : 4.99, currency)} / mo
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Taking a break between manga chapters or production cycles? Protect your character turnarounds, world bibles, and rollover credits without losing project consistency.
            </p>
          </div>
          <button
            onClick={() => handlePlanSelect('vault')}
            className="py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-obsidian text-xs font-black uppercase tracking-wider transition-all text-center whitespace-nowrap shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            Learn about Project Vault
          </button>
        </div>
      </section>

      {/* Top-Up Credit Packs Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent border border-amber-500/30 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Coins className="size-4" />
                Never-Expiring Credit Bank
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Top-Up Credit Packs with Permanent Rollover
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
                Need extra credits for Wan 2.1 video motion or intensive keyframe generation? Top-up packs never expire and roll over indefinitely.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left md:text-right">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Video Motion Rate</span>
              <span className="text-sm font-extrabold text-amber-300 font-mono">⚡ 35 Credits / 5s 720p Shot</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TOPUP_PACKS.map((pack) => {
              const packPrice = currency === 'NGN' ? pack.price.NGN : pack.price.USD;
              const isPopular = pack.popular;

              return (
                <div 
                  key={pack.id}
                  className={`rounded-2xl p-6 flex flex-col justify-between border transition-all ${
                    isPopular 
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-xl' 
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div>
                    {pack.bonusPercentage ? (
                      <span className="text-[9px] font-black uppercase bg-amber-400 text-obsidian px-2.5 py-0.5 rounded-full mb-3 inline-block font-mono">
                        +{pack.bonusPercentage}% Bonus Credits
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase text-slate-400 mb-3 inline-block font-mono">
                        Standard Rate
                      </span>
                    )}

                    <h4 className="text-base font-bold text-white mb-1">{pack.name}</h4>
                    
                    <div className="text-3xl font-black text-amber-400 font-mono my-3">
                      {pack.credits.toLocaleString()}
                      <span className="text-xs text-slate-400 font-sans font-medium ml-1">Credits</span>
                    </div>

                    <p className="text-xs text-slate-400 mb-6">
                      ~{Math.floor(pack.credits / 35)} Video Motion shots or {Math.floor(pack.credits / 3)} Storyboard keyframes
                    </p>
                  </div>

                  <div>
                    <div className="text-xl font-bold text-white mb-3">
                      {formatPrice(packPrice, currency)}
                    </div>

                    <button
                      onClick={() => handleTopupSelect(pack.id)}
                      className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        isPopular 
                          ? 'bg-amber-400 text-obsidian hover:brightness-110 shadow-lg' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <span>Buy {pack.credits} Credits</span>
                      <Coins className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-black text-white tracking-tight mb-3">
            Comprehensive Feature Matrix
          </h2>
          <p className="text-xs text-slate-400">
            Compare all limits, rendering resolutions, consistency tools, and team capabilities side-by-side.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.01]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="py-4 px-6 text-slate-400 font-bold uppercase tracking-wider w-1/3">Feature</th>
                <th className="py-4 px-4 text-white font-black text-center">Free</th>
                <th className="py-4 px-4 text-primary font-black text-center bg-primary/5">Starter</th>
                <th className="py-4 px-4 text-white font-black text-center">Pro</th>
                <th className="py-4 px-4 text-white font-black text-center">Studio</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((cat, catIdx) => (
                <React.Fragment key={catIdx}>
                  <tr className="bg-white/[0.04] border-t border-b border-white/10">
                    <td colSpan={5} className="py-3 px-6 text-primary font-extrabold uppercase tracking-widest text-[11px]">
                      {cat.category}
                    </td>
                  </tr>
                  {cat.items.map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-6 text-slate-200 font-medium">{row.name}</td>
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono">{row.free}</td>
                      <td className="py-3.5 px-4 text-center text-primary font-bold font-mono bg-primary/5">{row.starter}</td>
                      <td className="py-3.5 px-4 text-center text-white font-mono">{row.pro}</td>
                      <td className="py-3.5 px-4 text-center text-slate-300 font-mono">{row.studio}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <HelpCircle className="size-4" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Everything You Need to Know About Billing & Credits
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx}
                className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-bold text-white">{faq.q}</span>
                  <ChevronDown className={`size-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-4"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="rounded-3xl p-12 bg-gradient-to-r from-primary/20 via-obsidian to-primary/10 border border-primary/30 text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative z-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
              Ready to Produce Your First Anime or Film?
            </h2>
            <p className="text-sm text-slate-300 mb-8 leading-relaxed">
              StartDirecting in seconds with 30 free credits, or choose a Starter plan tailored for manga and webtoon animatics.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-obsidian font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform shadow-xl shadow-primary/20"
              >
                Get Started Free
              </Link>
              <button
                onClick={() => handlePlanSelect('starter')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase text-xs tracking-widest border border-white/10 transition-all"
              >
                Upgrade to Starter ($9.99 / ₦15,000)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-black/40 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="size-6 bg-primary rounded flex items-center justify-center text-obsidian">
              <Film className="size-3.5" />
            </div>
            <span className="font-bold text-white uppercase tracking-wider">Vivid.live</span>
            <span>·</span>
            <span>© {new Date().getFullYear()} Vivid Multimodal Studio</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-white transition-colors text-primary font-bold">Pricing</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="size-4 text-emerald-400" />
            <span>Secure 256-bit payments by Stripe & Paystack (Nigeria NGN)</span>
          </div>
        </div>
      </footer>

      {/* Pricing Checkout Modal */}
      <PricingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentTier="free"
        initialTab={modalTab}
      />
    </div>
  );
}
