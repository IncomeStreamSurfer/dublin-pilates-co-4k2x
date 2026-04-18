import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const url = import.meta.env.PUBLIC_SITE_URL ?? site?.toString() ?? 'https://dublin-pilates-co.vercel.app';
  const body = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${url.replace(/\/$/, '')}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
};
