/**
 * @file lib/plans.ts
 * @description Central definition of Vivid subscription plans, top-up credit packs,
 * action cost calibration, and dual-currency (USD & NGN) pricing models.
 */

export type PlanTier = 'free' | 'vault' | 'starter' | 'pro' | 'studio' | 'enterprise';
export type Currency = 'USD' | 'NGN';
export type BillingCycle = 'monthly' | 'annual';

export interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

export interface PlanDefinition {
  id: PlanTier;
  name: string;
  tagline: string;
  badge?: string;
  popular?: boolean;
  price: {
    USD: { monthly: number; annualMonthly: number; annualTotal: number };
    NGN: { monthly: number; annualMonthly: number; annualTotal: number };
  };
  monthlyCredits: number;
  maxProjects: number | 'unlimited';
  maxCharacterDNA: number | 'unlimited';
  maxResolution: '720p' | '1080p' | '4K';
  watermarked: boolean;
  commercialLicense: boolean;
  allowVideoMotion: boolean;
  includedSeats: number;
  extraSeatPrice: { USD: number; NGN: number };
  features: PlanFeature[];
}

export interface TopUpPack {
  id: string;
  name: string;
  credits: number;
  price: { USD: number; NGN: number };
  costPerCredit: { USD: number; NGN: number };
  popular?: boolean;
  bonusPercentage?: number;
}

/**
 * Real-world calibrated action costs (1 credit = $0.01 / ₦15 nominal value).
 */
export const ACTION_COSTS = {
  SCRIPT_BREAKDOWN: 1,            // Gemini 3.1 Flash-Lite screenplay logic
  CHARACTER_TURNAROUND_DNA: 12,   // 3-angle character reference sheet (Imagen 3)
  CHARACTER_TURNAROUND: 12,       // Alias
  LOCATION_MASTER_PLATE: 5,       // Environment master plate
  LOCATION_GENERATION: 5,         // Alias
  STORYBOARD_KEYFRAME: 3,         // Storyboard shot frame (Flash Image)
  KEYFRAME_IMAGE: 3,              // Alias
  CHARACTER_REPAINT_AREA: 3,      // Regional inpainting / repair
  DIALOGUE_VOICEOVER: 1,          // Standard Google Cloud TTS line
  VOICEOVER_AUDIO: 1,             // Alias
  PREMIUM_CLONED_VOICEOVER: 2,    // ElevenLabs emotion-cloned voice line
  WASM_ANIMATIC_EXPORT: 0,        // Client-side FFmpeg WASM render (FREE)
  VIDEO_MOTION_720P: 35,          // 5s Wan 2.1 720p video motion shot ($0.25 - $0.35 raw compute)
  VIDEO_MOTION_1080P: 45,         // 5s Wan 2.1 1080p video motion shot ($0.35 - $0.45 raw compute)
} as const;

export function getGatewayForCurrency(currency: Currency): 'stripe' | 'paystack' {
  return currency === 'NGN' ? 'paystack' : 'stripe';
}

/**
 * Initial Free Tier Allowance
 */
export const FREE_TIER_SIGNUP_CREDITS = 30; // One-time signup bonus ($0.30 nominal value)

/**
 * Core Subscription Plans
 */
