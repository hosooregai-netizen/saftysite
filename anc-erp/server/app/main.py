from fastapi import FastAPI

from server.app.api.routes import router
from server.app.core.config import settings

app = FastAPI(title=settings.app_name, version=settings.version)
app.include_router(router)
