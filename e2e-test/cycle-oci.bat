@echo off
cd /d "%~dp0"

rem Full-lifecycle CYCLE job against OKE (https://esquire.mir0n.pro). Mirrors e2e-oci.bat.
rem Usage: cycle-oci.bat [CYCLES] [PORT]   (CYCLES default 3, PORT default 443)

set CYCLES=%1
if "%CYCLES%"=="" set CYCLES=3
set PORT=%2
if "%PORT%"=="" set PORT=443
set BASE_URL=https://esquire.mir0n.pro:%PORT%

if not exist node_modules (
    call npm install
    call npx playwright install chromium
)
call npx playwright test --config cycle/playwright.config.ts
