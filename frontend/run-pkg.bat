@echo off
cd /d "%~dp0"
call npm run lib:pkg
start "Esquire Explorer [pkg]" npm start
