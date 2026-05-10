from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str = "anc-erp-server"
    version: str = "0.1.0"
    root_entity: str = "Project"


settings = Settings()
