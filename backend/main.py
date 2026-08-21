"""FastAPI application entry point for CloudSentinel."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend import models
from backend.routes import reports, tests

app = FastAPI(title="CloudSentinel", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.include_router(tests.router)
app.include_router(reports.router)


@app.on_event("startup")
def startup() -> None:
    models.initialize_database()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "CloudSentinel API"}
