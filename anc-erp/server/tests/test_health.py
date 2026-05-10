import unittest

from fastapi.testclient import TestClient

from server.app.main import app


class HealthRoutesTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_health_endpoint_returns_bootstrap_metadata(self) -> None:
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "status": "ok",
                "service": "anc-erp-server",
                "rootEntity": "Project",
                "version": "0.1.0",
            },
        )

    def test_bootstrap_summary_preserves_root_containment(self) -> None:
        response = self.client.get("/api/v1/bootstrap/summary")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["rootEntity"], "Project")
        self.assertIn("InspectionRound", payload["hierarchy"]["Project"])
        self.assertIn("DocumentSection", payload["hierarchy"]["DocumentInstance"])
        self.assertEqual(payload["sampleIds"]["projectId"], "project-sample-001")
