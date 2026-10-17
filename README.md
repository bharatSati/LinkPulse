# LinkPulse

A premium URL-shortener and analytics SaaS. Implemented so far:

1. **Foundation** — authentication, workspaces, and the full application shell.
2. **URL shortener & smart redirect engine** — link management, password protection,
   expiry/click limits, and device-based redirect rules.
3. **Click tracking & analytics** — per-click events, workspace and per-link dashboards
   with traffic, referrer, device, browser, and location breakdowns.

Remaining modules (campaigns, QR codes, bio pages, AI insights) are scaffolded as navigable
placeholders and will be implemented in subsequent prompts.

## Stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Frontend  | React + Vite, JavaScript (ESM), Tailwind CSS, React Router, Axios, Recharts, Lucide |
| Backend   | Node.js, Express, JavaScript (ESM), MongoDB + Mongoose, JWT, dotenv |

## Repository layout

```
LinkPulse/
├── backend/     Express API (routes, controllers, services, models, middleware, utils, config)
├── frontend/    React application (pages, components, layouts, context, hooks, services)
└── README.md
```

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- A running MongoDB instance (local or hosted, e.g. MongoDB Atlas)

---

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and set at least `MONGODB_URI` and `JWT_SECRET`.

Run in development (auto-reload):

```bash
npm run dev
```

Run in production mode:

```bash
npm start
```

The API starts on `http://localhost:5000` and exposes the health check at
`http://localhost:5000/api/v1/health`.

### Backend environment variables

| Variable        | Description                                        | Example                              |
| --------------- | -------------------------------------------------- | ------------------------------------ |
| `PORT`          | HTTP port for the API                              | `5000`                               |
| `MONGODB_URI`   | MongoDB connection string                          | `mongodb://127.0.0.1:27017/linkpulse`|
| `JWT_SECRET`    | Secret used to sign JWTs                           | `a-long-random-string`               |
| `JWT_EXPIRES_IN`| JWT lifetime                                       | `7d`                                 |
| `FRONTEND_URL`  | Allowed CORS origin                                | `http://localhost:5173`              |
| `BACKEND_URL`   | Public base URL of the API                          | `http://localhost:5000`              |
| `IP_HASH_SALT`  | Salt for hashing visitor IPs (falls back to `JWT_SECRET`) | `a-long-random-string`         |
| `GROQ_API_KEY`  | Reserved for the upcoming AI Insights integration  | (empty)                              |
| `GROQ_MODEL`    | Reserved for the upcoming AI Insights integration  | `llama-3.1-8b-instant`               |

---

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

The default `.env` points to the local API:

```
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_PUBLIC_BASE_URL=http://localhost:5000
```

`VITE_PUBLIC_BASE_URL` is optional and only used to display short links. If omitted, the
short-link base is derived from the API origin. Set it when short links are served from a
different domain than the API.

Run the dev server:

```bash
npm run dev
```

Open `http://localhost:5173`.

Build for production:

```bash
npm run build
npm run preview
```

> Only `VITE_API_BASE_URL` is exposed to the browser. No backend secrets
> (`JWT_SECRET`, `MONGODB_URI`, `GROQ_API_KEY`, etc.) are ever included in frontend code.

---

## API overview (`/api/v1`)

| Method | Endpoint                          | Auth        | Description                       |
| ------ | --------------------------------- | ----------- | --------------------------------- |
| GET    | `/health`                         | Public      | Application and database status   |
| POST   | `/auth/register`                  | Public      | Create an account, returns JWT    |
| POST   | `/auth/login`                     | Public      | Authenticate, returns JWT         |
| POST   | `/auth/logout`                    | Bearer      | Acknowledge logout                |
| GET    | `/auth/me`                        | Bearer      | Current user                      |
| GET    | `/workspaces`                     | Bearer      | List the caller's workspaces      |
| POST   | `/workspaces`                     | Bearer      | Create a workspace                |
| GET    | `/workspaces/:workspaceId`        | Membership  | Workspace details + caller's role |
| POST   | `/workspaces/:id/members`         | admin+      | Add a member                      |
| PATCH  | `/workspaces/:id/members/:userId` | admin+      | Change a member role              |
| DELETE | `/workspaces/:id/members/:userId` | admin+      | Remove a member                   |
| GET    | `/links?workspaceId=...`          | viewer+     | List links in a workspace         |
| POST   | `/links`                          | editor+     | Create a short link               |
| GET    | `/links/:id`                      | viewer+     | Get link details                  |
| PATCH  | `/links/:id`                      | editor+     | Update a link                     |
| DELETE | `/links/:id`                      | editor+     | Delete a link                     |
| GET    | `/analytics/overview`             | viewer+     | Summary metrics for a date range  |
| GET    | `/analytics/clicks-over-time`     | viewer+     | Clicks/visitors over a time series |
| GET    | `/analytics/top-links`            | viewer+     | Most clicked links                |
| GET    | `/analytics/referrers`            | viewer+     | Traffic sources                   |
| GET    | `/analytics/devices`              | viewer+     | Device-type breakdown             |
| GET    | `/analytics/browsers`             | viewer+     | Browser and OS breakdown          |
| GET    | `/analytics/locations`            | viewer+     | Country/region breakdown          |
| GET    | `/analytics/links/:linkId`        | viewer+     | Combined analytics for one link   |

