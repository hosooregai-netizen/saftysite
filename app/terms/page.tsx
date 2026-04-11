import type { Metadata } from 'next';
import { LegalDocumentScreen } from '@/features/legal/components/LegalDocumentScreen';

export const metadata: Metadata = {
  title: '이용약관 | 한국종합안전 업무시스템',
  description: '한국종합안전 업무시스템 이용약관',
};

const sections = [
  {
    title: '1. 서비스 목적',
    body: [
      '한국종합안전 업무시스템은 건설기술재해예방지도 운영을 위한 사업장·현장 관리, 보고서 작성, 문서 출력, 메일 발송 및 수신 확인 기능을 제공합니다.',
    ],
  },
  {
    title: '2. 계정 및 메일 연동',
    body: [
      '사용자는 본인이 권한을 가진 메일 계정만 연결해야 하며, 연결된 계정을 통해 수행된 발송 및 조회 행위에 대한 책임은 해당 사용자에게 있습니다.',
      '서비스는 사용자가 연결한 구글 또는 네이버 메일 계정을 기반으로 받은편지함 조회, 발송, 스레드 확인 기능을 제공합니다.',
    ],
  },
  {
    title: '3. 허용되는 사용 범위',
    body: [
      '서비스는 내부 운영, 보고서 전달, 현장 커뮤니케이션을 위한 용도로 사용해야 하며, 관련 법령이나 제3자 권리를 침해하는 방식으로 사용해서는 안 됩니다.',
    ],
  },
  {
    title: '4. 서비스 변경 및 제한',
    body: [
      '서비스 기능, 화면 구성, 연동 방식은 운영상 필요에 따라 변경될 수 있으며, 보안 또는 안정성 이슈가 있는 경우 특정 기능의 사용이 제한될 수 있습니다.',
    ],
  },
  {
    title: '5. 문의',
    body: [
      '서비스 이용, 계정 연결, 데이터 처리와 관련한 문의는 아래 연락처로 접수할 수 있습니다.',
      '문의처: hosooregai@gmail.com',
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocumentScreen
      eyebrow="Terms of Service"
      title="이용약관"
      description="한국종합안전 업무시스템 이용약관은 서비스 사용 범위, 메일 연동 책임, 운영상 제한 사항을 안내합니다."
      sections={sections}
    />
  );
}
