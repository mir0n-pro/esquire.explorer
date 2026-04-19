@echo off
rem cd /d "%~dp0e2e-test"
if not exist node_modules (
    call npm install
    call npx playwright install chromium
)
call npm test
pause
