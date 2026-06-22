/**
 * cn.js — Tailwind class merging utility (shadcn/ui pattern)
 */
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
