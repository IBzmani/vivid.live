/**
 * @file lib/geo.ts
 * @description Geolocation detection and currency resolution for dual-gateway routing
 * (Paystack for Nigeria NGN, Stripe for Global USD).
 */

import { Currency } from './plans';

export interface GeoLocationInfo {
  countryCode: string;
  countryName: string;
  currency: Currency;
  isNigeria: boolean;
  paymentGateway: 'paystack' | 'stripe';
}

/**
 * Resolves geolocation & currency from Next.js server headers or client hints.
 */
export function resolveGeoFromHeaders(headers: Headers): GeoLocationInfo {
  // Check common edge IP country headers (Cloudflare, Vercel, Google Cloud, AWS)
  const countryHeader = 
    headers.get('cf-ipcountry') ||
    headers.get('x-vercel-ip-country') ||
    headers.get('x-country-code') ||
    headers.get('x-client-geo-country') ||
    '';

  const countryCode = countryHeader.trim().toUpperCase() || 'US';
  const isNigeria = countryCode === 'NG';

  return {
    countryCode,
    countryName: isNigeria ? 'Nigeria' : 'International',
    currency: isNigeria ? 'NGN' : 'USD',
    isNigeria,
    paymentGateway: isNigeria ? 'paystack' : 'stripe'
  };
}

export const resolveGeoAndCurrency = resolveGeoFromHeaders;

/**
 * Client-side browser currency inference based on timezone/locale as a fallback.
 */
export function detectClientCurrency(): Currency {
  if (typeof window === 'undefined') return 'USD';

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (timeZone.includes('Lagos') || timeZone.includes('Africa/Lagos')) {
      return 'NGN';
    }

    const languages = navigator.languages || [navigator.language];
    if (languages.some(lang => lang.toLowerCase().includes('en-ng') || lang.toLowerCase().includes('ha-ng') || lang.toLowerCase().includes('yo-ng') || lang.toLowerCase().includes('ig-ng'))) {
      return 'NGN';
    }
  } catch (e) {
    // Ignore error
  }

  return 'USD';
}
