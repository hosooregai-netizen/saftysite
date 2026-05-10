# 07. Reverse Map — 점검회차/일정 관리

## 1. Feature

```yaml
featureId: inspection.schedule.management
featureName: 점검회차/일정 관리
priority: P0
module: inspection-schedule
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 점검회차 목록 | `/projects/[projectId]/inspections` | 프로젝트별 점검회차 조회 |
| 점검 일정 생성 | `/projects/[projectId]/inspections/schedule` | 자동/수동 일정 생성 |
| 회차 수동 추가 | `/projects/[projectId]/inspections/new` | 점검회차 수동 등록 |
| 회차 상세 | `/inspections/[inspectionRoundId]` | 회차별 업무/상태 |
| 회차 수정 | `/inspections/[inspectionRoundId]/edit` | 점검일, 담당자, 상태 수정 |
| 회차 업무 | `/inspections/[inspectionRoundId]/tasks` | 준비/보고/제출 업무 관리 |
| 발주처별 보고서 | `/inspections/[inspectionRoundId]/owner-reports` | 발주처별 문서 상태 |
| 공사일정 첨부 | `/inspections/[inspectionRoundId]/attachments` | 공사일정 파일 연결 |
| 점검 캘린더 | `/calendar/inspections` | 전체 점검 일정 캘린더 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/projects/[projectId]/inspections` | InspectionTimeline, InspectionRoundTable, InspectionRoundCard, MilestoneBadge |
| `/projects/[projectId]/inspections/schedule` | InspectionScheduleGenerator, InspectionSchedulePreview |
| `/projects/[projectId]/inspections/new` | InspectionRoundForm |
| `/inspections/[inspectionRoundId]` | InspectionRoundSummary, RoundDependencyStatus |
| `/inspections/[inspectionRoundId]/edit` | InspectionRoundForm, InspectionRescheduleModal |
| `/inspections/[inspectionRoundId]/tasks` | InspectionTaskChecklist, InspectionReminderPanel |
| `/inspections/[inspectionRoundId]/owner-reports` | OwnerReportTaskList, OwnerReportStatusMatrix |
| `/inspections/[inspectionRoundId]/attachments` | WorkScheduleAttachmentPanel, WorkSchedulePreview |
| `/calendar/inspections` | InspectionCalendar, InspectionFilterBar |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| InspectionTimeline | GET `/api/v1/projects/{projectId}/inspection-rounds` |
| InspectionRoundTable | GET `/api/v1/projects/{projectId}/inspection-rounds` |
| InspectionScheduleGenerator | POST `/api/v1/projects/{projectId}/inspection-schedules/preview` |
| InspectionSchedulePreview | POST `/api/v1/projects/{projectId}/inspection-schedules/generate` |
| InspectionRoundForm | POST/PATCH `/api/v1/inspection-rounds` |
| InspectionRescheduleModal | POST `/api/v1/inspection-rounds/{inspectionRoundId}/reschedule` |
| InspectionTaskChecklist | GET/PATCH `/api/v1/inspection-tasks` |
| OwnerReportTaskList | GET `/api/v1/inspection-rounds/{inspectionRoundId}/owner-report-tasks` |
| OwnerReportStatusMatrix | PATCH `/api/v1/owner-report-tasks/{taskId}` |
| WorkScheduleAttachmentPanel | POST `/api/v1/inspection-rounds/{inspectionRoundId}/attachments` |
| InspectionCalendar | GET `/api/v1/calendar/inspection-rounds` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| GET `/inspection-schedules` | InspectionSchedule |
| POST `/inspection-schedules/preview` | Project, Contract, ProjectParty |
| POST `/inspection-schedules/generate` | InspectionSchedule, InspectionRound, InspectionTask, InspectionOwnerReportTask |
| GET `/inspection-rounds` | InspectionRound |
| PATCH `/inspection-rounds/{id}` | InspectionRound, AuditLog |
| POST `/inspection-rounds/{id}/reschedule` | InspectionRound, InspectionRescheduleLog |
| GET `/owner-report-tasks` | InspectionOwnerReportTask, ProjectParty |
| POST `/owner-report-tasks/{id}/link-document` | InspectionOwnerReportTask, DocumentInstance |
| POST `/owner-report-tasks/{id}/mark-submitted` | InspectionOwnerReportTask, MailThread, Submission |
| POST `/attachments` | WorkScheduleAttachment, FileAsset |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| InspectionSchedule | inspection-schedule-generation |
| InspectionRound | inspection-schedule-generation |
| InspectionTask | inspection-schedule-generation |
| InspectionOwnerReportTask | inspection-schedule-generation |
| Project | inspection-schedule-generation |
| Contract | inspection-schedule-generation |
| ProjectParty | inspection-schedule-generation |

