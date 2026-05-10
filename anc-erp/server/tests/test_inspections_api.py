import unittest

from fastapi.testclient import TestClient

from server.app.api.routes import (
    contract_repository,
    inspection_repository,
    project_repository,
)
from server.app.main import app


SAMPLE_PROJECT_ID = "project-sample-001"
SAMPLE_ROUND_ID = "round-sample-001"
SAMPLE_OWNER_REPORT_TASK_ID = "owner-report-task-001-01"


class InspectionRoutesTestCase(unittest.TestCase):
    def setUp(self) -> None:
        project_repository.__init__()
        contract_repository.__init__(project_repository)
        inspection_repository.__init__(project_repository, contract_repository)
        self.client = TestClient(app)

    def _create_project_with_owners(self, project_name: str = "점검 생성용 프로젝트") -> str:
        project_id = self.client.post(
            "/api/v1/projects",
            json={"projectName": project_name},
        ).json()["project"]["id"]
        self.client.post(
            f"/api/v1/projects/{project_id}/parties",
            json={
                "organizationId": "org-owner-001",
                "role": "owner",
                "requiresSeparateReport": True,
                "reportRecipient": True,
                "displayOrder": 1,
            },
        )
        self.client.post(
            f"/api/v1/projects/{project_id}/parties",
            json={
                "organizationId": "org-owner-002",
                "role": "owner",
                "requiresSeparateReport": True,
                "reportRecipient": True,
                "displayOrder": 2,
            },
        )
        return project_id

    def test_inspection_schedule_preview_success(self) -> None:
        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/inspection-schedules/preview",
            json={
                "contractId": "contract-sample-001",
                "scheduleName": "리움 점검 일정 preview",
                "basisType": "contract_period",
                "cycleText": "3개월 이내 1회",
                "totalRounds": 10,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["rounds"]), 10)
        self.assertTrue(response.json()["isDraft"])

    def test_inspection_schedule_preview_does_not_persist(self) -> None:
        before = self.client.get(f"/api/v1/projects/{SAMPLE_PROJECT_ID}/inspection-rounds").json()
        self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/inspection-schedules/preview",
            json={
                "contractId": "contract-sample-001",
                "scheduleName": "preview only",
                "basisType": "contract_period",
                "cycleText": "3개월 이내 1회",
                "totalRounds": 10,
            },
        )
        after = self.client.get(f"/api/v1/projects/{SAMPLE_PROJECT_ID}/inspection-rounds").json()

        self.assertEqual(len(before), len(after))

    def test_missing_dates_are_not_invented(self) -> None:
        project_id = self.client.post("/api/v1/projects", json={"projectName": "날짜 미확정 프로젝트"}).json()["project"]["id"]
        response = self.client.post(
            f"/api/v1/projects/{project_id}/inspection-schedules/preview",
            json={
                "scheduleName": "날짜 미확정 preview",
                "basisType": "manual",
                "cycleText": "3개월 이내 1회",
                "totalRounds": 2,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["rounds"][0]["plannedDate"])
        self.assertIsNone(response.json()["rounds"][0]["actualInspectionDate"])

    def test_inspection_schedule_generate_10_rounds(self) -> None:
        project_id = self._create_project_with_owners("10회 생성 테스트")
        response = self.client.post(
            f"/api/v1/projects/{project_id}/inspection-schedules/generate",
            json={
                "scheduleName": "10회 생성 테스트",
                "basisType": "manual",
                "cycleText": "3개월 이내 1회",
                "totalRounds": 10,
                "rounds": [
                    {"roundNo": index, "plannedMonth": f"2026-{index:02d}"}
                    for index in range(1, 11)
                ],
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["rounds"]), 10)

    def test_existing_round_conflict_detected(self) -> None:
        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/inspection-schedules/generate",
            json={
                "scheduleName": "기존 회차 충돌",
                "basisType": "manual",
                "cycleText": "3개월 이내 1회",
                "totalRounds": 1,
                "rounds": [{"roundNo": 1, "plannedMonth": "2026-12"}],
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("roundNo", response.json()["detail"])

    def test_inspection_round_no_unique_per_project(self) -> None:
        response = self.client.post(
            f"/api/v1/projects/{SAMPLE_PROJECT_ID}/inspection-rounds",
            json={"roundNo": 1, "plannedMonth": "2026-12"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("roundNo", response.json()["detail"])

    def test_inspection_round_document_no_generation(self) -> None:
        project_id = self.client.post("/api/v1/projects", json={"projectName": "회차 수동 생성"}).json()["project"]["id"]
        response = self.client.post(
            f"/api/v1/projects/{project_id}/inspection-rounds",
            json={"roundNo": 3, "plannedMonth": "2027-07"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["round"]["documentNo"], "제2027-03호")

    def test_inspection_schedule_generates_owner_report_tasks(self) -> None:
        project_id = self._create_project_with_owners("발주처 업무 생성")
        response = self.client.post(
            f"/api/v1/projects/{project_id}/inspection-schedules/generate",
            json={
                "scheduleName": "발주처 업무 생성",
                "basisType": "manual",
                "cycleText": "3개월 이내 1회",
                "totalRounds": 2,
                "rounds": [
                    {"roundNo": 1, "plannedMonth": "2026-01"},
                    {"roundNo": 2, "plannedMonth": "2026-04"},
                ],
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["ownerReportTasks"]), 4)

    def test_owner_report_task_created_only_for_separate_report_owner(self) -> None:
        project_id = self.client.post("/api/v1/projects", json={"projectName": "발주처 필터 테스트"}).json()["project"]["id"]
        self.client.post(
            f"/api/v1/projects/{project_id}/parties",
            json={"organizationId": "org-owner-001", "role": "owner", "requiresSeparateReport": True},
        )
        self.client.post(
            f"/api/v1/projects/{project_id}/parties",
            json={"organizationId": "org-owner-002", "role": "owner", "requiresSeparateReport": False},
        )
        response = self.client.post(
            f"/api/v1/projects/{project_id}/inspection-schedules/generate",
            json={
                "scheduleName": "owner filter",
                "basisType": "manual",
                "cycleText": "3개월 이내 1회",
                "totalRounds": 1,
                "rounds": [{"roundNo": 1, "plannedMonth": "2026-01"}],
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["ownerReportTasks"]), 1)

    def test_inspection_task_defaults_created(self) -> None:
        response = self.client.get(f"/api/v1/inspection-rounds/{SAMPLE_ROUND_ID}/tasks")

        self.assertEqual(response.status_code, 200)
        task_types = [item["taskType"] for item in response.json()]
        self.assertIn("report_draft", task_types)
        self.assertIn("owner_submission", task_types)

    def test_inspection_reschedule_creates_log(self) -> None:
        response = self.client.post(
            "/api/v1/inspection-rounds/round-sample-002/reschedule",
            json={"plannedDate": "2026-04-19", "reason": "발주처 요청"},
        )
        detail = self.client.get("/api/v1/inspection-rounds/round-sample-002").json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(detail["rescheduleLogs"]), 1)

    def test_confirm_round_date_updates_round(self) -> None:
        response = self.client.post(
            "/api/v1/inspection-rounds/round-sample-002/confirm-date",
            json={
                "plannedDate": "2026-04-19",
                "actualInspectionDate": "2026-04-19",
                "inspectorUserId": "user-inspector-002",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["round"]["plannedDate"], "2026-04-19")
        self.assertEqual(response.json()["round"]["status"], "scheduled")

    def test_owner_report_task_update_endpoint(self) -> None:
        response = self.client.patch(
            f"/api/v1/owner-report-tasks/{SAMPLE_OWNER_REPORT_TASK_ID}",
            json={"status": "review"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["ownerReportTask"]["status"], "review")

    def test_owner_report_task_link_document(self) -> None:
        response = self.client.post(
            f"/api/v1/owner-report-tasks/{SAMPLE_OWNER_REPORT_TASK_ID}/link-document",
            json={"documentInstanceId": "doc-sample-001"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["ownerReportTask"]["documentInstanceId"], "doc-sample-001")

    def test_owner_report_task_mark_exported(self) -> None:
        response = self.client.post(
            f"/api/v1/owner-report-tasks/{SAMPLE_OWNER_REPORT_TASK_ID}/mark-exported",
            json={"exportedFileId": "file-exported-001"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["ownerReportTask"]["status"], "exported")

    def test_owner_report_task_mark_submitted_preserves_submission_id(self) -> None:
        response = self.client.post(
            f"/api/v1/owner-report-tasks/{SAMPLE_OWNER_REPORT_TASK_ID}/mark-submitted",
            json={
                "submittedAt": "2026-01-30T10:00:00+09:00",
                "mailThreadId": "mail-thread-001",
                "submissionId": "submission-001",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["ownerReportTask"]["status"], "submitted")
        self.assertEqual(response.json()["ownerReportTask"]["submissionId"], "submission-001")

    def test_round_submitted_requires_all_owner_reports_submitted(self) -> None:
        response = self.client.patch(
            "/api/v1/inspection-rounds/round-sample-002",
            json={"status": "submitted"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("owner reports", response.json()["detail"])

    def test_round_closed_requires_dependencies(self) -> None:
        response = self.client.post("/api/v1/inspection-rounds/round-sample-002/close")

        self.assertEqual(response.status_code, 400)
        self.assertIn("dependency", response.json()["detail"])

    def test_work_schedule_attachment_linked_to_round(self) -> None:
        response = self.client.post(
            f"/api/v1/inspection-rounds/{SAMPLE_ROUND_ID}/attachments",
            json={
                "fileId": "file-asset-extra-001",
                "fileName": "추가공정표.pdf",
                "storagePath": "/sample/추가공정표.pdf",
                "attachmentType": "detail_schedule",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["attachment"]["inspectionRoundId"], SAMPLE_ROUND_ID)

    def test_generate_default_tasks_endpoint(self) -> None:
        project_id = self.client.post("/api/v1/projects", json={"projectName": "업무 생성 테스트"}).json()["project"]["id"]
        round_id = self.client.post(
            f"/api/v1/projects/{project_id}/inspection-rounds",
            json={"roundNo": 1, "plannedMonth": "2026-05"},
        ).json()["round"]["id"]
        response = self.client.post(f"/api/v1/inspection-rounds/{round_id}/tasks/generate-defaults")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()["tasks"]), 5)

    def test_calendar_returns_inspection_rounds(self) -> None:
        response = self.client.get("/api/v1/calendar/inspection-rounds?date_from=2026-01-01&date_to=2028-12-31")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()["rounds"]), 10)

    def test_calendar_returns_inspection_tasks(self) -> None:
        response = self.client.get("/api/v1/calendar/inspection-tasks?date_from=2026-01-01&date_to=2028-12-31")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()["tasks"]), 10)

    def test_milestone_labels_are_exposed(self) -> None:
        response = self.client.get(f"/api/v1/projects/{SAMPLE_PROJECT_ID}/inspection-rounds")

        self.assertEqual(response.status_code, 200)
        milestone_labels = [item["round"]["milestoneLabel"] for item in response.json() if item["round"]["milestoneLabel"]]
        self.assertIn("1차기성", milestone_labels)
        self.assertIn("준공금", milestone_labels)
