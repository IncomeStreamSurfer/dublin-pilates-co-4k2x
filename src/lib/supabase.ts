import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url ?? '', anon ?? '', {
  auth: { persistSession: false },
});

export type PilatesClass = {
  id: string;
  slug: string;
  name: string;
  instructor: string;
  description: string | null;
  day_of_week: string;
  start_time: string; // HH:MM:SS
  duration_mins: number;
  level: string;
  spots_total: number;
  spots_available: number;
  price_pence: number;
  image_url: string | null;
  created_at: string;
};

export type ContentRow = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
};

export const DAY_ORDER: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

export function sortClasses(rows: PilatesClass[]): PilatesClass[] {
  return [...rows].sort((a, b) => {
    const da = DAY_ORDER[a.day_of_week] ?? 99;
    const db = DAY_ORDER[b.day_of_week] ?? 99;
    if (da !== db) return da - db;
    return a.start_time.localeCompare(b.start_time);
  });
}

export function formatTime(t: string): string {
  return t.slice(0, 5);
}

export function formatPrice(pence: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(pence / 100);
}
