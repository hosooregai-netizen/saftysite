# Apply Guide

## 1. Overlay 적용

프로젝트 루트에서 실행한다.

```bash
unzip service_improvement_03_mailbox_threepane_compose_overlay.zip
```

## 2. Clean build

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## 3. Route smoke

```text
/mailbox
/mail/connect/google?error=access_denied
```

## 4. 수동 QA

- 새 메일 버튼 클릭
- 받는 사람 입력 후 Enter
- 추천 주소 클릭
- 제목 입력
- 본문 입력
- 첨부 추가/삭제
- 받는 사람 없을 때 발송 버튼 비활성화
- 작성창 최소화/최대화/닫기
