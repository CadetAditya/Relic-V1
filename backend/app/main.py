from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router
from app.services.data_service import DataService
from app.services.ml_service import MLInferenceService


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: preload data tables and model into memory
    print(f"[*] Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    data_svc = DataService.get_instance()
    ml_svc = MLInferenceService.get_instance()
    print("[*] Preloaded Data & ML Services successfully.")
    yield
    print("[*] Shutting down RELIC backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Operational REST API forecasting likely ATM cash extraction locations for cybercrime complaints.",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "endpoints": {
            "predict": f"{settings.API_V1_STR}/predict",
            "complaints": f"{settings.API_V1_STR}/complaints",
            "accounts": f"{settings.API_V1_STR}/accounts",
            "atms": f"{settings.API_V1_STR}/atms",
            "stats": f"{settings.API_V1_STR}/stats",
        },
    }


@app.get("/health", tags=["Health Check"])
def health():
    return {"status": "healthy"}

