import es from './es.json';
import en from './en.json';

export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

const messages: Record<Locale, Record<string, unknown>> = { es, en };

function get(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Translate a key for the given locale. Keys use dot notation (e.g. "nav.home").
 * Placeholders like {field} or {n} are replaced with the given params.
 */
export function t(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = messages[locale] ?? messages[defaultLocale];
  let value = get(dict as Record<string, unknown>, key) ?? get(messages[defaultLocale] as Record<string, unknown>, key) ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return value;
}

/** Base path for a locale: "" for default (es), "/en" for others (prefixDefaultLocale false). */
export function localeBase(locale: Locale): string {
  return locale === defaultLocale ? "" : `/${locale}`;
}

/** Full path for a locale (e.g. "/en/submit" from locale "en" and path "/submit"). */
export function localePath(locale: Locale, path: string): string {
  const base = path.startsWith('/') ? path : `/${path}`;
  return localeBase(locale) + base;
}

export function isLocale(s: string): s is Locale {
  return locales.includes(s as Locale);
}
