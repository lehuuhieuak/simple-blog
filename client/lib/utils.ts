import { clsx, type ClassValue } from 'clsx';
import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDatetime(value?: string | Date) {
  return value && format(value, 'dd/MM/yyyy HH:mm');
}