export const SUBSCRIPTION_PLANS: Record<PlanTier, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Explorer',
    tagline: 'Test the waters & explore visual storyboards',
    price: {
      USD: { monthly: 0, annualMonthly: 0, annualTotal: 0 },
      NGN: { monthly: 0, annualMonthly: 0, annualTotal: 0 }
    },
    monthlyCredits: 0, // One-time 30 credits on signup
    maxProjects: 1,
    maxCharacterDNA: 2,
    maxResolution: '720p',
    watermarked: true,
    commercialLicense: false,
    allowVideoMotion: false, // Only 1 test 480p preview
    includedSeats: 1,
    extraSeatPrice: { USD: 0, NGN: 0 },
    features: [
      { text: '30 One-time Welcome Credits', included: true },
      { text: '1 Active Storyboard Project', included: true },
      { text: '2 Character DNA Turnaround Slots', included: true },
      { text: 'Unlimited 720p WASM Animatic Exports', included: true },
      { text: 'Standard TTS Dialogue Narration', included: true },
      { text: 'Watermark-free Clean Exports', included: false },
      { text: 'Commercial YouTube Monetization', included: false },
      { text: 'Image-to-Video Motion Generation', included: false },
      { text: 'Premiere / Final Cut FCPXML Export', included: false },
    ]
  },

  vault: {
    id: 'vault',
    name: 'Project Vault',
    tagline: 'Keep your character bibles & rollover credits safe during breaks',
    badge: 'Pause Plan',
    price: {
      USD: { monthly: 4.99, annualMonthly: 4.99, annualTotal: 59.88 },
      NGN: { monthly: 7500, annualMonthly: 7500, annualTotal: 90000 }
    },
    monthlyCredits: 50,
    maxProjects: 10,
    maxCharacterDNA: 8,
    maxResolution: '1080p',
    watermarked: false,
    commercialLicense: true,
    allowVideoMotion: false,
    includedSeats: 1,
    extraSeatPrice: { USD: 0, NGN: 0 },
    features: [
      { text: '50 Monthly Maintenance Credits', included: true },
      { text: 'Preserve All Project Files & World Bibles', included: true, highlight: true },
      { text: 'Retain Purchased Top-Up Credit Bank', included: true, highlight: true },
      { text: 'Unlimited 1080p Animatic Exports', included: true },
      { text: 'Full Commercial License Active', included: true },
      { text: 'Instant 1-Click Reactivation to Pro', included: true },
    ]
  },

  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'For Manga, Manhwa, Webtoon & Audio Animatic Creators',
    badge: 'Manga & Animatic',
    popular: true,
    price: {
      USD: { monthly: 9.99, annualMonthly: 7.99, annualTotal: 95.88 },
      NGN: { monthly: 15000, annualMonthly: 12000, annualTotal: 144000 }
    },
    monthlyCredits: 500,
    maxProjects: 10,
    maxCharacterDNA: 8,
    maxResolution: '1080p',
    watermarked: false,
    commercialLicense: true,
    allowVideoMotion: false, // Uses top-up credits for motion
    includedSeats: 1,
    extraSeatPrice: { USD: 0, NGN: 0 },
    features: [
      { text: '500 Monthly Film Production Credits', included: true, highlight: true },
      { text: 'Unlimited Script Breakdowns & Directing', included: true },
      { text: '10 Active Production Projects', included: true },
      { text: '8 Character DNA Turnarounds per Project', included: true },
      { text: 'Unlimited 1080p Full HD Animatic Exports', included: true, highlight: true },
      { text: 'Full Commercial YouTube Monetization', included: true, highlight: true },
      { text: 'PDF Storyboard Presentation Decks', included: true },
      { text: 'Standard TTS & HD Dialogue Audio', included: true },
      { text: 'Pay-as-you-go Video Motion with Top-Up Packs', included: true },
    ]
  },

  pro: {
    id: 'pro',
    name: 'Director Pro',
    tagline: 'For Filmmakers, Commercial Directors & Motion Studios',
    badge: 'Full Motion AI',
    popular: false,
    price: {
      USD: { monthly: 29.00, annualMonthly: 24.00, annualTotal: 288.00 },
      NGN: { monthly: 45000, annualMonthly: 36000, annualTotal: 432000 }
    },
    monthlyCredits: 1800,
    maxProjects: 'unlimited',
    maxCharacterDNA: 'unlimited',
    maxResolution: '4K',
    watermarked: false,
    commercialLicense: true,
    allowVideoMotion: true,
    includedSeats: 1,
    extraSeatPrice: { USD: 19, NGN: 29000 },
    features: [
      { text: '1,800 Monthly Film Production Credits', included: true, highlight: true },
      { text: 'Full Image-to-Video AI Motion (Wan 2.1)', included: true, highlight: true },
      { text: 'Up to ~40 Motion Shots / month included', included: true },
      { text: 'Unlimited Projects & Character DNA Bibles', included: true },
      { text: '4K Master UHD Animatic & Video Exports', included: true, highlight: true },
      { text: 'ElevenLabs Emotional Voice Cloning', included: true },
      { text: 'FCPXML & EDL Export for Premiere / DaVinci', included: true, highlight: true },
      { text: 'Priority VIP GPU Generation Queue', included: true },
      { text: 'Live Multiplayer Project Collaboration', included: true },
    ]
  },

  studio: {
    id: 'studio',
    name: 'Studio Team',
    tagline: 'For Production Houses, Creative Agencies & Cinematic Teams',
    badge: 'Multi-Seat Team',
    price: {
      USD: { monthly: 99.00, annualMonthly: 79.00, annualTotal: 948.00 },
      NGN: { monthly: 150000, annualMonthly: 120000, annualTotal: 1440000 }
    },
    monthlyCredits: 6500,
    maxProjects: 'unlimited',
    maxCharacterDNA: 'unlimited',
    maxResolution: '4K',
    watermarked: false,
    commercialLicense: true,
    allowVideoMotion: true,
    includedSeats: 3,
    extraSeatPrice: { USD: 29, NGN: 44000 },
    features: [
      { text: '6,500 Monthly Film Production Credits', included: true, highlight: true },
      { text: '3 Team Seats Included ($29/extra seat)', included: true, highlight: true },
      { text: 'Up to ~150 Motion Shots / month included', included: true },
      { text: 'Shared World Bible & Asset Repository', included: true },
      { text: 'Dedicated High-Speed GPU Infrastructure', included: true },
      { text: 'Commercial IP Legal Indemnification', included: true },
      { text: 'Batch Generation REST API Access', included: true, highlight: true },
      { text: 'Dedicated Slack Channel & Priority Support', included: true },
    ]
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Bespoke AI pipelines, BYOK & Studio LoRA fine-tuning',
    badge: 'Custom',
    price: {
      USD: { monthly: 499.00, annualMonthly: 399.00, annualTotal: 4788.00 },
      NGN: { monthly: 750000, annualMonthly: 600000, annualTotal: 7200000 }
    },
    monthlyCredits: 35000,
    maxProjects: 'unlimited',
    maxCharacterDNA: 'unlimited',
    maxResolution: '4K',
    watermarked: false,
    commercialLicense: true,
    allowVideoMotion: true,
    includedSeats: 10,
    extraSeatPrice: { USD: 39, NGN: 59000 },
    features: [
      { text: '35,000+ Monthly Credits & Custom Volumes', included: true },
      { text: 'Bring-Your-Own-Key (BYOK) on GCP / AWS', included: true, highlight: true },
      { text: 'Private Fine-Tuned LoRA Style Models', included: true, highlight: true },
      { text: 'SSO / SAML Security & SOC2 Compliance', included: true },
      { text: '99.9% Uptime SLA & Dedicated Account Manager', included: true },
    ]
  }
};

