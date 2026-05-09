# Esquire frameworks (tm) -- Angular dev container.
# Runs `ng serve` with a docker-specific proxy config that forwards /api and
# /auth to the backend service (esq-backend:3000). Used only for live-reload
# dev iteration inside compose; production deploys bake frontend/dist into
# the backend image (see backend/Dockerfile).
FROM node:22
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . ./
EXPOSE 4200
# CMD lives in compose.yaml so the proxy config + flags can be overridden.
