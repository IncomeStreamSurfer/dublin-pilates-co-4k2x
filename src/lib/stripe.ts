import Stripe from 'stripe';

const key = import.meta.env.STRIPE_SECRET_KEY;

export const stripe = new Stripe(key ?? '', {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

export function hasStripe(): boolean {
  return Boolean(key);
}
