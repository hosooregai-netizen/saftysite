'use client';

import { bootstrapDemoSession, isAuthenticatedSession } from '@/lib/reportApi';
import { fetchCurrentSafetyUser, writeSafetyAuthToken } from '@/lib/safetyApi';
import type { SafetyUser } from '@/types/backend';

export async function ensureAppsSafetySession(): Promise<{
  currentUser: SafetyUser;
  token: string;
}> {
  const session = await bootstrapDemoSession();
  if (!isAuthenticatedSession(session)) {
    throw new Error('이 메뉴는 로그인과 서버 연결이 필요합니다.');
  }
  writeSafetyAuthToken(session.token);
  const currentUser = await fetchCurrentSafetyUser(session.token);
  return { currentUser, token: session.token };
}
