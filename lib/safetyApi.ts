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
  acknowledgeWorkerMobileTask,
  archiveSafetyReportByKey,
  blockSiteWorker,
  createSiteWorker,
  createSiteWorkerMobileSession,
  fetchAssignedSafetySites,
  fetchCurrentSafetyUser,
  fetchSafetyContentItems,
  fetchSafetyReportById,
  fetchSafetyReportByKey,
  fetchSafetyReportDraftContext,
  fetchSafetyReportList,
  fetchSafetyReportsBySite,
  fetchSafetySiteDashboard,
  fetchSiteWorkerMobileSessions,
  fetchSiteWorkers,
  fetchWorkerMobileSession,
  importSiteWorkers,
  loginSafetyApi,
  revokeSiteWorkerMobileSession,
  updateSafetyReportStatus,
  updateSiteWorker,
  upsertSafetyReport,
} from '@/lib/safetyApi/endpoints';
