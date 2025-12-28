import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from '../lib/config';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = store.get('locale')?.value || defaultLocale;

  // Debug log to see what locale we're getting
  console.log('i18n request locale:', locale);

  // Ensure we always return a valid locale
  const validLocale =
    locale && locales.includes(locale as typeof locales[number])
      ? (locale as typeof locales[number])
      : defaultLocale;

  if (locale !== validLocale) {
    console.log('Invalid locale:', locale, 'using default:', validLocale);
  }

  try {
    return {
      locale: validLocale, // Explicitly return the locale
      messages: (await import(`../messages/${validLocale}.json`)).default,
    };
  } catch (error) {
    console.error('Error loading messages for locale:', validLocale, error);
    // Fallback to default locale if message loading fails
    return {
      locale: defaultLocale,
      messages: (await import(`../messages/${defaultLocale}.json`)).default,
    };
  }
});
