@echo off
rem Multi-stage Dockerfile builds frontend + backend internally; nothing to
rem prebuild on the host. compose.yaml sets build context to the parent
rem explorer/ directory so the Dockerfile can reach both backend/ and frontend/.
docker compose build

rem #docker compose stop
rem #docker compose start -d
rem #docker compose exec <service> <command>
rem #docker compose run <service> <command>
rem #docker compose build
rem #docker compose up --build -d
