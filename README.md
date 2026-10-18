# LinkPulse

A premium URL-shortener and analytics SaaS. Implemented so far:

1. **Foundation** — authentication, workspaces, and the full application shell.
2. **URL shortener & smart redirect engine** — link management, password protection,
   expiry/click limits, and device-based redirect rules.
3. **Click tracking & analytics** — per-click events, workspace and per-link dashboards
   with traffic, referrer, device, browser, and location breakdowns.
4. **Campaigns & link organization** — campaigns with scheduling, workspace tags, link
   filtering by campaign/tag, and per-campaign analytics.
5. **QR codes & bulk CSV import** — customizable, downloadable QR codes for every short
   link, plus validated bulk link creation from CSV uploads.
6. **Link-in-bio pages** — public, customizable link-in-bio pages at `/bio/:username` with a
   dashboard editor and live preview.
7. **Groq AI insights & recommendations** — AI-generated performance insights, optimization
   recommendations, rule-based anomaly detection, and a natural-language analytics assistant.
8. **Team management & admin controls** — invitations, member/role management, ownership
   transfer, centralized role permissions, workspace settings, and an administrative audit trail.
9. **Security, abuse detection & notifications** — deterministic abuse-detection rules, visitor
   reporting, an admin abuse console with link enforcement, an in-app notification centre, and
   request/rate-limit hardening.

All planned modules are implemented; the codebase remains structured for future additions.

## Stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Frontend  | React + Vite, JavaScript (ESM), Tailwind CSS, React Router, Axios, Recharts, Lucide |
| Backend   | Node.js, Express, JavaScript (ESM), MongoDB + Mongoose, JWT, dotenv, `qrcode`, `multer`, `csv-parse`, `groq-sdk` |

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
| `IMPORT_MAX_FILE_MB` | Maximum CSV upload size in megabytes          | `2`                                  |
| `IMPORT_MAX_ROWS`    | Maximum rows accepted in a single CSV import  | `1000`                               |
| `LOG_LEVEL`     | Console verbosity: `error`, `warn`, `info`, `debug`. Only startup and real errors show at the default `info`; successful requests are never logged. | `info` |
| `GROQ_API_KEY`  | Groq API key. AI features are disabled (rule-based insights only) when empty | `gsk_...`             |
| `GROQ_MODEL`    | Groq chat model used for generation                | `llama-3.3-70b-versatile`            |
| `GROQ_TIMEOUT_MS` | Per-request timeout for Groq calls               | `20000`                              |
| `AI_INSIGHTS_TTL_MINUTES` | How long a generated insight is reused before regeneration | `30`                     |
| `AI_HISTORY_DAYS` | Days generated insights are retained for `GET /ai/history` | `60`                        |
| `AI_QUESTION_MAX_LENGTH` | Maximum accepted natural-language question length | `300`                           |
| `GROQ_BASE_URL` | Optional override of the Groq API base URL (proxies/self-hosting). Read natively by `groq-sdk`. | `https://api.groq.com` |
| `INVITATION_TTL_DAYS` | Days a workspace invitation token stays valid before expiring | `7` |
| `SMTP_HOST` | SMTP server host for invitation emails (Nodemailer). Delivery is disabled when empty. | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_SECURE` | `true` for implicit TLS (port 465), `false` for STARTTLS | `false` |
| `SMTP_USER` | SMTP username (omit for unauthenticated local servers like Mailpit) | `you@gmail.com` |
| `SMTP_PASS` | SMTP password / app password | `****` |
| `MAIL_FROM` | Sender address for invitation emails | `LinkPulse <no-reply@yourdomain.com>` |
| `MAIL_REPLY_TO` | Optional reply-to address for invitation emails | *(empty)* |
| `SECURITY_EVENT_RETENTION_DAYS` | Days security events are retained (TTL index) | `90` |
| `NOTIFICATION_RETENTION_DAYS` | Days notifications are retained (TTL index) | `180` |
| `ABUSE_AUTO_DISABLE` | Allow rules to disable a link automatically (never triggered by traffic volume alone) | `false` |
| `ABUSE_ALERT_COOLDOWN_MINUTES` | Minimum minutes between repeat alerts for the same link/source | `15` |
| `ABUSE_LINK_CREATION_MAX` / `ABUSE_LINK_CREATION_WINDOW_MINUTES` | Link-creation burst threshold per workspace | `20` / `10` |
| `ABUSE_SOURCE_REQUEST_MAX` / `ABUSE_SOURCE_REQUEST_WINDOW_SECONDS` | Per-source request burst (hashed IP) | `150` / `60` |
| `ABUSE_CLICK_SPIKE_MULTIPLIER` / `ABUSE_CLICK_SPIKE_MIN_CLICKS` / `ABUSE_CLICK_SPIKE_WINDOW_MINUTES` | Click-spike rule thresholds | `8` / `30` / `10` |
| `ABUSE_PASSWORD_FAIL_MAX` / `ABUSE_PASSWORD_FAIL_WINDOW_MINUTES` | Repeated failed password attempts rule | `10` / `15` |
| `ABUSE_DESTINATION_RISK_SCORE` | Risk score at/above which a link destination is flagged | `50` |
| `ABUSE_REPORT_THROTTLE_MINUTES` | Minutes a visitor may not file duplicate reports for the same link | `60` |

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

### Marketing landing page

The public landing page is served at `/` (`frontend/src/pages/Landing.jsx`) and is the entry
point for logged-out visitors; authenticated visitors see a **Dashboard** link in its nav.
It walks through every product capability — smart links, campaigns, analytics, QR codes, bio
pages, AI insights, team permissions, and security — with a purpose and a "why it matters"
for each, plus flagship deep-dives, a "why LinkPulse" section, a how-it-works flow, and a
security band.

The page leans into the theme with interactive 3D: a large rotating wireframe globe that fills
the hero's right column, rendered on a `<canvas>` (`components/landing/WireframeObject.jsx`) with
a glowing core, orbiting tick rings, animated data arcs with travelling packets, and drifting
particles — sized so the whole composition stays inside the canvas bounds (nothing is clipped at
the edges); mouse-tilted depth
cards (`components/landing/TiltCard.jsx`); and a perspective grid floor
(`components/landing/PerspectiveGrid.jsx`). Copy and feature data live in
`frontend/src/config/landingContent.js`. The canvas loop is frame-rate independent,
clamps its per-frame delta (so a non-monotonic animation timestamp can never drive it
negative), clamps arc sample indices to the path, and fully respects
`prefers-reduced-motion`.

### Visual design — cyber-terminal

The UI is themed as a sleek cyber-terminal. The look is driven entirely by tokens, so it
applies consistently across every page and component:

- **Fonts** — `JetBrains Mono` (body/UI/data) and `Chakra Petch` (headings, logo), loaded from
  Google Fonts in `frontend/index.html`. Base size is `16px`.
- **Palette** — dark olive `base` backgrounds, light green-tinted `ink` text, a bright
  yellow-green (lime) `accent`, a `citrus` yellow secondary, plus amber `warn` and red
  `danger` in `frontend/tailwind.config.js`. Key CTAs and accents use a lime→citrus gradient
  (`bg-accent-gradient`, `.text-gradient`).
- **Shape** — hard edges (all corner radii are `0` except `rounded-full`), chunky `2px`
  borders, and offset pixel/neon shadows (`shadow-panel`, `shadow-glow`). Disabled buttons
  switch to a neutral, readable state instead of fading to near-invisible.
- **Terminal details** — scanline + aurora background, subtle text glow, gradient hairlines,
  animated shimmer text, and stepped (non-eased) UI animations in `frontend/src/index.css`.

Bio pages (`/b/:username`) are user-styled and intentionally opt out of the display font,
so creators can build their own look.

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
| GET    | `/workspaces/:workspaceId`        | Membership  | Workspace details + caller's role + permissions |
| PATCH  | `/workspaces/:workspaceId`        | admin+      | Update workspace settings (name)  |
| DELETE | `/workspaces/:workspaceId`        | owner       | Delete a workspace (confirmation required) |
| GET    | `/workspaces/:id/overview`        | viewer+     | Member/resource counts (+ activity for admins) |
| GET    | `/workspaces/:id/members`         | viewer+     | List members with roles and join dates |
| POST   | `/workspaces/:id/members`         | admin+      | Add an existing user directly     |
| PATCH  | `/workspaces/:id/members/:userId` | admin+      | Change a member role              |
| DELETE | `/workspaces/:id/members/:userId` | admin+      | Remove a member                   |
| POST   | `/workspaces/:id/transfer`        | owner       | Transfer workspace ownership      |
| POST   | `/workspaces/:id/leave`           | viewer+     | Leave a workspace (owner must transfer first) |
| GET    | `/workspaces/:id/invitations`     | admin+      | List invitations with status      |
| POST   | `/workspaces/:id/invitations`     | admin+      | Invite a member by email          |
| POST   | `/workspaces/:id/invitations/:invitationId/resend` | admin+ | Resend/renew an invitation |
| DELETE | `/workspaces/:id/invitations/:invitationId` | admin+ | Revoke an invitation        |
| GET    | `/workspaces/:id/audit`           | admin+      | Administrative activity history   |
| GET    | `/invitations/:token`             | Public      | Preview an invitation (masked email) |
| POST   | `/invitations/accept`             | Bearer      | Accept an invitation by token     |
| POST   | `/invitations/reject`             | Bearer      | Decline an invitation by token    |
| GET    | `/links?workspaceId=...`          | viewer+     | List links in a workspace         |
| POST   | `/links`                          | editor+     | Create a short link               |
| GET    | `/links/:id`                      | viewer+     | Get link details                  |
| PATCH  | `/links/:id`                      | editor+     | Update a link                     |
| DELETE | `/links/:id`                      | editor+     | Delete a link                     |
| GET    | `/links/:id/qr`                   | viewer+     | Generate a QR code for a link     |
| POST   | `/links/:id/qr`                   | editor+     | Generate + persist QR styling     |
| GET    | `/links/import/template`          | viewer+     | Download the CSV import template  |
| POST   | `/links/import`                   | editor+     | Upload and process a CSV file     |
| GET    | `/links/import/:importId`         | viewer+     | Retrieve a stored import result   |
| GET    | `/analytics/overview`             | viewer+     | Summary metrics for a date range  |
| GET    | `/analytics/clicks-over-time`     | viewer+     | Clicks/visitors over a time series |
| GET    | `/analytics/top-links`            | viewer+     | Most clicked links                |
| GET    | `/analytics/referrers`            | viewer+     | Traffic sources                   |
| GET    | `/analytics/devices`              | viewer+     | Device-type breakdown             |
| GET    | `/analytics/browsers`             | viewer+     | Browser and OS breakdown          |
| GET    | `/analytics/locations`            | viewer+     | Country/region breakdown          |
| GET    | `/analytics/links/:linkId`        | viewer+     | Combined analytics for one link   |
| GET    | `/campaigns?workspaceId=...`      | viewer+     | List campaigns (with metrics)     |
| POST   | `/campaigns`                      | editor+     | Create a campaign                 |
| GET    | `/campaigns/:id`                  | viewer+     | Campaign details + caller's role  |
| PATCH  | `/campaigns/:id`                  | owner/admin/editor | Update a campaign          |
| DELETE | `/campaigns/:id`                  | owner/admin/editor | Delete a campaign          |
| GET    | `/campaigns/:id/links`            | viewer+     | Links belonging to a campaign     |
| GET    | `/campaigns/:id/analytics`        | viewer+     | Combined analytics for a campaign |
| GET    | `/tags?workspaceId=...`           | viewer+     | List workspace tags               |
| POST   | `/tags`                           | editor+     | Create a tag                      |
| PATCH  | `/tags/:id`                       | editor+     | Rename a tag                      |
| DELETE | `/tags/:id`                       | editor+     | Delete a tag                      |
| GET    | `/bio-pages?workspaceId=...`      | viewer+     | List bio pages in a workspace     |
| POST   | `/bio-pages`                      | editor+     | Create a bio page                 |
| GET    | `/bio-pages/check-username`       | Bearer      | Check username availability       |
| GET    | `/bio-pages/:id`                  | viewer+     | Bio page details + caller's role  |
| PATCH  | `/bio-pages/:id`                  | editor+     | Update a bio page                 |
| PATCH  | `/bio-pages/:id/publish`          | editor+     | Publish or unpublish a bio page   |
| DELETE | `/bio-pages/:id`                  | editor+     | Delete a bio page                 |
| GET    | `/public/bio/:username`           | Public      | Render a published bio page       |
| GET    | `/ai/insights?workspaceId=...`    | viewer+     | Retrieve or generate current insights |
| POST   | `/ai/ask`                         | viewer+     | Answer a natural-language analytics question |
| POST   | `/ai/recommendations`             | viewer+     | Generate optimization recommendations |
| GET    | `/ai/history?workspaceId=...`     | viewer+     | List previously saved generations |
| GET    | `/notifications?workspaceId=...`  | Bearer      | List the caller's notifications   |
| GET    | `/notifications/unread-count`     | Bearer      | Unread notification count         |
| POST   | `/notifications/:id/read`         | Bearer      | Mark one notification as read     |
| POST   | `/notifications/read-all`         | Bearer      | Mark all (optionally per-workspace) as read |
| POST   | `/abuse/reports`                  | Public      | Report a short link for abuse (rate-limited) |
| GET    | `/workspaces/:id/abuse/summary`   | admin+      | Abuse console counters            |
| GET    | `/workspaces/:id/abuse/links`     | admin+      | Suspicious links (events + reports) |
| GET    | `/workspaces/:id/abuse/links/:linkId` | admin+  | Inspect one link's risk and history |
| POST   | `/workspaces/:id/abuse/links/:linkId/disable`    | admin+ | Disable a link |
| POST   | `/workspaces/:id/abuse/links/:linkId/reactivate` | admin+ | Reactivate a link |
| GET    | `/workspaces/:id/abuse/events`    | admin+      | Security events (status/severity filters) |
| PATCH  | `/workspaces/:id/abuse/events/:eventId` | admin+ | Review a security event      |
| GET    | `/workspaces/:id/abuse/reports`   | admin+      | Visitor abuse reports             |
| GET    | `/workspaces/:id/abuse/reports/:reportId` | admin+ | Report detail             |
| PATCH  | `/workspaces/:id/abuse/reports/:reportId` | admin+ | Review a report             |

The links list endpoint supports `filter` (`all`, `active`, `disabled`, `expired`, `protected`),
`search` (title, URL, or alias), `campaignId` (`none` for unassigned links), `tagId`, and
`page`/`limit` pagination.

Workspace roles, ordered from most to least privileged:
`owner`, `admin`, `editor`, `analyst`, `viewer`. See
[Team management & permissions](#team-management--permissions) for the full permission matrix.

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

## Campaigns & tags

**Campaigns** group links for a marketing push and can optionally define a schedule
(`startDate`/`endDate`) and a status (`active`, `archived`, `completed`). Campaign names are
unique within a workspace, **case-insensitively** (compared via a normalized `nameKey`); the
same name may exist in different workspaces. Creating a duplicate returns `409`. Non-owner
members can be assigned as campaign owner; link-editing roles (`owner`, `admin`, `editor`) may
modify campaigns.

Each campaign detail page shows its links and a combined analytics dashboard (reusing the same
metrics engine as workspace/link analytics). All campaign analytics endpoints accept `from`,
`to`, and `interval` and are scoped to the campaign's links.

**Tags** are lightweight, workspace-scoped labels with a normalized key (trimmed, collapsed
whitespace, lowercased), so duplicates such as `"Launch"` and `"launch"` resolve to one tag.
Tags can be attached to both links and campaigns. Creating or assigning tags accepts existing
tag ids or new names — unknown names are created automatically — up to 20 tags per resource.
Cross-workspace tag or campaign references are rejected with `400`.

**Safe deletion.** Deleting a campaign **detaches** its links (`campaign: null`) and never
deletes the links themselves or their click history. Deleting a tag removes it from every link
and campaign. Both operations leave existing analytics events intact.

**Organization UI.** The Links page exposes campaign and tag filters (including "No campaign"),
renders campaign and tag badges in the table/card views, and offers a Manage Tags dialog. The
link form includes campaign selection and a tag picker with inline creation.

---

## QR codes

Every link can generate a QR code that encodes the **short URL** (its custom alias when set,
otherwise the generated short code) — never the raw destination. Generation happens on the
server with the `qrcode` library and returns assets inline as data URLs / SVG markup; no image
files are written to disk and no image data is stored in MongoDB. If a member saves their
styling, only the settings are persisted on the link (`qr.fgColor`, `qr.bgColor`, `qr.size`,
`qr.errorCorrectionLevel`) and reused as the defaults next time.

Customization options and validation:

| Option                 | Accepted values                                        | Default   |
| ---------------------- | ------------------------------------------------------ | --------- |
| `fgColor` / `bgColor`  | Hex color (`#rgb` or `#rrggbb`), must differ           | `#000000` / `#ffffff` |
| `size`                 | Whole number 64–1024 (pixels)                          | `320`     |
| `errorCorrectionLevel` | `L`, `M`, `Q`, `H`                                     | `M`       |

