import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase';

export const GET: APIRoute = async ({ site }) => {
  const base = (import.meta.env.PUBLIC_SITE_URL ?? site?.toString() ?? 'https://dublin-pilates-co.vercel.app').replace(/\/$/, '');

  const { data } = await supabase.from('dp_content').select('slug, published_at').not('published_at', 'is', null);
  const posts = (data ?? []) as Array<{ slug: string; published_at: string }>;

  const urls = [
    { loc: `${base}/`, priority: '1.0' },
    { loc: `${base}/book`, priority: '0.9' },
    ...posts.map((p) => ({ loc: `${base}/writing/${p.slug}`, priority: '0.6' })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
