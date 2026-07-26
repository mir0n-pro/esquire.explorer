@echo off
cd /d "%~dp0"

rem Full-lifecycle CYCLE job against OKE (https://esquire.mir0n.pro). Mirrors e2e-oci.bat.
rem Usage: cycle-oci.bat [CYCLES] [PORT]   (CYCLES default 3, PORT default 443)

set CYCLES=%1
if "%CYCLES%"=="" set CYCLES=3
set PORT=%2
if "%PORT%"=="" set PORT=443
set BASE_URL=https://esquire.mir0n.pro:%PORT%

rem Token Relay spec (20) hits the gateway + KC DIRECTLY (not the BFF proxy), reading GATEWAY_URL /
rem KC_URL -- NOT BASE_URL. On OKE the relay is DISABLED by design (empty allowlists,
rem k8s-oci/values/gateway.yaml), so point it at the public OKE hosts AND skip it (RELAY_DISABLED),
rem exactly as the GHA validate does. Without these the spec silently falls back to
rem localhost:7070/8081 (a LOCAL docker gateway), so an "OKE" relay result would actually be local.
set GATEWAY_URL=https://api.esquire.mir0n.pro
set KC_URL=https://esquire.mir0n.pro/kc-auth
set RELAY_DISABLED=true

if not exist node_modules (
    call npm install
    call npx playwright install chromium
)
call npx playwright test --config cycle/playwright.config.ts
