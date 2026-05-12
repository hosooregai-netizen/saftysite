# Webhard QA After Permission/Public Share Hardening

## Build

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## Route smoke

```text
/webhard
/share/{validToken}
/share/{expiredToken}
/share/{revokedToken}
```

## Functional QA

- [ ] 내 자료함 목록 표시
- [ ] 폴더 생성
- [ ] 파일 업로드
- [ ] 이름 변경
- [ ] 이동
- [ ] 휴지통
- [ ] 복원
- [ ] 공유 dialog 열기
- [ ] restricted 설정
- [ ] anyone_with_link 설정
- [ ] viewer/editor role 설정
- [ ] 만료일 설정
- [ ] 링크 복사
- [ ] 링크 폐기
- [ ] 공유 badge 표시

## Security QA

- [ ] workspace 밖 item share 차단
- [ ] shared root 밖 parent_id 접근 차단
- [ ] expired share 접근 차단
- [ ] revoked share 접근 차단
- [ ] trashed/deleted item public 목록 제외
- [ ] viewer edit/delete/share UI 숨김
- [ ] 권한 없는 사용자에게 content field 반환 금지

## Visual QA

- [ ] Drive-like layout 유지
- [ ] ERP 카드형 회귀 없음
- [ ] share dialog 정보 구조 유지
- [ ] public share page breadcrumb는 root 밖 경로 노출 금지
