| ![Alt text](../favicon.ico) | Esquire Frameworks(tm) 2.0 |
|----------------------------|---------------------------|

# Esquire Backend (BFF tier)

Node.js Backend-for-Frontend tier introduced in v1.2.3. Sits between `explorer/frontend` (Angular SPA) and the Spring Cloud Gateway. Owns:

- OIDC auth flow with Keycloak as a confidential client (`esq-backend`); tokens held server-side, browser sees only an HttpOnly session cookie.
- JWE access-token forwarding to the gateway (which decrypts and relays plain JWS to Spring services).
- In-memory LRU cache for static entity dictionaries (`/api/esq-dict`, `/api/esq-kinds`).
- Static SPA serving from `frontend/dist` (Step 2+).

See [`services/doc/BFF.md`](../../services/doc/BFF.md) for the full plan.

## Run locally

```bash
cd explorer/backend
npm install
npm run dev
# listens on http://localhost:3000
```

Smoke test:

```bash
curl http://localhost:3000/healthz
# {"status":"ok"}
```

## Environment variables

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP listen port |
| `NODE_ENV` | `development` | Toggles `Secure` cookie flag and verbose errors |
| `PUBLIC_BASE_URL` | `http://localhost:3000` | Used in OIDC redirect URIs |
| `KC_ISSUER` | `http://localhost:8080/kc-auth/realms/esquire` | Keycloak realm issuer |
| `KC_CLIENT_ID` | `esq-backend` | Confidential KC client |
| `KC_CLIENT_SECRET` | (required in prod) | KC client secret |
| `GATEWAY_URL` | `http://localhost:7070` | Spring Cloud Gateway |
| `SESSION_SECRET` | (required in prod) | express-session signing secret |
| `SESSION_MAX_AGE_MS` | `43200000` (12h) | Cookie maxAge |
| `ESQ_DICT_CACHE_TTL_MS` | `3600000` (1h) | Dictionary cache TTL |
| `ESQ_DICT_CACHE_MAX` | `64` | LRU cache max entries |

## Tests

```bash
npm test
```

Vitest + supertest. See `test/` for unit tests covering auth flow, cache hit/miss, refresh-on-expiry.
