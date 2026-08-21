"""FastAPI application entry point for CloudSentinel."""

from fastapi import FastAPI

from backend import models
from backend.routes import reports, tests

app = FastAPI(title="CloudSentinel", version="0.1.0")
app.include_router(tests.router)
app.include_router(reports.router)


@app.on_event("startup")
def startup() -> None:
    models.initialize_database()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "CloudSentinel API"}
