# Batch 42: Admin Users Active-Only and Schedule Save Fix

## Why
- 관제 사용자 목록에서 비활성 사용자가 계속 보이고 있어 삭제 후에도 운영 화면에서 혼선을 만들고 있었다.
- 관제 방문 일정 저장이 실제 일정 PATCH가 아니라 우회 memo 갱신 경로를 타면서 `상세 메모`가 안정적으로 저장되지 않았다.
- 사진첩 다운로드는 upstream 파일명이 확장자 없이 오거나 MIME 정보가 약할 때 브라우저가 `.txt`처럼 저장하는 경우가 있었다.

## What changed
- 관리자 사용자 목록을 `active_only=true` 기준으로 고정하고, 사용자 화면의 비활성 상태 필터를 제거했다.
- 관제 일정 저장 route를 실제 `admin/schedules/{id}` PATCH passthrough로 바꿔 `selection_reason_memo`와 일정 필드가 그대로 저장되게 했다.
- 사진첩 다운로드는 `content-disposition` 파일명에 확장자가 없을 때 `content-type` 기반으로 확장자를 보정해 저장하도록 보강했다.

## Proof
- `npx tsc --noEmit --pretty false`
