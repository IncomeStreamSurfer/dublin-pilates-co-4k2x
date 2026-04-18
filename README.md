# Dublin Pilates Co

A boutique reformer pilates studio site for Dublin Pilates Co. Built with Astro, Tailwind v4, Supabase, and Stripe.

## What was built

- **Homepage** with hero, studio philosophy, and a live schedule grid pulled from Supabase (`dp_classes`).
- **/book** — class picker + customer form that creates a dynamic Stripe Checkout session (£25 per class).
- **/thank-you** — post-payment confirmation page.
- **/api/checkout** — server endpoint that creates a pending `dp_bookings` row and a Stripe Checkout session using dynamic `price_data` (no pre-made price IDs).
- **/api/stripe/webhook** — handles `checkout.session.completed`: marks the booking confirmed, decrements `spots_available`, and sends a Resend confirmation email (from `onboarding@resend.dev`).
- **SEO**: per-page meta, canonical URLs, schema.org JSON-LD (`HealthClub`), `sitemap.xml`, `robots.txt`.
- **Harbor hook**: the `dp_content` table is ready for Harbor to write articles into.

## Stack

- Astro 6 + `@astrojs/vercel` (server output)
- Tailwind v4 via `@tailwindcss/vite` plugin
- Supabase (`@supabase/supabase-js`)
- Stripe (`stripe` SDK, Checkout Sessions with dynamic `price_data`)
- Resend REST API (transactional email)

## Environment variables

See `.env.example`.

## TODO for the studio

- Swap the Unsplash hero for real studio photography.
- Verify a sending domain with Resend and flip `FROM` in `src/lib/email.ts` to `hello@dublinpilates.co`.
- Connect `dublinpilates.co` as a custom domain in Vercel.
- Review the Stripe test keys — switch to live mode before taking real bookings.
