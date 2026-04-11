import type { Metadata } from 'next';
import { ServiceIntroScreen } from '@/features/service-intro/components/ServiceIntroScreen';

export const metadata: Metadata = {
  title: '한국종합안전 업무시스템 서비스 소개',
  description: '건설기술재해예방지도 운영 ERP형 서비스 소개 및 메일 연동 검수 확인 페이지',
};

export default function ServiceIntroPage() {
  return <ServiceIntroScreen />;
}
