# RELIC Full-Stack Development Launcher
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "                STARTING RELIC FULL-STACK PLATFORM" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

Write-Host "`n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python backend/run.py"

Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "  Backend API:   http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)" -ForegroundColor White
Write-Host "  Web Portal:    http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "  Login Credentials:" -ForegroundColor Yellow
Write-Host "    Badge ID: OFFICER_007    Password: relic2026" -ForegroundColor White
Write-Host "    Badge ID: OFFICER_704    Password: relic2026" -ForegroundColor White
Write-Host "    Badge ID: admin          Password: admin" -ForegroundColor White
Write-Host "============================================================================`n" -ForegroundColor Cyan

