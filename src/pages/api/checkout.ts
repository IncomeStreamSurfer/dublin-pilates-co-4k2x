import type { APIRoute } from 'astro';
import { supabase, type PilatesClass } from '../../lib/supabase';
import { stripe, hasStripe } from '../../lib/stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  if (!hasStripe()) {
    return new Response('Stripe not configured', { status: 500 });
  }

  const form = await request.formData();
  const classId = String(form.get('class_id') ?? '');
  const customerName = String(form.get('customer_name') ?? '').trim();
  const customerEmail = String(form.get('customer_email') ?? '').trim();
  const customerPhone = String(form.get('customer_phone') ?? '').trim();
  const notes = String(form.get('notes') ?? '').trim();

  if (!classId || !customerName || !customerEmail) {
    return new Response('Missing required fields', { status: 400 });
  }

  const { data: cls, error } = await supabase
    .from('dp_classes')
    .select('*')
    .eq('id', classId)
    .single();

  if (error || !cls) {
    return new Response('Class not found', { status: 404 });
  }

  const c = cls as PilatesClass;
  if (c.spots_available < 1) {
    return new Response('Class is full', { status: 409 });
  }

  const origin = import.meta.env.PUBLIC_SITE_URL ?? url.origin;

  const { data: booking, error: bookingErr } = await supabase
    .from('dp_bookings')
    .insert({
      class_id: c.id,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || null,
      notes: notes || null,
      amount_pence: c.price_pence,
      currency: 'gbp',
      status: 'pending',
    })
    .select()
    .single();

  if (bookingErr || !booking) {
    console.error('[booking insert]', bookingErr?.message);
    return new Response('Could not create booking', { status: 500 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          unit_amount: c.price_pence,
          product_data: {
            name: `${c.name} — ${c.day_of_week} ${c.start_time.slice(0, 5)}`,
            description: `${c.instructor} · ${c.duration_mins} min · ${c.level} · Dublin Pilates Co`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      booking_id: booking.id,
      class_id: c.id,
      class_name: c.name,
      class_day: c.day_of_week,
      class_time: c.start_time,
      instructor: c.instructor,
      customer_name: customerName,
      customer_phone: customerPhone,
      notes,
    },
    success_url: `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/book?canceled=1`,
  });

  await supabase
    .from('dp_bookings')
    .update({ stripe_session_id: session.id })
    .eq('id', booking.id);

  return Response.redirect(session.url ?? `${origin}/book`, 303);
};
