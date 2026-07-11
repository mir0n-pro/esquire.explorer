@echo off
cd /d "%~dp0"

rem Gently stop a running cycle job: writes the marker cycle\.stop, which each lap checks at its start.
rem The in-flight lap finishes and tears down its own test entities; no new lap begins; the run ends
rem cleanly (logoff). Equivalent to a single Ctrl-C, but reliable regardless of terminal focus.
type nul > "%~dp0cycle\.stop"
echo Stop requested -- the cycle will finish the current lap (with teardown) and then end.
