# LinkPulse

### Short links that perform in real time.

Most shorteners hand you a shorter URL and call it a day. LinkPulse keeps going: it watches every click land on a live globe, turns traffic into campaign-level insight, gives every link a QR code and a bio page, asks AI what the numbers mean, and gives a whole team the guardrails to work on it safely.

One workspace. Every link, channel, scan, and teammate accounted for.

> **Live app:** [Try LinkPulse]https://link-pulse-orcin.vercel.app/
>
> **Watch the full product walkthrough:** [LinkPulse demo video](VIDEO_URL_HERE)
>
> <!-- Replace LIVE_URL_HERE with the deployed app URL and VIDEO_URL_HERE with the GitHub-hosted video link. -->

---

## The short version

- **Make a link** with a custom alias, expiry date, click limit, password, campaign, tags, and per-device destinations.
- **Share it anywhere** as a short URL, a branded QR code, or a button on a link-in-bio page.
- **Watch it live** as clicks stream into a real-time globe and activity feed.
- **Understand it** with click, visitor, referrer, device, browser, OS, and location analytics.
- **Improve it** with AI-written insights, prioritized recommendations, and rule-based anomaly alerts.
- **Run it with a team** using five roles, email invitations, an audit trail, and an abuse console.

The rest of this README is the long, interesting version.

---

## Contents

