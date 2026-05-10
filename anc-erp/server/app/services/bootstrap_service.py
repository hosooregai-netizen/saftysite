from server.app.repositories.bootstrap_repository import BootstrapRepository


class BootstrapService:
    def __init__(self, repository: BootstrapRepository) -> None:
        self.repository = repository

    def get_summary(self) -> dict:
        aggregate = self.repository.all()[0]
        inspection_round = aggregate.inspectionRounds[0]
        document_id = (
            inspection_round.documentInstances[0].id
            if inspection_round.documentInstances
            else "doc-sample-001"
        )

        return {
            "rootEntity": "Project",
            "hierarchy": {
                "Project": [
                    "ProjectParty",
                    "Contact",
                    "Contract",
                    "Estimate",
                    "InspectionRound",
                    "DocumentInstance",
                    "Project-linked FileAsset",
                    "Project-linked MailThread",
                    "ActivityLog",
                ],
                "InspectionRound": [
                    "ChecklistSession",
                    "ChecklistResult",
                    "Finding",
                    "CorrectiveAction",
                    "EvidencePhoto",
                    "PhotoLedger",
                    "SafetyCostUsage",
                    "InspectionOwnerReportTask",
                ],
                "DocumentInstance": [
                    "DocumentSection",
                    "PhotoLedger section",
                    "SafetyCost section",
                    "ApprovalWorkflow",
                    "SignatureTask",
                    "FinalDocumentPackage",
                    "Submission",
                ],
            },
            "sampleIds": {
                "projectId": aggregate.id,
                "inspectionRoundId": inspection_round.id,
                "documentId": document_id,
            },
        }
