@echo off
rem Convenience shim: EntitySmoke against the LOCAL k8s deployment (hauberk-k8s.properties).
rem Requires the hauberk fat jar (`mvn -pl hauberk install`).
call "%~dp0hauberk.cmd" run entity-smoke --config hauberk-k8s.properties %*
