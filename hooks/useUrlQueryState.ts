'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type UrlQueryValue = string | number | boolean | null | undefined;

function normalizeQueryValue(value: UrlQueryValue) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export function readNumberParam(
  searchParams: Pick<URLSearchParams, 'get'>,
  key: string,
  defaultValue: number,
  minValue = 0,
) {
  const value = Number(searchParams.get(key));
  if (!Number.isFinite(value)) return defaultValue;
  return Math.max(minValue, Math.trunc(value));
}

export function readStringParam(
  searchParams: Pick<URLSearchParams, 'get'>,
  key: string,
  defaultValue = '',
) {
  return searchParams.get(key) ?? defaultValue;
}

export function readEnumParam<T extends string>(
  searchParams: Pick<URLSearchParams, 'get'>,
  key: string,
  allowedValues: readonly T[],
  defaultValue: T,
) {
  const value = searchParams.get(key);
  return value && allowedValues.includes(value as T) ? (value as T) : defaultValue;
}

export function useUrlQueryUpdater() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return useCallback(
    (
      updates: Record<string, UrlQueryValue>,
      defaults: Record<string, UrlQueryValue> = {},
    ) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        const nextValue = normalizeQueryValue(value);
        const defaultValue = normalizeQueryValue(defaults[key]);
        if (!nextValue || nextValue === defaultValue) {
          nextParams.delete(key);
          return;
        }
        nextParams.set(key, nextValue);
      });

      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );
}
