# Esquire frameworks (tm) -- BFF (explorer/backend) multi-stage image.
# Build context MUST be the parent `explorer/` directory so this Dockerfile
# can reach both `backend/` and `frontend/`. Use:
#   docker build -f explorer/backend/Dockerfile -t esquire.backend explorer/
# Or the equivalent compose `build.context: ../../explorer`.

# ---------- Stage 1: build the Angular SPA ----------
FROM node:22-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build -- --configuration=production

# ---------- Stage 2: build the Node BFF ----------
FROM node:22-alpine AS build-backend
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY backend/ ./
RUN npm run build

# ---------- Stage 3: minimal runtime ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Production-only deps (no dev tooling, smaller image).
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
# Compiled BFF.
COPY --from=build-backend /app/backend/dist ./dist
# SPA assets baked in. spa.ts looks at "public" relative to cwd.
COPY --from=build-frontend /app/frontend/dist/client/browser ./public
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
