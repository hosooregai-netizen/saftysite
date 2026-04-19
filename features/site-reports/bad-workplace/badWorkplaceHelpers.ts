import { SafetyApiError } from '@/lib/safetyApi';

export function getBadWorkplacePageErrorMessage(error: unknown) {
  if (error instanceof SafetyApiError || error instanceof Error) {
    return error.message;
  }

  return '불량사업장 신고서를 불러오는 중 오류가 발생했습니다.';
}
