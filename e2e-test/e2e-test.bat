@echo off
cd /d "%~dp0"

rem Usage: e2e-test.bat [PORT]
rem   PORT 4200 (default) -- Docker setup
rem   PORT 80             -- K8s setup

set PORT=%1
if "%PORT%"=="" set PORT=4200

set BASE_URL=http://localhost:%PORT%

if not exist node_modules (
    call npm install
    call npx playwright install chromium
)
call npm test
