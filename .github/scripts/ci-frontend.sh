#!/usr/bin/env bash
#
# Esquire explorer -- frontend CI (Angular 20). Called by .github/workflows/ci.yml.
# Runnable locally from the repo root: bash .github/scripts/ci-frontend.sh
# Design: doc/Esquire.GitHubActions.md (services repo).
#
set -euo pipefail
cd frontend

# @mir0n-pro/esquire.ui is declared as a PUBLIC github raw tarball URL, so npm fetches it directly
# (the @mir0n-pro:registry line in .npmrc only applies to version-resolved scoped packages, not URLs)
# -> no auth needed. If a future scoped dep is added by version, give this job `packages: read` +
# an NODE_AUTH_TOKEN .npmrc line.
echo "--- npm ci"
npm ci

echo "--- ng build"
npm run build

# angular.json already pins browsers=ChromeHeadless; ubuntu-latest ships Chrome. --watch=false for CI.
# If Chrome fails with a sandbox error in CI, add a ChromeHeadlessNoSandbox custom launcher (karma.conf).
echo "--- ng test (headless, no watch)"
npm test -- --watch=false --browsers=ChromeHeadless
