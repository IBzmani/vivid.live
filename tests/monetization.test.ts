import assert from 'node:assert';
import { test, describe } from 'node:test';
import { 
  SUBSCRIPTION_PLANS, 
  TOPUP_PACKS, 
  ACTION_COSTS, 
  formatPrice, 
  getGatewayForCurrency 
} from '../lib/plans';
import { resolveGeoAndCurrency } from '../lib/geo';
import { isDisposableEmail, checkRateLimit } from '../lib/antiAbuse';

describe('Vivid Monetization & Pricing Engine', () => {
  test('Subscription plan tier structures and calibrated credits', () => {
    // Free Explorer
    assert.strictEqual(SUBSCRIPTION_PLANS.free.monthlyCredits, 0);
    assert.strictEqual(SUBSCRIPTION_PLANS.free.watermarked, true);
    assert.strictEqual(SUBSCRIPTION_PLANS.free.maxResolution, '720p');

    // Project Vault / Pause Plan ($4.99 / ₦7,500)
    assert.strictEqual(SUBSCRIPTION_PLANS.vault.price.USD.monthly, 4.99);
    assert.strictEqual(SUBSCRIPTION_PLANS.vault.price.NGN.monthly, 7500);
    assert.strictEqual(SUBSCRIPTION_PLANS.vault.monthlyCredits, 50);

    // Starter ($9.99 / ₦15,000)
    assert.strictEqual(SUBSCRIPTION_PLANS.starter.price.USD.monthly, 9.99);
    assert.strictEqual(SUBSCRIPTION_PLANS.starter.price.NGN.monthly, 15000);
    assert.strictEqual(SUBSCRIPTION_PLANS.starter.monthlyCredits, 500);
    assert.strictEqual(SUBSCRIPTION_PLANS.starter.watermarked, false);
    assert.strictEqual(SUBSCRIPTION_PLANS.starter.maxResolution, '1080p');

    // Pro ($29 / ₦45,000)
    assert.strictEqual(SUBSCRIPTION_PLANS.pro.price.USD.monthly, 29);
    assert.strictEqual(SUBSCRIPTION_PLANS.pro.price.NGN.monthly, 45000);
    assert.strictEqual(SUBSCRIPTION_PLANS.pro.monthlyCredits, 1800);
    assert.strictEqual(SUBSCRIPTION_PLANS.pro.maxResolution, '4K');

    // Studio ($99 / ₦150,000)
    assert.strictEqual(SUBSCRIPTION_PLANS.studio.price.USD.monthly, 99);
    assert.strictEqual(SUBSCRIPTION_PLANS.studio.price.NGN.monthly, 150000);
    assert.strictEqual(SUBSCRIPTION_PLANS.studio.monthlyCredits, 6500);
  });

  test('Calibrated action credit costs and video motion sustainability', () => {
    assert.strictEqual(ACTION_COSTS.SCRIPT_BREAKDOWN, 1);
    assert.strictEqual(ACTION_COSTS.CHARACTER_TURNAROUND, 12);
    assert.strictEqual(ACTION_COSTS.LOCATION_GENERATION, 5);
    assert.strictEqual(ACTION_COSTS.KEYFRAME_IMAGE, 3);
    assert.strictEqual(ACTION_COSTS.VOICEOVER_AUDIO, 1);
    
    // Video Motion must be 35-45 credits (never subsidized to 6-10)
    assert.strictEqual(ACTION_COSTS.VIDEO_MOTION_720P, 35);
    assert.strictEqual(ACTION_COSTS.VIDEO_MOTION_1080P, 45);

    // Verify Pro plan (1800 credits) supports ~25-50 motion shots or 600 keyframes
    const proMotionShots = Math.floor(SUBSCRIPTION_PLANS.pro.monthlyCredits / ACTION_COSTS.VIDEO_MOTION_720P);
    const proKeyframes = Math.floor(SUBSCRIPTION_PLANS.pro.monthlyCredits / ACTION_COSTS.KEYFRAME_IMAGE);
    assert.ok(proMotionShots >= 25 && proMotionShots <= 52);
    assert.strictEqual(proKeyframes, 600);
  });

  test('Dual-currency price formatting (USD & NGN)', () => {
    assert.strictEqual(formatPrice(9.99, 'USD'), '$9.99');
    assert.strictEqual(formatPrice(15000, 'NGN'), '₦15,000');
    assert.strictEqual(formatPrice(0, 'USD'), '$0');
  });

  test('Payment gateway selection by currency and location', () => {
    assert.strictEqual(getGatewayForCurrency('USD'), 'stripe');
    assert.strictEqual(getGatewayForCurrency('NGN'), 'paystack');

    // Nigeria geo resolution
    const ngHeaders = new Headers({ 'x-vercel-ip-country': 'NG' });
    const ngRes = resolveGeoAndCurrency(ngHeaders);
    assert.strictEqual(ngRes.countryCode, 'NG');
    assert.strictEqual(ngRes.currency, 'NGN');
    assert.strictEqual(ngRes.paymentGateway, 'paystack');

    // US / Global geo resolution
    const usHeaders = new Headers({ 'x-vercel-ip-country': 'US' });
    const usRes = resolveGeoAndCurrency(usHeaders);
    assert.strictEqual(usRes.countryCode, 'US');
    assert.strictEqual(usRes.currency, 'USD');
    assert.strictEqual(usRes.paymentGateway, 'stripe');
  });

  test('Top-up credit packs structure and bonus calculation', () => {
    assert.strictEqual(TOPUP_PACKS.length, 4);
    
    // Mini pack
    assert.strictEqual(TOPUP_PACKS[0].id, 'pack_mini');
    assert.strictEqual(TOPUP_PACKS[0].credits, 300);
    assert.strictEqual(TOPUP_PACKS[0].price.USD, 6);
    assert.strictEqual(TOPUP_PACKS[0].price.NGN, 9000);

    // Studio pack (+40% bonus)
    assert.strictEqual(TOPUP_PACKS[3].id, 'pack_studio');
    assert.strictEqual(TOPUP_PACKS[3].credits, 7500);
    assert.strictEqual(TOPUP_PACKS[3].bonusPercentage, 40);
  });

  test('Anti-abuse disposable email detection', () => {
    assert.strictEqual(isDisposableEmail('test@mailinator.com'), true);
    assert.strictEqual(isDisposableEmail('creator@10minutemail.com'), true);
    assert.strictEqual(isDisposableEmail('animator@tempmail.com'), true);
    assert.strictEqual(isDisposableEmail('realuser@gmail.com'), false);
    assert.strictEqual(isDisposableEmail('creator@vivid.live'), false);
  });

  test('In-memory rate limiter logic', () => {
    const testId = `test_ip_${Date.now()}`;
    
    // Within limits
    const r1 = checkRateLimit(testId, 3, 60000);
    assert.strictEqual(r1.allowed, true);
    assert.strictEqual(r1.remaining, 2);

    const r2 = checkRateLimit(testId, 3, 60000);
    assert.strictEqual(r2.allowed, true);
    assert.strictEqual(r2.remaining, 1);

    const r3 = checkRateLimit(testId, 3, 60000);
    assert.strictEqual(r3.allowed, true);
    assert.strictEqual(r3.remaining, 0);

    // Exceeded limit
    const r4 = checkRateLimit(testId, 3, 60000);
    assert.strictEqual(r4.allowed, false);
    assert.strictEqual(r4.remaining, 0);
  });
});
