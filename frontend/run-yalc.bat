@echo off
cd /d "%~dp0"
call npm run lib:yalc
start "Esquire Explorer [yalc]" npm start
