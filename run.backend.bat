@echo off
REM Esquire frameworks (tm) - explorer/backend dev launcher
REM Copyright(c) 2001, 2026 mir0n^&co  www.mir0n.me
REM
REM Starts the BFF (Node.js Express) in watch mode on http://localhost:3000.
REM Assumes the existing service stack (Keycloak, gateway, Spring services)
REM is already running via "services\compose\compose.yaml".

setlocal
cd /d %~dp0backend

if not exist node_modules (
  echo [run.backend] node_modules missing; running npm install
  call npm install
  if errorlevel 1 (
    echo [run.backend] npm install failed
    exit /b 1
  )
)

REM Step 1 (split dev): browser stays at :4200; Vite proxies /auth + /api to :3000.
REM PUBLIC_BASE_URL controls KC redirect_uri and post-login Location -- both must be
REM the browser-visible host (4200) so the esq.sid cookie binds to the right origin.
set PUBLIC_BASE_URL=http://localhost:4200

echo [run.backend] starting on http://localhost:3000 (PUBLIC_BASE_URL=%PUBLIC_BASE_URL%)
npm run dev
endlocal