'use server';

import { defaultLocale } from '@/lib/config';
import { cookies } from 'next/headers';

export async function setLocaleCookie(locale: string) {
  (await cookies()).set({
    name: 'locale',
    value: locale,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getLocaleCookie() {
  const cookieStore = await cookies();
  return cookieStore.get('locale')?.value || defaultLocale;
}

export async function setThemeCookie(theme: string) {
  (await cookies()).set({
    name: 'theme',
    value: theme,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getThemeCookie() {
  const cookieStore = await cookies();
  return cookieStore.get('theme')?.value || 'light';
}
