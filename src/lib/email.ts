const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
const FROM = 'Dublin Pilates Co <onboarding@resend.dev>';

type SendArgs = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendArgs): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: 'Missing RESEND_API_KEY' };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  const json = (await res.json()) as { id?: string; message?: string };
  if (!res.ok) return { ok: false, error: json.message ?? `HTTP ${res.status}` };
  return { ok: true, id: json.id };
}

export function bookingConfirmationHtml(opts: {
  customerName: string;
  className: string;
  instructor: string;
  day: string;
  time: string;
  amountLabel: string;
}) {
  return `<!doctype html>
<html>
  <body style="font-family: Georgia, 'Times New Roman', serif; background:#f6f1e7; color:#2b231b; padding:32px;">
    <div style="max-width:560px; margin:0 auto; background:#ffffff; padding:40px; border-radius:4px;">
      <p style="letter-spacing:0.22em; text-transform:uppercase; font-family:Arial, sans-serif; font-size:11px; color:#6b4e31; margin:0 0 24px;">Dublin Pilates Co</p>
      <h1 style="font-size:32px; margin:0 0 12px; font-weight:400;">Your mat is reserved, ${opts.customerName}.</h1>
      <p style="font-size:16px; line-height:1.55; color:#2b231b;">Thank you for booking <strong>${opts.className}</strong> with ${opts.instructor}.</p>
      <div style="margin:28px 0; padding:20px 0; border-top:1px solid #ece4d3; border-bottom:1px solid #ece4d3;">
        <p style="margin:4px 0;"><strong>When:</strong> ${opts.day} · ${opts.time}</p>
        <p style="margin:4px 0;"><strong>Paid:</strong> ${opts.amountLabel}</p>
        <p style="margin:4px 0;"><strong>Studio:</strong> 17 Fitzwilliam Lane, Dublin 2</p>
      </div>
      <p style="font-size:14px; line-height:1.6; color:#6b4e31;">Please arrive 10 minutes before class. Grip socks are required and available at reception (€4).</p>
      <p style="font-size:14px; line-height:1.6; color:#6b4e31;">With warmth,<br/>Aoife &amp; the team</p>
    </div>
  </body>
</html>`;
}
