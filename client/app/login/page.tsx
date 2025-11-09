'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { translateValidationError } from '@/lib/validation-errors';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const t = useTranslations('auth.login');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange', // Enable real-time validation
  });

  const onSubmit = async (data: LoginInput) => {
    const result = await login(data.email, data.password);

    if (result.success) {
      router.push('./dashboard');
    } else {
      setError('root', {
        message: result.error || tCommon('error'),
      });
    }
  };

  const rootError = errors.root?.message;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <LogIn className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {rootError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {rootError}
              </div>
            )}

            <div className="grid gap-3">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-600">
                  {translateValidationError(errors.email.message, tValidation)}
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-600">
                  {translateValidationError(
                    errors.password.message,
                    tValidation,
                  )}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-transparent border-t-white animate-spin"></div>
                  {t('loggingIn')}
                </span>
              ) : (
                t('loginButton')
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {t('noAccount')}{' '}
            <Link href="/register" className="text-primary hover:underline">
              {t('signupLink')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
