import { redirect } from 'next/navigation';

export default function NaverMailConnectPage() {
  redirect(
    '/mailbox?oauthError=' +
      encodeURIComponent('SaaS 메일 연동은 현재 구글 로그인만 지원합니다.'),
  );
}
