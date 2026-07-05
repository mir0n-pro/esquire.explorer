@echo off
rem Convenience shim: 5 sequential EntitySmoke runs.
rem Requires the hauberk fat jar (`mvn -pl hauberk install`).
call "%~dp0hauberk.cmd" run entity-smoke --times 5 %*
