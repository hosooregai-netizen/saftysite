from server.app.domain.models import ProjectAggregate
from server.app.repositories.project_repository import ProjectRepository


class BootstrapRepository:
    """Compatibility wrapper for bootstrap summary and audit tests."""

    def __init__(self, project_repository: ProjectRepository | None = None) -> None:
        self.project_repository = project_repository or ProjectRepository()

    def all(self) -> list[ProjectAggregate]:
        return self.project_repository.list_project_aggregates()
