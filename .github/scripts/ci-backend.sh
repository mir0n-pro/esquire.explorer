#!/usr/bin/env bash
#
# Esquire explorer -- backend (BFF) CI (Node 22, TypeScript, vitest). Called by .github/workflows/ci.yml.
# Runnable locally from the repo root: bash .github/scripts/ci-backend.sh
# Design: doc/Esquire.GitHubActions.md (services repo).
#
set -euo pipefail
cd backend

echo "--- npm ci"
npm ci

echo "--- lint (tsc --noEmit)"
npm run lint

echo "--- build (tsc -> dist)"
npm run build

echo "--- test (vitest run)"
npm test