`GET /api/v1/links/:id/qr` returns a JSON payload with the link and a `qr` object containing
`png` (data URL) and `svg` (markup), so the frontend can preview and download both PNG and SVG
without extra round-trips. `POST` accepts the same options, validates them, persists them, and
returns the regenerated assets. Invalid colors, sizes, or levels return `400`.

The **QR Codes** page provides a searchable link list, a live preview, color pickers, size and
error-correction controls, and PNG/SVG downloads. A **QR code** action is also available in the
row menu on the Links page (opening the same preview in a dialog).

## Bulk CSV import

Import many links at once from a CSV file. Every row is validated independently, so one bad row
never blocks the others, and nothing is silently skipped — each row is either imported or
reported with its row number and a readable error.

Download the template from the Links page (**Import CSV → Download template**) or via
`GET /api/v1/links/import/template?workspaceId=...`. Recognized columns (header names are
case-insensitive and ignore spaces/underscores; `url`/`destination` and `alias`/`slug` are
accepted aliases):

| Column         | Required | Format / notes                                                       |
| -------------- | -------- | -------------------------------------------------------------------- |
| `originalUrl`  | Yes      | Valid `http://` or `https://` URL                                    |
| `customAlias`  | No       | 3–50 chars, letters/numbers/`-`/`_`; must be unique                  |
| `title`        | No       | Up to 200 characters                                                 |
| `campaign`     | No       | Existing campaign **name** (case-insensitive) or id in the workspace |
| `tags`         | No       | Comma-separated tag names; unknown tags are created (max 20)         |
| `expiresAt`    | No       | `YYYY-MM-DD` or ISO 8601 (e.g. `2026-12-31T23:00:00Z`); must be future |
| `clickLimit`   | No       | Positive whole number (max 100,000,000)                              |

