@echo off
cd /d "%~dp0"
call npm run lib:git
start "Esquire Explorer [git]" npm start
