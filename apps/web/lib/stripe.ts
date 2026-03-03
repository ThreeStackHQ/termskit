import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
      apiVersion: '2026-02-25.clover',
    });
  }
  return _stripe;
}

export const PLAN_LIMITS = {
  free: { policies: 1, users: 100 },
  indie: { policies: 5, users: 5000 },
  pro: { policies: 999999, users: 999999 },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;
