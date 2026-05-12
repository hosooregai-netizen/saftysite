# AI Fill Status UI

## 문제

현재 UI는 사진이 들어간 것과 AI가 어떤 필드를 왜 못 채웠는지를 분리해서 보여주지 못한다.

## 목표

사용자가 아래를 즉시 알 수 있어야 한다.

```text
사진 분석 완료 여부
AI가 채운 필드
AI가 못 채운 필드
확인 필요 사유
해당 필드의 증거 사진
수동 수정 위치
```

## UI component

```text
AiFillStatusPanel
AiPhotoObservationDrawer
FieldConfidenceBadge
ReviewReasonList
```

## 화면 흐름

```text
사진 카드 클릭
→ observation drawer
→ visual objects / process / risk / mapping rule / confidence 표시

필드 옆 badge
→ AI 채움 / 표준 매칭 / 확인 필요

review queue
→ 이유 클릭 시 해당 사진과 필드로 이동
```

## badge

```text
AI 채움
표준 매칭
확인 필요
수동 수정
```

## 필드별 표시 예

```text
재해형태: 떨어짐
[AI 채움 · 0.78]

지적사항/개선요청:
이동식 사다리 지지상태, 전도방지 조치, 2인1조 작업 및 안전대 사용 상태 확인 필요
[표준 매칭 · LADDER_FALL_PREVENTION]

기타 메모:
사진 기반 초안으로 현장 확인 후 확정 필요
[확인 필요]
```
