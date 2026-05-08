@echo off
REM Esquire frameworks (tm) - explorer/frontend dev launcher
REM Copyright(c) 2001, 2026 mir0n^&co  www.mir0n.me
REM
REM Starts ng serve on http://localhost:4200.
REM In dev the frontend talks to the BFF via proxy.conf.json:
REM   /api -> http://localhost:3000
REM   /auth -> http://localhost:3000

setlocal
cd /d %~dp0frontend

if not exist node_modules (
  echo [run.frontend] node_modules missing; running npm install
  call npm install
  if errorlevel 1 (
    echo [run.frontend] npm install failed
    exit /b 1
  )
)

echo [run.frontend] starting on http://localhost:4200
npm run start
endlocal