## 7. 프롬프트 → 테스트

| 프롬프트 | 테스트 |
|---|---|
| inspection-schedule-generation | test_inspection_schedule_preview_success |
| inspection-schedule-generation | test_inspection_schedule_generate_10_rounds |
| inspection-schedule-generation | test_owner_report_tasks_generated |
| inspection-schedule-generation | test_missing_dates_are_not_invented |
| inspection-schedule-generation | test_existing_round_conflict_detected |

## 8. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 일정 미리보기 | test_inspection_schedule_preview_success |
| 미리보기 저장 방지 | test_inspection_schedule_preview_does_not_persist |
| 10회 생성 | test_inspection_schedule_generate_10_rounds |
| 회차 중복 방지 | test_inspection_round_no_unique_per_project |
| 문서번호 생성 | test_inspection_round_document_no_generation |
| 발주처별 업무 생성 | test_inspection_schedule_generates_owner_report_tasks |
| 별도보고 발주처 필터 | test_owner_report_task_created_only_for_separate_report_owner |
| 기본 업무 생성 | test_inspection_task_defaults_created |
| 일정 변경 이력 | test_inspection_reschedule_creates_log |
| 제출 상태 조건 | test_round_submitted_requires_all_owner_reports_submitted |
| 회차 종료 조건 | test_round_closed_requires_dependencies |
| 공사일정 첨부 | test_work_schedule_attachment_linked_to_round |
| 캘린더 조회 | test_calendar_returns_inspection_rounds |
| milestone 표시 | test_milestone_labels_are_exposed |

## 9. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ProjectParty, Contact |
| 계약/견적 | contractId, inspectionCount, payment milestone |
| 현장점검 체크리스트 | inspectionRoundId |
| 보고서 자동화 | inspectionRoundId, ownerPartyId |
| 지적사항/사진대지 | inspectionRoundId |
| 산업안전보건관리비 | inspectionRoundId 또는 ownerPartyId |
| 웹하드 | 회차별 폴더, 공사일정 첨부 |
| 메일함 | 일정 협의 메일, 제출 메일 |
| 결재/제출 | ownerReportTask, Submission |
| 대시보드 | 다음 점검, 미제출, 지연 상태 |

## 10. 리스크

| 리스크 | 대응 |
|---|---|
| 예정월과 실제 점검일 혼동 | plannedMonth, plannedDate, actualInspectionDate 분리 |
| 발주처별 보고서 업무 누락 | ProjectParty.requiresSeparateReport 기준 자동 생성 |
| 회차 중복 | projectId + roundNo unique |
| 일정 변경 추적 누락 | InspectionRescheduleLog 필수 |
| 점검 완료와 보고서 제출 완료 혼동 | round status와 ownerReportTask status 분리 |
| 일정 생성 preview가 바로 저장됨 | preview endpoint와 generate endpoint 분리 |
| 공사일정 첨부가 프로젝트 전체/회차별 중복 | WorkScheduleAttachment에서 inspectionRoundId optional |
| 문서번호 자동 생성 오류 | 사용자가 수정 가능한 documentNo 제공 |
