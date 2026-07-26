@echo off
cd /d "%~dp0"

rem Full-lifecycle CYCLE job against the LOCAL DOCKER stack (SPA+BFF on :4200).
rem Usage: cycle-test.bat [CYCLES] [PORT]
rem   CYCLES  number of full lifecycles per run (default 3)
rem   PORT    4200 (default, docker)
rem Watch it "in action": Grafana http://localhost:3009 (o11y profile on) -- the traces + the
rem "Esquire Services" dashboard light up as every service is exercised each lap.

set CYCLES=%1
if "%CYCLES%"=="" set CYCLES=3
set PORT=%2
if "%PORT%"=="" set PORT=4200
set BASE_URL=http://localhost:%PORT%

if not exist node_modules (
    call npm install
    call npx playwright install chromium
)
call npx playwright test --config cycle/playwright.config.ts
