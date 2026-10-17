import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalises the API's list shapes to a plain array. Services return a bare array,
 * `{ items }`, `{ data: [...] }` or `{ data: { items } }` depending on the endpoint.
 */
export function asList<T = any>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const v = value as Record<string, any>;
    if (Array.isArray(v.items)) return v.items;
    if (Array.isArray(v.data)) return v.data;
    if (v.data && Array.isArray(v.data.items)) return v.data.items;
  }
  return [];
}
