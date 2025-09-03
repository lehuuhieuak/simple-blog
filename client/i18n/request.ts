import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from '../lib/config';

export default getRequestConfig(async ({ locale }) => {
  // Debug log to see what locale we're getting
  console.log('i18n request locale:', locale);
  
  // Ensure we always return a valid locale
  const validLocale = locale && locales.includes(locale as any) ? locale : defaultLocale;
  
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
