'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { PenTool, LogOut, User, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslations } from 'next-intl';

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('nav');

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}`);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/${locale}`} className="flex items-center space-x-2">
              <PenTool className="h-6 w-6" />
              <span className="text-xl font-bold">DevBlog</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href={`/${locale}`}>
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                {t('home')}
              </Button>
            </Link>

            <LanguageSwitcher />

            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : user ? (
              <>
                <Link href={`/${locale}/dashboard`}>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {t('dashboard')}
                  </Button>
                </Link>
                <Link href={`/${locale}/create-post`}>
                  <Button variant="default" size="sm">
                    <PenTool className="h-4 w-4 mr-2" />
                    {t('write')}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('logout')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {user.username}
                </span>
              </>
            ) : (
              <>
                <Link href={`/${locale}/login`}>
                  <Button variant="ghost" size="sm">
                    {t('login')}
                  </Button>
                </Link>
                <Link href={`/${locale}/register`}>
                  <Button variant="default" size="sm">
                    {t('signup')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}