Rows with no `customAlias` get an auto-generated short code. Validation enforces the same URL,
alias, date, and click-limit rules as the create-link endpoint, and campaign/tag references must
belong to the target workspace. Duplicate aliases — whether repeated inside the file or already
taken in the workspace — are reported per row.

**Limits & processing.** Uploads are capped at `IMPORT_MAX_FILE_MB` (default 2MB) and
`IMPORT_MAX_ROWS` (default 1000) rows, with a dedicated rate limiter on the import endpoint.
Valid rows are written in batches of 100 (unordered inserts) to keep memory bounded. Only
workspace members with the `editor` role or higher may import.

The response summarizes `imported`, `failed`, and `skipped` counts with a per-row `errors`
array, and is persisted as a lightweight `ImportJob` (`backend/src/models/ImportJob.js`) that
can be retrieved later via `GET /api/v1/links/import/:importId` by any member of the workspace.
The frontend offers drag-and-drop upload, header/preview feedback, a progress state, a summary
with a downloadable CSV error report for retrying failed rows, and refreshes the link list after
a successful import. Imported links use the existing campaign and tag features.

---

## Link-in-bio pages

A **bio page** is a public, mobile-first collection of buttons served at `/bio/:username`.
Create one from the **Bio Pages** dashboard (`/app/bio-pages`); the editor keeps a live phone
preview in sync as you type.

