# Export & Dispatch Spec

## 목적

검토 완료된 보고서를 PDF/HWPX로 출력하고, 출력 이력과 credit 차감 상태를 추적한다.

## 출력 형식

- PDF
- HWPX

## 흐름

```text
사용자 export 클릭
→ 검토 완료 여부 확인
→ disclaimer 확인
→ export API 호출
→ ReportExport 생성
→ credit 차감
→ download API 호출
→ 파일 저장
→ exports 목록 갱신
```

## 과금 기준

- `final_export_consumed=false`인 첫 최종 출력은 credit을 차감한다.
- 같은 보고서의 후속 출력은 정책에 따라 재차감하지 않을 수 있다.
- export record의 `first_charge_applied`로 차감 여부를 남긴다.

## 메일 연계

보고서 발송은 mailbox 기능과 연결된다.

```text
report export
→ mail prepare report
→ mail send report
```

메일 기능의 Gmail/Naver 연동 자체는 `docs/safety-features/mailbox/`에서 관리한다.

## 검증

- 검토 완료 전 출력 실패
- credit 부족 시 출력 실패
- disclaimer 미동의 시 출력 실패
- PDF/HWPX 모두 export history에 기록
- 출력 후 report status는 `exported`
- download filename은 보고서 id 또는 report key를 포함
