'use client';

import { SAFETY_AUTH_TOKEN_KEY } from './config';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(SAFETY_AUTH_TOKEN_KEY);
}

export function readSafetyAuthToken(): string | null {
  return getStoredToken();
}

export function writeSafetyAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SAFETY_AUTH_TOKEN_KEY, token);
}

export function clearSafetyAuthToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SAFETY_AUTH_TOKEN_KEY);
}