- **Profile** — a globally unique, lowercase `username` (3–30 chars: letters, numbers, `-`,
  `_`) that defines the public URL, plus a title, description, and optional avatar URL.
  `GET /api/v1/bio-pages/check-username?username=...` reports availability (and accepts an
  `excludeId` so a page can keep its own username on edit). Reserved system words are rejected.
- **Appearance** — background and text colors (validated hex), a theme (`dark`, `light`,
  `gradient`), and a button style (`solid`, `outline`, `soft`, `shadow`).
- **Links** — up to 50 reorderable buttons. Each points either at an existing **LinkPulse link**
  (clicks flow through the normal redirect + analytics pipeline) or at a direct external
  `http(s)` URL. Individual buttons can be hidden without deleting them.
- **Social links** — up to 12 platform icons (`website`, `twitter`, `instagram`, `facebook`,
  `linkedin`, `youtube`, `tiktok`, `github`, `email`, `other`). Email entries accept a plain
  address (normalized to `mailto:`) or a `mailto:` link.
- **Publishing** — pages start as drafts. Only published pages are reachable via the public
  `GET /api/v1/public/bio/:username` endpoint; unpublishing immediately hides the page.

The public endpoint never exposes the owning workspace or account — it returns only the page's
presentation data with hidden buttons filtered out, and the internal document id is omitted.
All external and social links render with `target="_blank"` and `rel="noopener noreferrer"`.

---

## AI insights & smart recommendations (Groq)

The **AI Insights** page (`/app/ai-insights`) turns the existing analytics into plain-language
insights, prioritized recommendations, and anomaly alerts, plus a natural-language assistant.

### Setup

