@echo off
REM Esquire frameworks (tm) - explorer dev launcher (backend + frontend)
REM Copyright(c) 2001, 2026 mir0n^&co  www.mir0n.me
REM
REM Opens backend and frontend each in its own console window so logs stay
REM separate. Close either window to stop that side.
REM
REM Backend:  http://localhost:3000  (BFF, /api, /auth, /healthz)
REM Frontend: http://localhost:4200  (ng serve, proxies /api and /auth to BFF)

start "esquire-backend"  cmd /k "%~dp0run.backend.bat"
start "esquire-frontend" cmd /k "%~dp0run.frontend.bat"

echo Both launched in separate windows.
echo   Backend  - http://localhost:3000
echo   Frontend - http://localhost:4200