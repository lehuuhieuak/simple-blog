'use client';

import { setLocaleCookie } from '@/app/action';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Globe, Monitor, Moon, Settings, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const languages = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
];

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function SettingsDialog({
  locale,
  theme,
}: {
  locale: string;
  theme: string;
}) {
  const [open, setOpen] = useState(false);
  const { setTheme } = useTheme();
  const t = useTranslations('settings');

  const handleChangeLanguage = (newLocale: string) => {
    setLocaleCookie(newLocale);
  };

  const handleChangeTheme = (newTheme: string) => {
    setTheme(newTheme);
  };

  const currentTheme = themes.find((t) => t.value === theme);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center">
          <Settings className="h-4 w-4" />
          <span className="sr-only">{t('title')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Language Settings */}
          <div className="space-y-3 grid grid-cols-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('language.title')}
            </h4>
            <Select onValueChange={handleChangeLanguage} defaultValue={locale}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose language..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {languages.map((item) => (
                    <SelectItem value={item.value} key={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Theme Settings */}
          <div className="space-y-3 grid grid-cols-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              {currentTheme?.icon && <currentTheme.icon className="h-4 w-4" />}
              {t('theme.title')}
            </h4>
            <Select onValueChange={handleChangeTheme} defaultValue={theme}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose theme..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {themes.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SelectItem value={item.value} key={item.value}>
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
