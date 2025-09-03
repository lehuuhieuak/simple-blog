export const locales = ['en', 'vi'] as const;
export const defaultLocale = 'en' as const;

export type Locale = typeof locales[number];