import type { Metadata } from 'next';
import { ServiceIntroScreen } from '@/features/service-intro/components/ServiceIntroScreen';

export const metadata: Metadata = {
  title: '대한안전산업연구원 RegAI 서비스 소개',
  description: '건설기술재해예방지도 운영 ERP형 서비스 소개 및 네이버 로그인 심사 확인 페이지',
};

export default function ServiceIntroPage() {
  return <ServiceIntroScreen />;
}
