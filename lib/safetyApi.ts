'use client';

export {
  clearSafetyAuthToken,
  readSafetyAuthToken,
  writeSafetyAuthToken,
} from '@/lib/safetyApi/authStorage';
export { requestSafetyApi, SafetyApiError } from '@/lib/safetyApi/client';
export {
  buildSafetyApiUrl,
  DEFAULT_SAFETY_API_BASE_URL,
  getSafetyApiBaseUrl,
  SAFETY_AUTH_TOKEN_KEY,
} from '@/lib/safetyApi/config';
export {
  archiveSafetyReportByKey,
  fetchAssignedSafetySites,
  fetchCurrentSafetyUser,
  fetchSafetyContentItems,
  fetchSafetyReportByKey,
  fetchSafetyReportList,
  fetchSafetyReportsBySite,
  fetchTechnicalGuidanceSeed,
  loginSafetyApi,
  upsertSafetyReport,
} from '@/lib/safetyApi/endpoints';
export {
  analyzeHazardPhotos,
  checkCausativeAgents,
  generateDoc11EducationContent,
  generateDoc5Summary,
} from '@/lib/safetyApi/ai';

