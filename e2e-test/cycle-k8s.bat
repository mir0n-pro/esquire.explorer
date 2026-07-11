@echo off
cd /d "%~dp0"

rem Full-lifecycle CYCLE job against the LOCAL K8S deployment (ingress-nginx + MetalLB),
rem SPA+BFF on http://esquire.localhost (port 80). Mirrors e2e-k8s.bat.
rem Usage: cycle-k8s.bat [CYCLES]   (default 3)
rem Prerequisite: hosts file maps esquire.localhost -> 127.0.0.1

set CYCLES=%1
if "%CYCLES%"=="" set CYCLES=3
set BASE_URL=http://esquire.localhost

if not exist node_modules (
    call npm install
    call npx playwright install chromium
)
call npx playwright test --config cycle/playwright.config.ts
