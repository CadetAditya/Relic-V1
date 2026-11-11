@echo off
echo ============================================================================
echo                     STARTING RELIC FULL-STACK PLATFORM
echo ============================================================================
echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "RELIC Backend API" cmd /k "python backend/run.py"

echo [2/2] Launching React Vite Frontend on http://localhost:5173 ...
start "RELIC Frontend" cmd /k "cd frontend && npm run dev"

echo ============================================================================
echo   Backend API:   http://127.0.0.1:8000 (Swagger docs at /docs)
echo   Web Portal:    http://localhost:5173
echo.
echo   Login ID:      OFFICER_007   Password: relic2026
echo   Admin ID:      admin         Password: admin
echo ============================================================================
pause