/**
 * Non-expiring Top-Up Credit Packs
 */
export const TOPUP_PACKS: TopUpPack[] = [
  {
    id: 'pack_mini',
    name: 'Mini Reel Pack',
    credits: 300,
    price: { USD: 6.00, NGN: 9000 },
    costPerCredit: { USD: 0.020, NGN: 30 },
    bonusPercentage: 0
  },
  {
    id: 'pack_standard',
    name: 'Standard Producer Pack',
    credits: 1000,
    price: { USD: 18.00, NGN: 27000 },
    costPerCredit: { USD: 0.018, NGN: 27 },
    popular: true,
    bonusPercentage: 10
  },
  {
    id: 'pack_director',
    name: 'Director Power Pack',
    credits: 3000,
    price: { USD: 45.00, NGN: 68000 },
    costPerCredit: { USD: 0.015, NGN: 22.6 },
    bonusPercentage: 25
  },
  {
    id: 'pack_studio',
    name: 'Studio Master Pack',
    credits: 7500,
    price: { USD: 99.00, NGN: 150000 },
    costPerCredit: { USD: 0.0132, NGN: 20 },
    bonusPercentage: 40
  }
];

/**
 * Format currency helper
 */
export function formatPrice(amount: number, currency: Currency): string {
  if (currency === 'NGN') {
    return `₦${amount.toLocaleString()}`;
  }
  return `$${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}
