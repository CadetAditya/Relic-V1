import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.api.v1.router import api_router
from app.services.data_service import DataService
from app.services.ml_service import MLInferenceService


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize SQLite database schema and seeds
    print(f"[*] Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    from app.db.session import init_db
    init_db()
    data_svc = DataService.get_instance()
    ml_svc = MLInferenceService.get_instance()
    print("[*] Preloaded Relic Database, Data & ML Services successfully.")
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


@app.get("/health", tags=["Health Check"])
def health():
    return {"status": "healthy"}


# Mount Frontend Production Static Files (Unified Full-Stack Deployment)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")

if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", tags=["Frontend SPA"])
    async def serve_spa(full_path: str):
        # Pass through API calls, Swagger docs, and health checks
        if full_path.startswith("api") or full_path.startswith("docs") or full_path == "openapi.json" or full_path == "health":
            raise HTTPException(status_code=404, detail="Not Found")

        target_file = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)

        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
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


