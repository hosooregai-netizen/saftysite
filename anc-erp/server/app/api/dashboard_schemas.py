from pydantic import BaseModel


class DashboardWidgetPayload(BaseModel):
    title: str
    widgetType: str
    route: str
    scope: str | None = None
    projectId: str | None = None
    ownerPartyId: str | None = None
    displayOrder: int | None = None
    settings: dict | None = None
    enabled: bool | None = None


class DashboardWidgetUpdatePayload(BaseModel):
    title: str | None = None
    widgetType: str | None = None
    route: str | None = None
    scope: str | None = None
    projectId: str | None = None
    ownerPartyId: str | None = None
    displayOrder: int | None = None
    settings: dict | None = None
    enabled: bool | None = None


class DashboardWidgetsReorderPayload(BaseModel):
    widgetIds: list[str]


class AlertRulePayload(BaseModel):
    ruleKey: str
    name: str
    description: str
    severity: str
    enabled: bool | None = None
    threshold: float | int | None = None
    scope: str | None = None


class AlertRuleUpdatePayload(BaseModel):
    name: str | None = None
    description: str | None = None
    severity: str | None = None
    enabled: bool | None = None
    threshold: float | int | None = None
    scope: str | None = None


class DashboardInsightPayload(BaseModel):
    projectId: str | None = None