The list endpoint supports `filter` (`all`, `active`, `disabled`, `expired`, `protected`),
`search` (title, URL, or alias), and `page`/`limit` pagination.

Workspace roles, ordered from most to least privileged:
`owner`, `admin`, `editor`, `analyst`, `viewer`.

All responses share a consistent shape:

```json
{ "success": true, "message": "...", "data": {} }
```

```json
{ "success": false, "message": "...", "errors": [] }
```

---

## URL shortener & redirect engine (public)

Short links are served from the API origin (not under `/api/v1`):

| Method | Endpoint        | Description                                                        |
| ------ | --------------- | ------------------------------------------------------------------ |
| GET    | `/:shortCode`   | Resolve a short code or custom alias and redirect (HTTP 302)       |
| POST   | `/:shortCode`   | Submit a password for a protected link                             |

The engine resolves the link, then applies checks in order: existence, disabled status,
expiry, click limit, and password protection. Failures render themed HTML error pages for
browsers (`404` not found, `403` disabled, `410` expired, `429` limit reached) and JSON for
API clients that send `Accept: application/json` (or `?format=json`).

**Passwords.** A protected link shows a password page. On success the server issues a
short-lived (5 minute), signed unlock token as an `httpOnly` cookie and redirects — the
password is never placed in a URL or logged. JSON clients receive the token in the response
and may pass it back as `?token=...`. Link passwords are hashed with `scrypt`; account
passwords remain development-only plain text (see below).

**Redirect rules.** Links may define optional device rules (`mobile`, `tablet`, `desktop`)
plus a default fallback. If a matching rule exists it is used; otherwise the fallback is
used, and finally the original URL. Detection is User-Agent based; unknown devices use the
fallback. All destinations must be valid `http://` or `https://` URLs.

**Limits.** Click counts increment atomically with the limit and expiry evaluated in the
same operation, so concurrent requests can never exceed the configured limit. Rejected
requests are not counted.

---

## Click tracking & analytics

Every successful redirect records one `ClickEvent` (`backend/src/models/ClickEvent.js`) in the
background, after the atomic click has been claimed. Rejected redirects (not found, disabled,
expired, limit reached) and password-entry attempts are never counted — the event is only
written once a visitor actually reaches the destination. Client IPs are never stored: only a
salted SHA-256 `ipHash` is kept, and it falls back to `JWT_SECRET` when `IP_HASH_SALT` is unset.

Each event captures the referrer (host only, self-referrals become `Direct`), a parsed device
type, browser and operating system (from the User-Agent), and country/region **only when the
request passes through a CDN or proxy that forwards location headers** (`cf-ipcountry`,
`x-vercel-ip-country`, and similar). Raw IPs are not used for geolocation.

The dashboard (frontend `Analytics` page) offers 7/30/90-day presets plus a custom range and
renders summary cards, a clicks/visitors time series, top links, referrers, device, browser,
OS, and location breakdowns. It handles empty datasets gracefully and distinguishes "no
geographic data available" from "zero clicks". Opening analytics from the Links page scopes
the whole dashboard to a single link (`/app/analytics?link=<id>`). All analytics endpoints
support `from`, `to` (ISO dates, UTC), `workspaceId`, optional `linkId`, and `interval`
(`day`/`hour`); ranges are validated and capped at 731 days.

---

## Security notes

- `helmet` security headers and a CORS allow-list restricted to `FRONTEND_URL`.
- Rate limiting on all API routes, with a stricter limiter on authentication routes.
- Centralized validation, error handling, and a 404 handler for unknown API routes.
- **Development-only account password handling:** account passwords are currently stored and
  compared in plain text. This is intentional for the foundation release and must be replaced
  with a real hashing algorithm before any public deployment. All account password logic is
  isolated in `backend/src/services/auth.service.js`.
- Account and link passwords are excluded from API responses (model-level `toJSON` and an
  explicit serializer) and never logged.
- Link passwords are hashed with `scrypt` (`backend/src/utils/linkPassword.js`).
- Analytics store a salted hash of the visitor IP (never the raw address) and derive country
  only from trusted CDN/proxy headers.
- Short codes are generated collision-safe (random base-36 + uniqueness retries) and custom
  aliases are validated and reserved-word filtered. The redirect destination is never taken
  from an untrusted query parameter.

## Roadmap

1. **Foundation:** auth, workspaces, app shell, design system.
2. **URL shortener & redirects:** link management, device rules, password/limits.
3. **Click tracking & analytics:** click events, referrer/device/location breakdowns, dashboards.
4. Campaigns.
5. QR codes, bio pages.
6. AI insights (Groq integration).
