@echo off
cd /d "%~dp0"
call npm run lib:local
start "Esquire Explorer [local]" npm start
