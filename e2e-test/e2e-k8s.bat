@echo off
cd /d "%~dp0"

rem Runs the Playwright e2e suite against the LOCAL k8s deployment
rem (Docker Desktop + ingress-nginx + MetalLB), which mirrors OKE's shape:
rem the SPA + BFF answer on http://esquire.localhost/ (port 80 via ingress).
rem
rem Prerequisite: hosts file maps esquire.localhost -> 127.0.0.1
rem   (one line: 127.0.0.1   esquire.localhost   api.esquire.localhost)
rem
rem Mirrors e2e-oci.bat (which hits https://esquire.mir0n.pro).

set BASE_URL=http://esquire.localhost

if not exist node_modules (
    call npm install
    call npx playwright install chromium
)
call npm test
