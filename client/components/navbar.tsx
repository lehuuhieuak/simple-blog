'use client';

import { SettingsDialog } from '@/components/settings-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  ChartBarIcon,
  LogOutIcon,
  PenToolIcon,
  TagIcon,
  UsersIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function Navbar({ locale, theme }: { locale: string; theme: string }) {
  const { user, logout, loading } = useAuth();
  const { isAdmin } = usePermissions();
  const router = useRouter();
  const t = useTranslations('nav');

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-1">
      <div className="mx-auto container">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <PenToolIcon className="h-6 w-6" />
              <span className="text-xl font-bold">DevBlog</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">
                  Loading...
                </span>
              </div>
            ) : user ? (
              <>
                <Link href="/create-post">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <PenToolIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('write')}</p>
                    </TooltipContent>
                  </Tooltip>
                </Link>
                <Link href="/dashboard">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ChartBarIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('dashboard')}</p>
                    </TooltipContent>
                  </Tooltip>
                </Link>

                {/* Admin-only links */}
                {isAdmin && (
                  <>
                    <Link href="/tags">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <TagIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('tags')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </Link>
                    <Link href="/users">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <UsersIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('users')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </Link>
                  </>
                )}

                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOutIcon className="h-4 w-4 mr-2" />
                  {t('logout')}
                </Button>
                <span className="text-sm font-extrabold">{user.username}</span>
              </>
            ) : (
              <>
                <SettingsDialog locale={locale} theme={theme} />
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    {t('login')}
                  </Button>
                </Link>
                <Link href="/register">
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
