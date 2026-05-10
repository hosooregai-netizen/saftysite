# 07_QA_REGRESSION: Report Workspace

```text
너는 보고서 작성 워크스페이스의 QA와 회귀 테스트를 담당하는 시니어 QA 엔지니어다.

목표:
새 보고서 작성부터 AI 초안 생성, 검토 완료, PDF/HWPX 출력까지 전체 흐름을 검증하라.

참조 문서:
- docs/safety-features/report-workspace/specs/test_scenarios.md
- docs/safety-features/report-workspace/specs/validation.md
- docs/safety-features/report-workspace/specs/known_issues.md

검증 명령:
rm -rf apps/web/.next
cd apps/web
npm run build

Route smoke:
- /reports/new
- /reports
- /reports/{knownReportId}
- /reports/{missingReportId}

기능 테스트:
1. 새 보고서 시작
2. 현장/사업장 선택
3. 사진 업로드
4. 사진 검토
5. AI 초안 생성
6. report workspace 진입
7. finding/section 수정
8. review queue 해결
9. review complete
10. PDF export
11. HWPX export
12. export history 확인

보안 테스트:
- 다른 workspace report 접근 차단
- 다른 workspace photo id 사용 차단
- 검토 완료 전 export 차단
- credit 부족 export 차단

완료 기준:
- build 성공
- route smoke 성공
- 전체 happy path 성공
- 핵심 negative test 성공
- docs의 test_scenarios.md 업데이트
```
