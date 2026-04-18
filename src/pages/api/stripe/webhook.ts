import type { APIRoute } from 'astro';
import type Stripe from 'stripe';
import { stripe, hasStripe } from '../../../lib/stripe';
import { supabase } from '../../../lib/supabase';
import { sendEmail, bookingConfirmationHtml } from '../../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!hasStripe()) return new Response('Stripe not configured', { status: 500 });

  const secret = import.meta.env.STRIPE_WEBHOOK_SECRET;
  const sig = request.headers.get('stripe-signature');
  const bodyText = await request.text();

  let event: Stripe.Event;
  try {
    if (!secret || !sig) throw new Error('missing signature or secret');
    event = stripe.webhooks.constructEvent(bodyText, sig, secret);
  } catch (err) {
    console.error('[webhook] signature verification failed:', (err as Error).message);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};
    const bookingId = meta.booking_id;
    const classId = meta.class_id;

    if (bookingId) {
      await supabase
        .from('dp_bookings')
        .update({
          status: 'confirmed',
          stripe_session_id: session.id,
        })
        .eq('id', bookingId);
    }

    if (classId) {
      const { data: cls } = await supabase
        .from('dp_classes')
        .select('spots_available')
        .eq('id', classId)
        .single();
      if (cls && typeof cls.spots_available === 'number' && cls.spots_available > 0) {
        await supabase
          .from('dp_classes')
          .update({ spots_available: cls.spots_available - 1 })
          .eq('id', classId);
      }
    }

    const to = session.customer_details?.email ?? session.customer_email ?? undefined;
    if (to) {
      const amount = session.amount_total ? (session.amount_total / 100).toFixed(2) : '25.00';
      const currency = (session.currency ?? 'gbp').toUpperCase();
      const html = bookingConfirmationHtml({
        customerName: session.customer_details?.name ?? meta.customer_name ?? 'there',
        className: meta.class_name ?? 'Reformer class',
        instructor: meta.instructor ?? 'your instructor',
        day: meta.class_day ?? '',
        time: (meta.class_time ?? '').slice(0, 5),
        amountLabel: currency === 'GBP' ? `£${amount}` : `${currency} ${amount}`,
      });
      const r = await sendEmail({
        to,
        subject: `Your mat is reserved — ${meta.class_name ?? 'Dublin Pilates Co'}`,
        html,
      });
      if (!r.ok) console.error('[webhook] email failed:', r.error);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
