# Batch 05. Review Editor And Export Flow

## 요구사항

- 검토 큐에 낮은 신뢰도 필드 노출
- 사용자 책임 확인 후 export 허용
- export 성공 시 첫 1건만 차감

## 계약

- `reviewMeta.reviewQueue`
- `POST /api/v1/reports/{reportId}/review-complete`
- `POST /api/v1/reports/{reportId}/exports/pdf`
- `POST /api/v1/reports/{reportId}/exports/hwpx`

## 입출력 예시

- 입력: review complete confirmation
- 출력: export history entry

## 검증

- review 미완료 export 차단
- credit 부족 export 차단

## 잔여 리스크

- 실제 HWPX/PDF binary 생성은 다음 단계에서 shared engine과 연결 필요