1. Create an API key at [console.groq.com](https://console.groq.com) and set the backend
   environment variables:

   ```
   GROQ_API_KEY=gsk_...
   GROQ_MODEL=llama-3.3-70b-versatile
   ```

2. Optional tuning: `GROQ_TIMEOUT_MS`, `AI_INSIGHTS_TTL_MINUTES`, `AI_HISTORY_DAYS`,
   `AI_QUESTION_MAX_LENGTH`, and `GROQ_BASE_URL` (for a proxy or self-hosted endpoint).

**No key, no AI, no fake data.** When `GROQ_API_KEY` is empty, the API still returns
rule-based anomaly detection and the exact metrics, but no AI-generated text — and the response
says so explicitly. The frontend shows a clear notice instead of a fabricated result. The key is
never sent to the browser.

### Features

- **Performance insights** — increases/declines, top and underperforming links, campaign
  summaries, and shifts in referrer/device distributions.
- **Optimization recommendations** — prioritized, actionable advice that cites the metrics
  supporting it.
- **Anomaly detection** — rule-based click spikes and drops computed from the daily series and
  per-link trends, clearly labelled as rule-based (separate from AI interpretation).
- **Natural-language analytics** — ask questions such as *"Which links performed best this
  period?"* or *"What changed in my click traffic this week?"* Answers are generated only from
  the aggregated metrics the backend supplies; if the data can't answer the question, the
  assistant says so.

### How it works

- All numbers are computed by `backend/src/services/analytics.service.js` (the same engine that
  powers the dashboards). The AI service composes those results into a compact, non-PII summary
  (`backend/src/services/ai.service.js`) and asks Groq to *interpret* it. The model never
  receives raw click events, IP hashes, or account data, and it cannot change database metrics.
- Groq is called only from the backend via the official `groq-sdk`
  (`backend/src/services/groq.service.js`), with structured JSON responses, a request timeout,
  and typed error handling for timeouts, rate limits, and auth failures.
- Responses follow a stable schema (`type`, `title`, `summary`, `evidence`, `recommendation`,
  `priority`, `generatedAt`) and are validated and clamped server-side; malformed model output
  is discarded rather than shown.

### Caching, cost & reliability

- Generations are persisted to the `AiInsight` collection (`backend/src/models/AiInsight.js`)
  and reused for `AI_INSIGHTS_TTL_MINUTES` (default 30) so the dashboard does not call Groq on
  every render. Use `POST /ai/recommendations` / `GET /ai/insights` with `refresh=true` (the
  **Regenerate** button) to force a fresh generation.
- Each `AiInsight` records a `dataSignature` of its source metrics; the API flags when analytics
  have changed since the insight was generated.
- Dedicated rate limiters protect the AI endpoints, questions are length-limited, and prompt
  payloads are size-capped. On timeouts, quota errors, or outages the API returns a clear notice
  (and the most recently saved generation where available) — never a fabricated AI result, raw
  provider error, internal prompt, or stack trace.
- History is retained for `AI_HISTORY_DAYS` (default 60) via a TTL index and exposed through
  `GET /ai/history`.

---

## Security notes

- `helmet` security headers and a CORS allow-list restricted to `FRONTEND_URL` (explicit methods,
  headers, and preflight caching).
- A global sanitize middleware strips MongoDB operators (`$`-prefixed and dotted keys) and
  prototype-pollution keys from every request body, query, and params object before validation,
  blocking operator-injection and pollution attacks.
- JWTs are signed and verified with a fixed `HS256` algorithm (the verifier rejects any other
  algorithm), preventing algorithm-confusion attacks.
- Rate limiting on all API routes, with stricter limiters on authentication, password attempts,
  imports, AI calls, public redirects, abuse reports, and link creation.
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
- CSV imports apply file-size and row-count limits and re-validate every URL, alias, date, and
  click limit through the same rules as the API. Workspace and campaign references are
  authorized against the caller's workspace; cross-workspace ids are rejected.
- QR customization values are validated server-side (hex colors, size bounds, error-correction
  enum) and QR assets are generated in-memory — nothing is persisted to disk or stored as an
  image in the database.
- Bio pages validate usernames, hex colors, enums, avatar/social/link URLs, and LinkPulse link
  references (which must belong to the same workspace) server-side. Usernames are globally
  unique. The public endpoint only serves published pages and omits workspace/owner ids.
- AI endpoints are workspace-authorized, rate-limited, and length- and size-capped. The AI
  service sends only aggregated metrics (never raw click events, IP hashes, or account data) to
  Groq; the API key, prompts, provider errors, and stack traces are never returned to clients.
- Workspace invitations use cryptographically secure random tokens; only a SHA-256 hash is
  stored, tokens expire (`INVITATION_TTL_DAYS`) and cannot be reused, and duplicate pending
  invitations for the same email are rejected. Accepting requires the signed-in email to match.
- Every workspace operation is authorized server-side against the caller's role; the UI only
  hides controls for convenience and never enforces access. Owners and admins cannot be removed,
  the sole owner cannot leave, and only the owner can transfer ownership or delete a workspace.
- The audit trail records actor, workspace, action, target, timestamp, and minimal metadata.
  Sensitive fields (tokens, passwords, secrets, keys) are stripped before storage.

## Team management & permissions

Workspace membership, invitations, roles, and administrative controls live under
`/api/v1/workspaces` and `/api/v1/invitations`.

### Roles & permission matrix

Permissions are centralized in `backend/src/utils/permissions.js` (mirrored in
`frontend/src/utils/permissions.js`) and enforced by `requireWorkspacePermission` middleware and
per-resource checks — never by the UI alone.

| Capability | owner | admin | editor | analyst | viewer |
| ---------- | :---: | :---: | :----: | :-----: | :----: |
| View workspace, members, links, campaigns, analytics, QR, bio pages, AI | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export analytics | ✓ | ✓ | ✓ | ✓ | |
| Create/edit links, campaigns, tags, QR, bio pages, AI runs | ✓ | ✓ | ✓ | | |
| Update workspace settings, manage members & invitations, view audit | ✓ | ✓ | | | |
| Review abuse reports/events & enforce link actions (`abuse.manage`) | ✓ | ✓ | | | |
| Transfer ownership, delete workspace | ✓ | | | | |

Rules enforced on the backend:

- Only the **owner** can transfer ownership or delete the workspace (deletion also requires typing
  the exact workspace name).
- **Admins** manage members and settings but cannot transfer ownership. A user can only assign
  roles strictly below their own, so admins cannot create peers and nobody can assign `owner`
  directly — ownership changes only through the transfer action.
- The workspace owner cannot be removed or demoted, and cannot leave until ownership is
  transferred. Members can leave a workspace on their own.
- Invitations cannot target `owner`; the role must be assignable by the inviter.

### Invitations

- `POST /workspaces/:id/invitations` creates a token valid for `INVITATION_TTL_DAYS`. Only the
  SHA-256 hash is persisted; the raw token appears once in the invite link.
- Duplicate pending invitations for the same email are rejected (resend instead). Resending
  rotates the token and clears any revoked/declined state; accepting marks the invitation
  accepted so the token cannot be reused.
- Invitations can be revoked by admins, declined by the invitee, and expire automatically
  (expiry is recorded in the audit trail).
- The invitee opens `/invite/:token`, sees a masked-email preview, signs in or registers with the
  invited address, then accepts or declines.

### Email delivery

Invitation emails are sent over SMTP with [Nodemailer](https://nodemailer.com). Delivery is
configured only when **both** `SMTP_HOST` and `MAIL_FROM` are set, so the API can never report an
email as sent when it is not. Pick any SMTP provider (Gmail, Amazon SES, Mailgun, Postmark, your
own server). For Gmail, enable 2-Step Verification and use a 16-character **App Password** as
`SMTP_PASS`.

For local development, run a mail catcher such as [Mailpit](https://github.com/axllent/mailpit)
(`docker run -p 1025:1025 -p 8025:8025 axllent/mailpit`), set `SMTP_HOST=localhost`, `SMTP_PORT=1025`,
`MAIL_FROM="LinkPulse <no-reply@local.test>"`, and view messages at `http://localhost:8025`.

When email delivery is not configured, invitations are still created and the invite link is
returned in the API response so an admin can share it manually — the response explicitly reports
`emailSent: false` and the UI says no email was sent. In production, creating an invitation without
email delivery configured returns `503`. If the provider rejects a send, the invitation is still
created, `emailSent` is `false`, and the invite link is returned for manual sharing.

### Workspace settings, overview & audit

- The **Settings** page edits the workspace name and shows live resource counts (members, pending
  invitations, links, campaigns, tags, bio pages, clicks) plus a danger zone for leaving or
  deleting the workspace.
- Deleting a workspace is owner-only, requires typing the name, and has an explicit policy:
  all workspace-scoped data (links, click history, campaigns, tags, bio pages, invitations,
  audit logs) is permanently deleted. Leaving never deletes shared resources.
- The **Team** page lists members with role dropdowns (bounded by assignable roles), pending
  invitations with status/expiry, and an administrative activity feed visible to admins/owners.
- Ownership transfers and other multi-document changes use a transaction where the MongoDB
  deployment supports it (`backend/src/utils/transaction.js`), with a safe sequential fallback.

## Security, abuse detection & notifications

All abuse detection is **rule-based and deterministic** over your own data — Groq never drives
enforcement decisions. Thresholds live in `backend/src/config/security.js` and are configurable
via the `ABUSE_*` / `*_RETENTION_DAYS` environment variables.

### Detection rules

| Rule (`ruleKey`) | Trigger | Severity |
| ---------------- | ------- | -------- |
| `suspicious_destination` | Destination host is a bare IP, uses punycode (`xn--`), embeds credentials, chains through another shortener, uses a frequently abused TLD, has an unusually deep subdomain chain, or is very long. Signal weights sum to a risk score compared against `ABUSE_DESTINATION_RISK_SCORE`. | medium/high |
| `link_creation_burst` | A workspace creates more than `ABUSE_LINK_CREATION_MAX` links in the rolling window. | medium/high |
| `source_request_burst` | A single source (hashed visitor IP; raw IPs are never stored) makes more than `ABUSE_SOURCE_REQUEST_MAX` short-link requests in the window. | medium |
| `click_spike` | A link's clicks exceed both `ABUSE_CLICK_SPIKE_MULTIPLIER`× its recent baseline and `ABUSE_CLICK_SPIKE_MIN_CLICKS`. | high |
| `password_failures` | More than `ABUSE_PASSWORD_FAIL_MAX` failed password attempts against a protected link. | medium |
| `reported` | A visitor report is submitted through `POST /abuse/reports`. | medium |

Key safety properties:

- High traffic or an unfamiliar domain **alone never disables a link**. Automated disabling is off
  by default (`ABUSE_AUTO_DISABLE=false`); enforcement is always an explicit admin action in the
  abuse console and is recorded in the audit trail.
- Detections are deduplicated (`dedupeKey`) and cooled down (`ABUSE_ALERT_COOLDOWN_MINUTES`) so a
  single incident produces one actionable alert, not a storm.
- Hooks run fire-and-forget around link creation, redirects, and password attempts; a detection
  failure can never break a redirect or a link creation.

### Reports & enforcement

- `POST /api/v1/abuse/reports` accepts a public report (by short code + reason). It is rate-limited,
  deduplicated per source/link (`ABUSE_REPORT_THROTTLE_MINUTES`), and stores the report against the
  owning workspace. If the reporter is signed in, their account is attached (reporter emails are
  masked in admin views).
- Admins/owners review reports and security events in the **Abuse & Safety** console
  (`/app/abuse`), inspect a link's destination risk and history, and disable/reactivate links with a
  reason. Every action writes to the workspace audit log (`link.disabled`, `link.reactivated`,
  `abuse.report.reviewed`, `security.event.reviewed`).

### Notifications

- A bell in the top bar shows unread notifications (polled every 60s), with per-item and
  "mark all read" actions. Notifications are recipient-scoped and always filtered server-side.
- Events that generate notifications: invitations and refreshed invitations, new members joining,
  abuse reports filed, links disabled/reactivated, security events, campaign created/status change,
  and high-priority AI anomalies (throttled). Retention is governed by
  `NOTIFICATION_RETENTION_DAYS`; security event retention by `SECURITY_EVENT_RETENTION_DAYS`.

### Access control

- The abuse console and all `/:workspaceId/abuse/*` endpoints require the `abuse.manage`
  permission (owner/admin only). Editors, analysts, and viewers receive `403`, enforced by
  `requireWorkspacePermission` — not the UI.

## Roadmap

1. **Foundation:** auth, workspaces, app shell, design system.
2. **URL shortener & redirects:** link management, device rules, password/limits.
3. **Click tracking & analytics:** click events, referrer/device/location breakdowns, dashboards.
4. **Campaigns & tags:** campaign scheduling, workspace tags, link filtering, campaign analytics.
5. **QR codes & bulk import:** customizable QR codes (PNG/SVG), validated CSV bulk link import.
6. **Link-in-bio pages:** customizable public pages with a live-preview editor.
7. **AI insights:** Groq-powered performance insights, recommendations, anomaly detection, and a natural-language assistant.
8. **Team management:** invitations, member/role management, ownership transfer, centralized permissions, workspace settings, and an audit trail.
9. **Security, abuse detection & notifications:** rule-based abuse detection, visitor reporting, an admin abuse console with link enforcement, in-app notifications, and request/rate-limit hardening.