1. [The product, feature by feature](#1-links-that-obey-you)
2. [Live pulse: the globe that breathes](#2-live-pulse-the-globe-that-breathes)
3. [Analytics that answer real questions](#3-analytics-that-answer-real-questions)
4. [Campaigns and tags](#4-campaigns-and-tags)
5. [The QR studio](#5-the-qr-studio)
6. [Link-in-bio pages](#6-link-in-bio-pages)
7. [Bulk CSV import](#7-bulk-csv-import)
8. [AI insights and the analytics assistant](#8-ai-insights-and-the-analytics-assistant)
9. [Teams, roles, and invitations](#9-teams-roles-and-invitations)
10. [Abuse and safety](#10-abuse-and-safety)
11. [Notifications](#11-notifications)
12. [Workspaces and the app shell](#12-workspaces-and-the-app-shell)
13. [The cyber-terminal experience](#13-the-cyber-terminal-experience)
14. [Security and privacy](#14-security-and-privacy)
15. [Under the hood](#15-under-the-hood)
16. [Run it locally](#16-run-it-locally)

---

## 1. Links that obey you

A LinkPulse link is not just a redirect. It is a small policy engine with a URL attached.

Paste a destination and LinkPulse generates a collision-safe short code. If you want something memorable, give it a **custom alias** (3–50 characters, letters, numbers, hyphens, or underscores). Give it a **title** so your future self can find it without decoding a URL. Then decide how it behaves:

- **Expiry** — set a future date and the link stops redirecting when the clock runs out.
- **Click limit** — cap total successful clicks at any positive whole number.
- **Password protection** — lock the link behind a password. Link passwords are hashed with `scrypt`; the plaintext is never stored, logged, or put in a URL.
- **Status** — leave it active, or disable it instantly without deleting the link or its history.
- **Device routing** — send mobile, tablet, and desktop visitors to different destinations, with a fallback for everything else.
- **Campaign and tags** — slot the link into a marketing push and label it for cross-cutting filters.

When a visitor hits a short link, the redirect engine checks things in a deliberate order: does it exist, is it disabled, has it expired, has it hit its click limit, and does it need a password? Only after all of those pass does it choose a destination and count the click.

The details matter here:

- **Limits are atomic.** The click is claimed with a single conditional database update that increments the counter and checks status, expiry, and limit in the same operation. Two visitors arriving at once cannot push a link past its click limit.
- **Rejected clicks never count.** A missing, disabled, expired, or limit-reached link does not inflate analytics. Neither do failed password attempts.
- **Passwords are not sticky.** A successful password entry returns a signed, five-minute unlock token for that visit. It is not stored on the device, so a fresh click asks again. For API clients, the token can be passed back as `?token=...`; the password itself never appears in a query string.
- **Every failure looks intentional.** Browsers get themed HTML pages for not found (404), disabled (403), expired (410), and limit reached (429), plus a polished password page with a show/hide toggle. API clients sending `Accept: application/json` (or `?format=json`) get structured JSON instead.
- **Destinations are validated.** Every URL, including device-specific ones, must be a real `http://` or `https://` URL. The redirect destination is never read from an untrusted query parameter.

The Links page is built for actual use, not a demo screenshot:

- Search across title, URL, and alias.
- Filter by **all, active, disabled, expired, or protected**.
- Filter by campaign (including **No campaign**) and by tag.
- Paginate without losing your place; deleting the last item on a page moves you back gracefully.
- Copy the short URL in one click.
- Open analytics scoped to that one link, jump to its campaign, or open its QR code from the row menu.
- Toggle a link on or off, edit it, or delete it with a clear confirmation.
- On smaller screens, the table becomes readable cards instead of a horizontal squeeze.
- Editors get the controls; viewers get a clear read-only notice. The server enforces the same rule regardless of what the UI shows.

---

## 2. Live pulse: the globe that breathes

The **Live pulse** panel is the part people point at. It is a live operational view of your traffic, not a static map image.

Every successful redirect publishes a click event. The dashboard opens a Server-Sent Events stream and receives:

1. A **snapshot** of the most recent clicks from the last 24 hours, so the panel is useful the moment it opens.
2. A **live stream** of new clicks as they happen, scoped to your workspace and optionally to a single link.
3. A **heartbeat** every 25 seconds to keep the connection healthy.

The client deduplicates by click ID, keeps a rolling buffer of recent events, and reconnects with exponential backoff if the connection drops. The connection status is visible at all times: connecting, live, reconnecting, offline. Your session token stays in the request header, and workspace access is checked on the server.

The globe itself is hand-built on a canvas:

- Real country outlines from world-atlas geometry, with a corrected India boundary (plus Pakistan and China boundary overrides) so the map does not ship with the usual errors.
- A rotating, draggable globe with inertia, vertical tilt, wheel zoom, zoom buttons, pause/resume, and reset.
- Hover any country for its name and live click count. Click it to filter the entire panel to that country.
- Country heat colours travel from lime to citrus to red as click volume rises.
- New clicks appear as colour-coded pulses with expanding rings and light beams. Device type decides the colour: desktop, mobile, tablet, or unknown.
- A graticule, orbit ring, and travelling orbit markers make the whole thing feel like a live instrument rather than a chart.
- Reduced-motion preferences disable the spin and keep the map readable.

Beside the globe, the panel shows **clicks per minute**, **active countries**, and **top device**, with two views:

- **Latest** — the newest clicks, with device icon, link title, short code, country, browser, and relative time ("now", "12s", "4m").
- **Countries** — a ranked country list with proportional bars. Click a country to filter both the list and the globe.

Traffic with no location data is handled honestly: the globe simply stays quiet rather than inventing a country.

---

## 3. Analytics that answer real questions

The Analytics page is a full workspace dashboard and a single-link dashboard in one.

Pick **7, 30, or 90 days**, or define a custom range. Ranges use consistent UTC boundaries, are capped at 731 days, and every empty bucket is filled with zero so two periods always reconcile cleanly. Hourly buckets are available for short ranges; daily buckets take over for longer ones.

At the top:

- **Total clicks** — all time.
- **Clicks in period** — with a percentage change against the immediately preceding period of equal length.
- **Unique visitors** — distinct visitors in the period, calculated from salted IP hashes.
- **Average per day** — so a spike does not hide a quiet week.

Below that:

- **Clicks over time** — clicks and unique visitors as an area and line chart.
- **Top links** — the links doing the work, with clicks and visitors, each linked to its own dashboard.
- **Top referrers** — where traffic came from, with self-referrals folded into Direct.
- **Devices** — a donut split across mobile, tablet, desktop, and unknown.
- **Browsers** — a ranked bar chart.
- **Operating systems** — a second ranked bar chart.
- **Locations** — top countries, plus a separate count of clicks with no location data. "No geographic data" is never confused with "zero clicks".

Opening analytics from a link row sets `?link=<id>` and scopes the whole page to that link: its title, short code, status, time series, referrers, devices, browsers, and locations. The back button clears the scope and returns to the workspace view.

The data is deliberately privacy-first:

- Raw IP addresses are never stored. Only a salted SHA-256 hash is kept, and it is used for unique-visitor counts.
- Referrers are reduced to the host; the full referring URL is not kept.
- Device, browser, and operating system come from the User-Agent.
- Country and region are recorded **only** when the request passes through a CDN or proxy that forwards location headers such as `cf-ipcountry` or `x-vercel-ip-country`. No raw IP geolocation is performed.
- Click events are written only after a visitor actually reaches the destination.

Every chart has a real empty state, a loading state, and a clear "here is why this might be empty" message when appropriate.

---

## 4. Campaigns and tags

Links are rarely useful in isolation. Campaigns turn a pile of URLs into an initiative, and tags give you a second axis that does not fit a hierarchy.

A **campaign** has a name, optional start and end dates, a status (**active**, **completed**, **archived**), a campaign owner, and as many links as you want to group into it. Names are unique inside a workspace, case-insensitively, so "Spring Launch" and "spring launch" cannot become two accidental campaigns. The same name can exist in different workspaces.

Each campaign has its own detail page:

- See the campaign's links, search them, and paginate through them.
- Add a link directly from the campaign, or create a brand-new link already attached to it.
- Open a combined analytics dashboard scoped to every link in the campaign.
- Switch the date range and interval without leaving the campaign.
- Archive, reactivate, edit, or delete the campaign.

Deleting a campaign is deliberately non-destructive: its links are **detached**, not deleted. Their click history stays intact. Your analytics do not suddenly lose a week because a campaign ended.

**Tags** are workspace-scoped labels with normalized keys: trimmed, whitespace-collapsed, and lowercased. `"Launch"` and `"launch"` resolve to the same tag. They can be attached to links and campaigns, created inline from a link or campaign form, renamed, or deleted from a single Manage Tags dialog.

- Up to 20 tags per resource.
- New tag names can be created on the spot.
- Cross-workspace tag or campaign IDs are rejected with a clear 400.
- Deleting a tag removes it from every link and campaign without touching analytics.

The Links page exposes campaign and tag filters, including "No campaign", and renders campaign and tag badges in both table and card views. Filtering, searching, and pagination all compose cleanly.

---

## 5. The QR studio

Every link can become a QR code. The QR encodes the **short URL** — the custom alias when there is one, otherwise the generated short code — never the raw destination. That means changing the destination later never invalidates a printed code.

The QR page is a focused studio:

- Pick a link from a searchable, paginated list.
- Customize **foreground** and **background** colours with hex inputs, colour pickers, and quick presets.
- Set a size from **64 to 1024 pixels**.
- Choose error correction **L, M, Q, or H**; higher levels survive more damage but increase density.
- Watch the live preview update as you type (debounced, so it does not hammer the server).
- Download **PNG** or **SVG**.
- Save the styling to the link, so the next visit starts from your choices.

Validation happens on the server, not just in the browser: colours must be valid `#rgb` or `#rrggbb` values and must differ, size must be a whole number inside the range, and the error-correction level must be one of the four supported values. Invalid input returns a clear 400 with per-field errors.

Assets are generated in memory. Nothing is written to disk, and no image blob is stored in MongoDB. The only thing persisted is the styling configuration on the link. The same QR panel is available from the link row menu, so you do not have to leave the Links page to grab a code.

---

## 6. Link-in-bio pages

A bio page is a public, mobile-first page that gathers everything you want to share under one username: `/bio/your-name`.

The editor is built around a **live phone preview** that updates as you type. No guessing, no save-and-refresh loop.

**Profile**
- A globally unique, lowercase username (3–30 letters, numbers, hyphens, or underscores) that defines the public URL.
- Title, description, and optional avatar URL.
- Live username availability checking, with an `excludeId` so an existing page can keep its own name while editing. Reserved system words are rejected.

**Appearance**
- Background and text colours, validated as hex.
- Theme: dark, light, or gradient.
- Button style: solid, outline, soft, or shadow.

**Links**
- Up to 50 reorderable buttons.
- Each button can point at an existing LinkPulse link (clicks flow through the normal redirect and analytics pipeline) or at any external `http(s)` URL.
- Hide a button without deleting it.
- Give each button its own title.

**Social links**
- Up to 12 platform entries: website, Twitter, Instagram, Facebook, LinkedIn, YouTube, TikTok, GitHub, email, or other.
- Email entries accept a plain address and normalize it to `mailto:`.

**Publishing**
- New pages start as drafts.
- Only published pages are reachable through the public endpoint.
- Unpublishing hides the page immediately.
- Copy the public URL, open it, or delete the page. Deleting a bio page never deletes the links it referenced.

The public page is deliberately private about its owner: it exposes only presentation data, filters out hidden buttons, and omits workspace, owner, and internal document IDs. All external and social links open with `target="_blank"` and `rel="noopener noreferrer"`. Bio pages also opt out of the dashboard's display font, so creators can style something that feels like theirs.

---

## 7. Bulk CSV import

Creating one link is fast. Creating two hundred should not be an afternoon.

The Links page offers **Import CSV** with:

- A downloadable template.
- Drag-and-drop or file selection.
- A preview that detects column headers and counts rows before you commit.
- A clear warning if the required `originalUrl` column is missing.
- Per-row validation, so one bad row never blocks the good ones.
- A summary of imported, failed, and skipped rows.
- A downloadable CSV error report that can be used to retry only the failures.

Recognized columns are forgiving. Header names are case-insensitive and ignore spaces and underscores; `url`/`destination` and `alias`/`slug` are accepted as aliases.

| Column | Required | What it does |
| --- | --- | --- |
| `originalUrl` | Yes | The destination; must be a valid `http://` or `https://` URL |
| `customAlias` | No | 3–50 characters; letters, numbers, `-`, `_`; must be unique |
| `title` | No | Up to 200 characters |
| `campaign` | No | Existing campaign name (case-insensitive) or ID in the workspace |
| `tags` | No | Comma-separated tag names; unknown tags are created (max 20) |
| `expiresAt` | No | `YYYY-MM-DD` or ISO 8601; must be in the future |
| `clickLimit` | No | Positive whole number, up to 100,000,000 |

Rows without an alias get an auto-generated short code. Duplicate aliases are reported per row, whether the duplicate is earlier in the file or already in the workspace.

Imports are bounded on purpose: 2 MB and 1,000 rows by default, configurable through environment variables, with a dedicated rate limiter. Valid rows are written in batches of 100 to keep memory predictable. Only editors and above can import. Each import is stored as an `ImportJob` so any workspace member can retrieve the result later.

---

## 8. AI insights and the analytics assistant

The AI Insights page turns the same analytics engine into plain language — without letting the model touch private data or invent numbers.

It gives you four things:

1. **Performance insights** — what grew, what declined, which links are carrying the period, which are underperforming, how campaigns compare, and how referrer or device mixes shifted.
2. **Prioritized recommendations** — concrete next steps, each with the metric evidence behind it and a priority order.
3. **Anomaly alerts** — click spikes and drops detected by deterministic rules over the daily series and per-link trends. These are labelled as rule-based, separate from AI interpretation.
4. **A natural-language assistant** — ask things like "Which links performed best this period?", "What changed in my traffic this week?", or "Which campaign deserves more attention?" Suggested questions are provided based on the data.

The architecture is the interesting part:

- All numbers come from the existing analytics service. The AI layer receives a compact, aggregated, non-PII summary: totals, trends, top links, campaign summaries, referrer/device distributions. It never receives raw click events, IP hashes, account details, or workspace internals.
- Groq is called only from the backend with the official SDK. The API key never reaches the browser.
- Responses use a stable schema (`type`, `title`, `summary`, `evidence`, `recommendation`, `priority`, `generatedAt`). Output is validated and clamped server-side; malformed model output is discarded rather than shown.
- Generations are cached for 30 minutes by default and stored in an `AiInsight` collection with a `dataSignature` of the source metrics. If analytics have changed since generation, the UI tells you.
- A **Regenerate** action forces a fresh run.
- History is retained for 60 days by default and exposed in a history panel.
- Timeouts, rate limits, auth failures, and outages produce a clear notice and, where available, the most recent saved result — never a fabricated answer, a raw provider error, a prompt dump, or a stack trace.

**No key, no fake AI.** If `GROQ_API_KEY` is empty, LinkPulse still returns rule-based anomaly detection and the exact metrics, and the page says AI-generated text is unavailable. It does not pretend. When AI is enabled, the model interprets; the database remains the source of truth.

---

## 9. Teams, roles, and invitations

Workspaces are shared by default, with permissions enforced on the server for every action.

### Roles

| Capability | owner | admin | editor | analyst | viewer |
| --- | :---: | :---: | :---: | :---: | :---: |
| View workspace, members, links, campaigns, analytics, QR, bio pages, AI | yes | yes | yes | yes | yes |
| Export analytics | yes | yes | yes | yes | |
| Create/edit links, campaigns, tags, QR styling, bio pages, AI runs | yes | yes | yes | | |
| Update workspace settings, manage members and invitations, view audit | yes | yes | | | |
| Review abuse reports/events and disable/reactivate links | yes | yes | | | |
| Transfer ownership, delete workspace | yes | | | | |

The rules beneath the table are what keep a team safe:

- Only the owner can transfer ownership or delete the workspace. Deletion requires typing the exact workspace name.
- Admins manage members and settings but cannot transfer ownership.
- You can only assign roles strictly below your own. Admins cannot create peers, and nobody can assign `owner` directly; ownership changes only through the transfer action.
- The owner cannot be removed or demoted, and cannot leave until ownership is transferred.
- Members can leave on their own without deleting shared resources.
- Every operation is authorized against the caller's role on the backend. The UI hides controls for convenience, never as the security boundary.

### Invitations

- Invite by email and choose a role the inviter is allowed to assign.
- Tokens are cryptographically random; only a SHA-256 hash is stored.
- Invitations expire after 7 days by default and cannot be reused.
- Duplicate pending invitations for the same email are rejected; resend instead.
- Resending rotates the token and clears revoked or declined state.
- Invitations can be revoked by an admin or declined by the invitee.
- The invitee opens `/invite/:token`, sees a masked-email preview, signs in or registers with the invited address, then accepts or declines. The signed-in email must match.
- Inviting `owner` is never allowed.

### Email delivery

Invitation email goes out over SMTP through Nodemailer. Delivery is considered configured only when **both** `SMTP_HOST` and `MAIL_FROM` are set, so the API can never claim an email was sent when it was not. Any SMTP provider works; local development can use Mailpit.

When email is not configured, the invitation is still created and the invite link is returned for manual sharing, with an explicit `emailSent: false`. In production, creating an invitation without email delivery returns 503. If the provider rejects a send, the invitation still exists and the link is returned.

### Audit trail and settings

- The Team page lists members with role controls, pending invitations with status and expiry, and a workspace activity feed for admins and owners.
- Every sensitive action is recorded with actor, workspace, action, target, timestamp, and minimal metadata. Tokens, passwords, secrets, and keys are stripped before storage.
- The Settings page edits the workspace name and shows live counts for members, pending invitations, links, campaigns, tags, bio pages, and tracked clicks.
- The danger zone handles leaving and deleting. Deleting is owner-only and permanently removes workspace-scoped data: links, click history, campaigns, tags, bio pages, invitations, and audit logs. Leaving never deletes shared resources.
- Ownership transfer and other multi-document changes use a transaction when MongoDB supports it, with a safe sequential fallback.

---

## 10. Abuse and safety

Link shorteners attract abuse. LinkPulse treats safety as a product surface, not a hidden cron job.

Detection is **rule-based and deterministic** over your own data. AI never drives enforcement.

| Rule | What triggers it | Severity |
| --- | --- | --- |
| `suspicious_destination` | Bare-IP hosts, punycode (`xn--`), embedded credentials, chains through another shortener, frequently abused TLDs, unusually deep subdomain chains, or very long URLs. Signal weights produce a risk score. | medium / high |
| `link_creation_burst` | A workspace creates more than 20 links in a rolling 10-minute window (defaults). | medium / high |
| `source_request_burst` | One hashed source makes more than 150 short-link requests in 60 seconds (defaults). | medium |
| `click_spike` | A link exceeds both 8× its recent baseline and 30 clicks in the window (defaults). | high |
| `password_failures` | More than 10 failed password attempts against a protected link in 15 minutes (defaults). | medium |
| `reported` | A visitor files a report through the public endpoint. | medium |

Safety properties:

- **High traffic alone never disables a link.** Automated disabling is off by default. Enforcement is always a human decision in the console, with a reason, recorded in the audit trail.
- Detections are deduplicated and cooled down, so one incident produces one actionable alert instead of a storm.
- Detection hooks run around link creation, redirects, and password attempts in a fire-and-forget style. A detection failure can never break a redirect.

The public **report endpoint** accepts a short code and a reason (spam, phishing, malware, harassment, impersonation, misleading, other). It is rate-limited, deduplicated per source and link, and attached to the owning workspace. If the reporter is signed in, the account is linked; reporter emails are masked in admin views.

The **Abuse & Safety console** is owner/admin only and has three working views:

- **Suspicious links** — links with open events or reports, their highest severity, click count, event/report counts, and last activity. Inspect one to see destination risk, individual risk signals, event history, and counts. Disable or reactivate with an optional reason.
- **Reports** — visitor reports with status, link, time, and reporter. Review with notes and move to reviewing, resolved, or dismissed.
- **Security events** — every automated detection or report, with type, severity, status, source, description, and a review action.

Every enforcement and review action lands in the workspace audit log: `link.disabled`, `link.reactivated`, `abuse.report.reviewed`, `security.event.reviewed`.

---

## 11. Notifications

The bell in the top bar keeps the important things from getting lost.

- Recipient-scoped notifications, filtered server-side.
- Unread count polled every 60 seconds without ever breaking the shell.
- Per-item mark-as-read, plus **Mark all read**.
- Clicking a notification marks it read and follows its deep link to the relevant page.
- Notification types cover invitations and refreshed invitations, new members, abuse reports, links disabled or reactivated, security events, campaign creation and status changes, and high-priority AI anomalies (throttled).
- Unread items are visually distinct, timestamps are relative, and the panel has proper empty and error states.
- Retention defaults to 180 days for notifications and 90 days for security events, enforced with TTL indexes.

---

## 12. Workspaces and the app shell

An account can belong to multiple workspaces, and the switcher in the top bar moves between them without a page reload. Need a clean slate? Create a new workspace right from the switcher. Links, campaigns, tags, bio pages, analytics, abuse events, and audit trails are all isolated per workspace.

The shell is built around getting out of your way:

- Sidebar grouped into **Workspace**, **Experience**, and **Manage**, with role-aware items. Abuse & Safety simply does not appear unless you can manage it.
- Responsive mobile navigation with an overlay, close button, and a sticky top bar.
- Workspace switcher, notification bell, and account menu in one predictable place.
- Toasts for every meaningful success or failure.
- Skeleton and spinner states that match the layout they are replacing.
- Purpose-written empty states that explain what to do next instead of just saying "no data".
- Retry buttons on failed loads, with the actual error message.
- Clipboard actions that confirm when they work and tell you when they cannot.
- Confirmation dialogs for destructive actions, with the dangerous button disabled until the required confirmation text matches.

---

## 13. The cyber-terminal experience

The interface has a point of view: a sleek cyber-terminal, not another blue SaaS dashboard.

- **Type** — JetBrains Mono for body, UI, and data; Chakra Petch for headings and the logo.
- **Palette** — dark olive backgrounds, light green-tinted ink, lime accent, citrus yellow secondary, amber warning, red danger.
- **Shape** — hard edges, chunky 2px borders, offset pixel/neon shadows. Disabled buttons stay readable instead of fading into oblivion.
- **Texture** — scanline and aurora backgrounds, subtle text glow, gradient hairlines, animated shimmer text, and stepped rather than eased animations.
- **Landing page** — a rotating wireframe globe with a glowing core, orbiting tick rings, animated data arcs with travelling packets, and drifting particles; mouse-tilted depth cards; a perspective grid floor; scroll reveals; a feature marquee; and a full walkthrough of every capability with a "why it matters" for each.
- **Motion with manners** — the canvas loop is frame-rate independent, clamps its delta, and fully respects `prefers-reduced-motion`. The globe keeps working without spinning.
- **Responsive by default** — tables become cards, charts stack, dialogs stay usable, and the sidebar becomes a mobile drawer.
- **Bio pages break the theme on purpose** — they are user-styled, so creators are not forced into the dashboard's display font.

The result is a product that feels like an instrument: dense where it should be dense, quiet where it should be quiet, and always clear about what just happened.

---

## 14. Security and privacy

Security is not a section bolted on at the end; it is visible in how every feature behaves.

- **Headers and CORS** — Helmet security headers and a CORS allow-list restricted to the configured frontend origin, with explicit methods and headers.
- **Input sanitization** — a global middleware strips MongoDB operators (`$`-prefixed and dotted keys) and prototype-pollution keys from every body, query, and params object before validation.
- **JWT** — signed and verified with a fixed HS256 algorithm; the verifier rejects any other algorithm.
- **Rate limiting** — global limits plus stricter limits on authentication, password attempts, imports, AI calls, public redirects, abuse reports, and link creation.
- **Passwords** — link passwords are hashed with `scrypt`. Account and link passwords are excluded from API responses and never logged.
- **Analytics privacy** — salted SHA-256 IP hashes only, host-only referrers, and country only from trusted CDN/proxy headers.
- **Short codes** — collision-safe generation with uniqueness retries; custom aliases are validated and reserved-word filtered; the destination never comes from an untrusted query parameter.
- **CSV import** — file-size and row limits, full re-validation per row, and workspace authorization for campaign and tag references.
- **QR codes** — server-side validation and in-memory generation; no files on disk and no image blobs in the database.
- **Bio pages** — validated usernames, colours, enums, URLs, and link references; globally unique usernames; the public endpoint serves only published pages and omits owner/workspace IDs.
- **AI** — workspace-authorized, rate-limited, length- and size-capped; only aggregated metrics leave the backend; keys, prompts, provider errors, and stack traces never reach clients.
- **Invitations** — random tokens, SHA-256 hashes at rest, expiry, no reuse, duplicate-pending rejection, and email-match acceptance.
- **Authorization** — every workspace operation is checked server-side; the UI is not the boundary.
- **Audit** — sensitive fields are stripped before storage; every enforcement decision is attributable.

One honest caveat: account passwords are currently stored and compared as plain text, isolated in `backend/src/services/auth.service.js`. This is intentional for the foundation release and must be replaced with a real hashing algorithm before any public deployment. Link passwords already use `scrypt`.

---

## 15. Under the hood

### Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, JavaScript (ESM), Tailwind CSS, React Router, Axios, Recharts, Lucide, topojson-client, world-atlas |
| Backend | Node.js 18+, Express, JavaScript (ESM), MongoDB + Mongoose, JWT, Helmet, express-rate-limit, Nodemailer, `qrcode`, `multer`, `csv-parse`, `groq-sdk` |
| Real time | Server-Sent Events with an in-process event emitter |
| AI | Groq chat completions with structured JSON responses |

### Architecture at a glance

```text
Browser (React + Vite)
   |  REST /api/v1  +  SSE /api/v1/analytics/stream
   v
Express API
   |-- auth + workspace authorization
   |-- links / redirect engine ---- > MongoDB
   |-- analytics aggregation ----- > ClickEvent collection
   |-- campaigns / tags / bio / QR
   |-- AI service --------------- > Groq (aggregated metrics only)
   |-- abuse rules + notifications
   v
MongoDB
```

### The life of a click

1. A visitor requests `/:code`.
2. The engine finds the link by short code or custom alias.
3. It checks status, expiry, click limit, and password.
4. If a password is required, it renders the unlock page or verifies the unlock token.
5. It chooses the destination from device rules, the fallback, or the original URL.
6. It atomically claims the click and increments the counter.
7. It writes a `ClickEvent` with parsed UA, referrer host, hashed IP, and any trusted geo headers.
8. It publishes the serialized click to the workspace's real-time channel.
9. Live dashboards receive it over SSE; analytics queries include it immediately.

### Repository layout

```text
LinkPulse/
├── backend/
│   ├── src/
│   │   ├── config/        env, database, security thresholds
│   │   ├── controllers/   HTTP request handlers
│   │   ├── middleware/    auth, validation, rate limits, sanitization, uploads
│   │   ├── models/        User, Workspace, Link, ClickEvent, Campaign, Tag,
│   │   │                  BioPage, AiInsight, Notification, AbuseReport,
│   │   │                  SecurityEvent, AuditLog, ImportJob, WorkspaceInvitation
│   │   ├── routes/        versioned API + public redirect + SSE
│   │   ├── services/      business logic, analytics, AI, abuse, mail, realtime
│   │   └── utils/         URL, QR, geo, UA, IP hashing, redirect pages, etc.
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    UI primitives, landing, links, analytics, QR, bio, AI
│   │   ├── context/       auth, workspace, toasts
│   │   ├── hooks/         auth, workspace, live clicks, debounce, toasts
│   │   ├── layouts/       auth shell, dashboard shell
│   │   ├── pages/         landing, auth, overview, links, analytics, etc.
│   │   ├── services/      API clients
│   │   └── utils/         formatting, permissions, geo, QR, validation
│   └── package.json
└── README.md
```

### Data model

| Collection | Purpose |
| --- | --- |
| `User` | Account identity and workspace memberships |
| `Workspace` | Ownership, members, roles, and isolation boundary |
| `Link` | Destination, codes, limits, rules, QR settings, campaign, tags |
| `ClickEvent` | One successful redirect: timestamp, referrer host, device, browser, OS, country/region, hashed IP |
| `Campaign` | Grouped initiative with schedule, status, owner, links |
| `Tag` | Workspace-scoped normalized label |
| `BioPage` | Public profile, appearance, links, socials, publish state |
| `AiInsight` | Cached generations, type, metrics signature, TTL |
| `Notification` | Recipient-scoped in-app events |
| `AbuseReport` | Visitor-submitted reports and review state |
| `SecurityEvent` | Rule detections, severity, status, dedupe/cooldown keys |
| `AuditLog` | Administrative activity trail |
| `ImportJob` | Stored CSV import result and per-row errors |
| `WorkspaceInvitation` | Hashed invitation token, role, status, expiry |

### API surface

All responses share a consistent shape:

```json
{ "success": true, "message": "...", "data": {} }
```

```json
{ "success": false, "message": "...", "errors": [] }
```

<details>
<summary><strong>Expand the endpoint map</strong></summary>

**Auth**

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Create an account, returns JWT |
| `POST` | `/api/v1/auth/login` | Authenticate, returns JWT |
| `POST` | `/api/v1/auth/logout` | Acknowledge logout |
| `GET` | `/api/v1/auth/me` | Current user |

**Workspaces, members, invitations, audit**

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/workspaces` | List the caller's workspaces |
| `POST` | `/api/v1/workspaces` | Create a workspace |
| `GET` | `/api/v1/workspaces/:id` | Details, caller role, permissions |
| `PATCH` | `/api/v1/workspaces/:id` | Update workspace settings |
| `DELETE` | `/api/v1/workspaces/:id` | Delete (owner, name confirmation) |
| `GET` | `/api/v1/workspaces/:id/overview` | Member/resource counts and activity |
| `GET` | `/api/v1/workspaces/:id/members` | List members |
| `POST` | `/api/v1/workspaces/:id/members` | Add an existing user |
| `PATCH` | `/api/v1/workspaces/:id/members/:userId` | Change a member role |
| `DELETE` | `/api/v1/workspaces/:id/members/:userId` | Remove a member |
| `POST` | `/api/v1/workspaces/:id/transfer` | Transfer ownership |
| `POST` | `/api/v1/workspaces/:id/leave` | Leave a workspace |
| `GET` | `/api/v1/workspaces/:id/invitations` | List invitations |
| `POST` | `/api/v1/workspaces/:id/invitations` | Invite by email |
| `POST` | `/api/v1/workspaces/:id/invitations/:invitationId/resend` | Resend/renew |
| `DELETE` | `/api/v1/workspaces/:id/invitations/:invitationId` | Revoke |
| `GET` | `/api/v1/workspaces/:id/audit` | Administrative activity |
| `GET` | `/api/v1/invitations/:token` | Preview an invitation |
| `POST` | `/api/v1/invitations/accept` | Accept |
| `POST` | `/api/v1/invitations/reject` | Decline |

**Links, redirects, QR, import**

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/links?workspaceId=...` | List with search, filter, pagination |
| `POST` | `/api/v1/links` | Create a short link |
| `GET` | `/api/v1/links/:id` | Link details |
| `PATCH` | `/api/v1/links/:id` | Update |
| `DELETE` | `/api/v1/links/:id` | Delete |
| `GET` | `/api/v1/links/:id/qr` | Generate QR assets |
| `POST` | `/api/v1/links/:id/qr` | Generate and persist QR styling |
| `GET` | `/api/v1/links/import/template` | Download CSV template |
| `POST` | `/api/v1/links/import` | Upload and process CSV |
| `GET` | `/api/v1/links/import/:importId` | Retrieve a stored import result |
| `GET` | `/:shortCode` | Resolve and redirect (302) |
| `POST` | `/:shortCode` | Submit a link password |

**Analytics**

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/analytics/overview` | Summary metrics |
| `GET` | `/api/v1/analytics/clicks-over-time` | Clicks/visitors series |
| `GET` | `/api/v1/analytics/top-links` | Most clicked links |
| `GET` | `/api/v1/analytics/referrers` | Traffic sources |
| `GET` | `/api/v1/analytics/devices` | Device breakdown |
| `GET` | `/api/v1/analytics/browsers` | Browser and OS breakdown |
| `GET` | `/api/v1/analytics/locations` | Country/region breakdown |
| `GET` | `/api/v1/analytics/links/:linkId` | Combined single-link analytics |
| `GET` | `/api/v1/analytics/stream` | SSE snapshot + live clicks |

**Campaigns, tags, bio pages, AI**

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/campaigns?workspaceId=...` | List campaigns with metrics |
| `POST` | `/api/v1/campaigns` | Create |
| `GET` | `/api/v1/campaigns/:id` | Details and caller role |
| `PATCH` | `/api/v1/campaigns/:id` | Update |
| `DELETE` | `/api/v1/campaigns/:id` | Delete, detaching links |
| `GET` | `/api/v1/campaigns/:id/links` | Campaign links |
| `GET` | `/api/v1/campaigns/:id/analytics` | Combined analytics |
| `GET` | `/api/v1/tags?workspaceId=...` | List tags |
| `POST` | `/api/v1/tags` | Create |
| `PATCH` | `/api/v1/tags/:id` | Rename |
| `DELETE` | `/api/v1/tags/:id` | Delete |
| `GET` | `/api/v1/bio-pages?workspaceId=...` | List bio pages |
| `POST` | `/api/v1/bio-pages` | Create |
| `GET` | `/api/v1/bio-pages/check-username` | Check availability |
| `GET` | `/api/v1/bio-pages/:id` | Details and caller role |
| `PATCH` | `/api/v1/bio-pages/:id` | Update |
| `PATCH` | `/api/v1/bio-pages/:id/publish` | Publish/unpublish |
| `DELETE` | `/api/v1/bio-pages/:id` | Delete |
| `GET` | `/api/v1/public/bio/:username` | Render a published bio page |
| `GET` | `/api/v1/ai/insights?workspaceId=...` | Retrieve or generate insights |
| `POST` | `/api/v1/ai/ask` | Natural-language analytics question |
| `POST` | `/api/v1/ai/recommendations` | Generate recommendations |
| `GET` | `/api/v1/ai/history?workspaceId=...` | Previously saved generations |

**Notifications and abuse**

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/notifications?workspaceId=...` | List notifications |
| `GET` | `/api/v1/notifications/unread-count` | Unread count |
| `POST` | `/api/v1/notifications/:id/read` | Mark one read |
| `POST` | `/api/v1/notifications/read-all` | Mark all read |
| `POST` | `/api/v1/abuse/reports` | Public abuse report |
| `GET` | `/api/v1/workspaces/:id/abuse/summary` | Console counters |
| `GET` | `/api/v1/workspaces/:id/abuse/links` | Suspicious links |
| `GET` | `/api/v1/workspaces/:id/abuse/links/:linkId` | Inspect one link |
| `POST` | `/api/v1/workspaces/:id/abuse/links/:linkId/disable` | Disable |
| `POST` | `/api/v1/workspaces/:id/abuse/links/:linkId/reactivate` | Reactivate |
| `GET` | `/api/v1/workspaces/:id/abuse/events` | Security events |
| `PATCH` | `/api/v1/workspaces/:id/abuse/events/:eventId` | Review event |
| `GET` | `/api/v1/workspaces/:id/abuse/reports` | Visitor reports |
| `GET` | `/api/v1/workspaces/:id/abuse/reports/:reportId` | Report detail |
| `PATCH` | `/api/v1/workspaces/:id/abuse/reports/:reportId` | Review report |

Link listing supports `filter` (`all`, `active`, `disabled`, `expired`, `protected`), `search`, `campaignId` (use `none` for unassigned), `tagId`, `page`, and `limit`.

</details>

---

## 16. Run it locally

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- MongoDB running locally or a hosted connection string (for example MongoDB Atlas)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Set at least `MONGODB_URI` and `JWT_SECRET` in `backend/.env`.

```bash
npm run dev
```

The API starts on `http://localhost:5000`; health check: `http://localhost:5000/api/v1/health`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

The default environment points at the local API:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_PUBLIC_BASE_URL=http://localhost:5000
```

```bash
npm run dev
```

Open `http://localhost:5173`.

Only `VITE_*` values reach the browser. No backend secret is ever included in frontend code.

### 3. A five-minute demo path

1. Register an account, then create a workspace from the switcher.
2. Create a link with a custom alias, a title, and a click limit.
3. Open the link in a new tab a few times.
4. Go back to **Overview** and watch the live globe pulse.
5. Open **Analytics** for the workspace, then the same dashboard scoped to that link.
6. Create a campaign, attach the link, and open the campaign's analytics.
7. Open the QR studio, restyle the code, and download both PNG and SVG.
8. Create a bio page, add a LinkPulse link and a social link, publish it, and open `/bio/your-name`.
9. If you have a Groq key, open **AI Insights** and ask the assistant a question.
10. Invite a teammate, or file a report against a test link and review it in **Abuse & Safety**.

### Key environment variables

<details>
<summary><strong>Expand the configuration reference</strong></summary>

| Variable | Purpose | Default / example |
| --- | --- | --- |
| `PORT` | API port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/linkpulse` |
| `JWT_SECRET` | JWT signing secret | a long random string |
| `JWT_EXPIRES_IN` | JWT lifetime | `7d` |
| `FRONTEND_URL` | Allowed CORS origin and home link | `http://localhost:5173` |
| `BACKEND_URL` | Public API origin for short links and QR codes | `http://localhost:5000` |
| `IP_HASH_SALT` | Salt for visitor IP hashes | falls back to `JWT_SECRET` |
| `LOG_LEVEL` | `error`, `warn`, `info`, `debug` | `info` |
| `IMPORT_MAX_FILE_MB` | Maximum CSV upload size | `2` |
| `IMPORT_MAX_ROWS` | Maximum rows per import | `1000` |
| `GROQ_API_KEY` | Groq key; AI text is disabled when empty | `gsk_...` |
| `GROQ_MODEL` | Chat model | `llama-3.3-70b-versatile` |
| `GROQ_TIMEOUT_MS` | Per-request timeout | `20000` |
| `AI_INSIGHTS_TTL_MINUTES` | Cache lifetime for insights | `30` |
| `AI_HISTORY_DAYS` | Insight retention | `60` |
| `AI_QUESTION_MAX_LENGTH` | Maximum assistant question length | `300` |
| `INVITATION_TTL_DAYS` | Invitation lifetime | `7` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | SMTP connection | e.g. `smtp.gmail.com` / `587` / `false` |
| `SMTP_USER` / `SMTP_PASS` | SMTP credentials or app password | |
| `MAIL_FROM` | Sender address; email is enabled only with `SMTP_HOST` | `LinkPulse <no-reply@example.com>` |
| `SECURITY_EVENT_RETENTION_DAYS` | Security event retention | `90` |
| `NOTIFICATION_RETENTION_DAYS` | Notification retention | `180` |
| `ABUSE_AUTO_DISABLE` | Automated disabling; off by default | `false` |
| `ABUSE_ALERT_COOLDOWN_MINUTES` | Alert cooldown | `15` |
| `ABUSE_LINK_CREATION_MAX` / `ABUSE_LINK_CREATION_WINDOW_MINUTES` | Link burst threshold | `20` / `10` |
| `ABUSE_SOURCE_REQUEST_MAX` / `ABUSE_SOURCE_REQUEST_WINDOW_SECONDS` | Source burst threshold | `150` / `60` |
| `ABUSE_CLICK_SPIKE_MULTIPLIER` / `ABUSE_CLICK_SPIKE_MIN_CLICKS` / `ABUSE_CLICK_SPIKE_WINDOW_MINUTES` | Spike thresholds | `8` / `30` / `10` |
| `ABUSE_PASSWORD_FAIL_MAX` / `ABUSE_PASSWORD_FAIL_WINDOW_MINUTES` | Password failure threshold | `10` / `15` |
| `ABUSE_DESTINATION_RISK_SCORE` | Destination risk flag threshold | `50` |
| `ABUSE_REPORT_THROTTLE_MINUTES` | Duplicate report cooldown | `60` |

For local invitation email, run Mailpit:

```bash
docker run -p 1025:1025 -p 8025:8025 axllent/mailpit
```

Then set `SMTP_HOST=localhost`, `SMTP_PORT=1025`, `MAIL_FROM="LinkPulse <no-reply@local.test>"`, and open `http://localhost:8025`.

</details>

---

**LinkPulse** — make the link, watch the pulse, trust the numbers.
