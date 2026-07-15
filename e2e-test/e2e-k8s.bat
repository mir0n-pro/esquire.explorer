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
rem Token Relay spec (20) calls the gateway + KC DIRECTLY (not the BFF proxy); point it at the k8s ingress.
set GATEWAY_URL=http://api.esquire.localhost
set KC_URL=http://esquire.localhost/kc-auth

if not exist node_modules (
    call npm install
    call npx playwright install chromium
)
call npm test
