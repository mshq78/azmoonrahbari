# وقت تصمیم، شبیه کدومی؟ — رهبری هوشیار

A Persian, right-to-left, 12-question decision-style game that reveals one of five
historical characters, plus the admin panel that runs it.

One repository, one deployable Node process: it serves the JSON API **and** the
compiled single-page app from the same origin, so session cookies are
same-origin and there is no CORS layer to maintain.

---

## Contents

- [Stack](#stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Install](#install)
- [Environment](#environment)
- [Database migrations](#database-migrations)
- [Seeding questionnaire content](#seeding-questionnaire-content)
- [Creating an admin](#creating-an-admin)
- [Development](#development)
- [Production build](#production-build)
- [Deploying to a Node host](#deploying-to-a-node-host)
- [Backups](#backups)
- [API reference](#api-reference)
- [How scoring works](#how-scoring-works)
- [Security notes](#security-notes)
- [Operational notes](#operational-notes)

---

## Stack

| Layer     | Choice                                                            |
| --------- | ----------------------------------------------------------------- |
| Runtime   | Node 20 LTS or newer                                               |
| Language  | TypeScript, `strict` on both sides                                 |
| API       | Express 4, Zod on every request                                    |
| Database  | MySQL 8 (or a compatible MariaDB) via Drizzle ORM and `mysql2`     |
| Sessions  | Signed `HttpOnly` cookies; admin sessions also tracked in the DB   |
| Passwords | Node's built-in `scrypt`                                           |
| Frontend  | React 18/19, Vite, React Router, TanStack Query, Dexie, Tailwind 4 |

No Docker, Redis, queue or message bus is required. The app is sized for roughly
100 concurrent users on a single process.

---

## Repository layout

```
.
├── client/                     React SPA (participant game + admin panel)
│   ├── src/
│   │   ├── components/         Shared UI primitives
│   │   ├── content/            All Persian copy (no strings inside components)
│   │   ├── features/           One folder per screen, plus admin/
│   │   ├── services/           fetch layer for the public and admin APIs
│   │   ├── state/              Dexie cache, sync engine, query hooks, theme
│   │   └── styles/             Design tokens
│   └── dist/                   Build output, served by the server
├── server/
│   ├── src/
│   │   ├── config/             Env parsing and validation
│   │   ├── db/                 Drizzle schema, migrations, migrate script
│   │   ├── middleware/         Errors, sessions, CSRF, rate limits, validation
│   │   ├── modules/            admin, answers, attempts, auth, exports,
│   │   │                       media, participants, questionnaire, scoring
│   │   ├── shared/             Errors, normalization, ids, password, time
│   │   ├── storage/            Upload storage with path-traversal guards
│   │   ├── app.ts              Express app assembly
│   │   └── server.ts           Process entry point
│   └── dist/                   Bundled output (`server/dist/server.js`)
├── shared/                     Contracts shared by client and server
│   ├── contracts/              Error codes, constants, route paths
│   ├── schemas/                Zod request schemas
│   └── types/                  Request/response types
├── scripts/
│   ├── seed-content.ts         Idempotent content seeding
│   └── create-admin.ts         Create or reset an admin account
├── seed/seed-content.json      Canonical questionnaire content + scoring map
└── uploads/                    Uploaded images (gitignored, back this up)
```

---

## Prerequisites

- **Node.js 20.11+** and npm 10+ (`node -v`)
- **MySQL 8** or a compatible **MariaDB 10.11+**, reachable over TCP
- A database and a user with full rights on it:

```sql
CREATE DATABASE azmoonrahbari CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'azmoon'@'localhost' IDENTIFIED BY 'a-strong-password';
GRANT ALL PRIVILEGES ON azmoonrahbari.* TO 'azmoon'@'localhost';
FLUSH PRIVILEGES;
```

`utf8mb4` matters: the content is Persian, and `utf8mb3` cannot store all of it.

---

## Install

```bash
npm install
```

This is an npm workspace; one install at the root covers `client/` and `server/`.

---

## Environment

Copy the example and fill it in. `.env` is gitignored and must never be committed.

```bash
cp .env.example .env
```

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Every key is documented in `.env.example`. The ones that matter most:

| Key                | Notes                                                                |
| ------------------ | -------------------------------------------------------------------- |
| `SESSION_SECRET`   | Required, ≥32 chars, unique per environment. Rotating it logs everyone out. |
| `DB_*`             | Connection details for MySQL.                                         |
| `COOKIE_SECURE`    | **Must be `true` in production** — the server refuses to start otherwise. |
| `TRUST_PROXY`      | `true` behind nginx/Caddy/a load balancer, so client IPs and the protocol come from `X-Forwarded-*`. |
| `ALLOWED_ORIGINS`  | Comma-separated. Leave empty to accept only the request's own host.   |
| `UPLOAD_DIR`       | Persistent directory for uploaded images. Back it up.                 |
| `CLIENT_DIST_DIR`  | Where the built SPA lives; defaults to `client/dist`.                 |

Relative paths in `UPLOAD_DIR` and `CLIENT_DIST_DIR` resolve against the
repository root, not the working directory, so the app behaves the same whether
you start it from the root or from `server/`.

---

## Database migrations

Migrations are version-controlled SQL under `server/src/db/migrations/`.

```bash
npm run db:migrate     # apply all pending migrations
```

After changing anything in `server/src/db/schema/`:

```bash
npm run db:generate    # write a new migration from the schema diff
npm run db:migrate     # apply it
```

Review the generated SQL before committing it. Never edit a migration that has
already been applied anywhere; add a new one instead.

---

## Seeding questionnaire content

`seed/seed-content.json` is the single source of truth for the characters, the
questions, the options, and the scoring map. Seeding is idempotent — run it as
often as you like:

```bash
npm run seed:content
```

It will:

1. Upsert the five rows of `characters`.
2. Create test version #1 as `Published` **if nothing is published yet**, and
   point `app_settings.activeTestVersionId` at it. If a version is already live,
   a new version number arrives as a `Draft` for an admin to review and publish.
3. Upsert the 13 questions (Q1–Q12 scored, QT the tie-breaker) and their options,
   setting `options.internalValue` from each option's `character` field and
   `score` to 1.

Content that disappears from the JSON is **deactivated, never deleted**, so
answers already recorded keep pointing at something real.

To seed from a different file: `SEED_FILE=/path/to/file.json npm run seed:content`.

---

## Creating an admin

There is no default password anywhere in this codebase. Create the first admin
explicitly:

```bash
# interactive (prompts for the password, with echo off)
npm run create:admin -- --username admin --display-name "مدیر سامانه"

# or non-interactively
ADMIN_USERNAME=admin ADMIN_DISPLAY_NAME="مدیر سامانه" ADMIN_PASSWORD='…' npm run create:admin
```

Running it again for an existing username resets that account's password and
re-enables it. Passwords must be at least 12 characters with upper case, lower
case and a digit; `--force` overrides that if you really need to.

---

## Development

Run the API and the Vite dev server together:

```bash
npm run dev
```

- SPA: <http://localhost:5173> (Vite proxies `/api` and `/uploads` to the API,
  so cookies stay same-origin exactly as in production)
- API: <http://localhost:3000>
- Admin panel: <http://localhost:5173/admin>

Individually: `npm run dev:server`, `npm run dev:client`.

Checks:

```bash
npm run lint        # ESLint across client, server, shared and scripts
npm run typecheck   # tsc --noEmit for both workspaces
```

---

## Production build

```bash
npm run build       # builds client/dist, then bundles server/dist/server.js
npm start           # node server/dist/server.js
```

`npm start` serves the API and the SPA from a single process on `PORT`. Deep
links (`/q/3`, `/admin/participants`) fall back to `index.html`; `/api`,
`/uploads` and `/assets` deliberately do not, so a missing bundle or a typo'd
endpoint returns a real 404 instead of a blank page.

---

## Deploying to a Node host

> **This app needs a long-lived Node process, not a serverless platform.**
> It holds a MySQL connection pool, rate-limits in process memory, writes
> uploads to a local directory, and takes a row lock (`SELECT … FOR UPDATE`)
> across a finalize. On a serverless host the uploads directory is ephemeral,
> the rate limiter becomes per-instance and ineffective, and a pool per
> invocation exhausts the database's connection limit.
>
> Pointing a platform's "output directory" at `client/dist` will build and
> deploy, but it ships the SPA with no API behind it: every `/api/*` call 404s
> and nothing works past the entry screen. A VPS or any host that runs
> `node server/dist/server.js` as a service is the supported target.

1. **Provision** Node 20+, MySQL 8, and a persistent directory for uploads.
2. **Copy the code** (git clone or an artifact upload) and run `npm ci`.
3. **Configure** `.env`, with `NODE_ENV=production`, `COOKIE_SECURE=true`,
   `TRUST_PROXY=true` if behind a proxy, and `ALLOWED_ORIGINS` set to your public
   origin.
4. **Migrate and seed**:
   ```bash
   npm run db:migrate
   npm run seed:content
   npm run create:admin -- --username admin --display-name "…"
   ```
5. **Build**: `npm run build`
6. **Run under a supervisor** so it restarts on failure and on boot. With systemd:

   ```ini
   # /etc/systemd/system/azmoonrahbari.service
   [Unit]
   Description=Azmoon Rahbari
   After=network.target mysql.service

   [Service]
   Type=simple
   User=azmoon
   WorkingDirectory=/srv/azmoonrahbari
   EnvironmentFile=/srv/azmoonrahbari/.env
   ExecStart=/usr/bin/node server/dist/server.js
   Restart=always
   RestartSec=5
   NoNewPrivileges=true
   PrivateTmp=true

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   sudo systemctl enable --now azmoonrahbari
   ```

7. **Terminate TLS in front of it.** The app speaks plain HTTP; HTTPS is the
   proxy's job. Minimal nginx:

   ```nginx
   server {
     listen 443 ssl http2;
     server_name example.com;

     ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

     client_max_body_size 6m;   # must exceed MAX_UPLOAD_BYTES

     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_set_header Host              $host;
       proxy_set_header X-Real-IP         $remote_addr;
       proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   ```

   Set `TRUST_PROXY=true` so rate limiting sees real client IPs.

**Upgrading**: pull, `npm ci`, `npm run db:migrate`, `npm run build`, restart the
service. Migrations are additive, so the old process can keep serving while they
run.

---

## Backups

Two things must be backed up together — one without the other leaves questions
or results pointing at files that no longer exist:

**1. The database**

```bash
mysqldump --single-transaction --routines --default-character-set=utf8mb4 \
  -u azmoon -p azmoonrahbari | gzip > backup-$(date +%F).sql.gz
```

Restore:

```bash
gunzip -c backup-2026-01-31.sql.gz | mysql -u azmoon -p azmoonrahbari
```

**2. The uploads directory** (`UPLOAD_DIR`, `./uploads` by default)

```bash
tar czf uploads-$(date +%F).tar.gz -C /srv/azmoonrahbari uploads
```

A nightly cron that writes both to off-host storage is enough for this workload.
Verify a restore periodically — an untested backup is a guess.

---

## API reference

Error bodies are uniform everywhere:

```json
{ "error": { "code": "UPPER_SNAKE", "message": "<Persian, display-safe>" } }
```

Stack traces, SQL and driver details are never returned. `422 INCOMPLETE_ANSWERS`
additionally carries `missingQuestionIds`.

### Public (participant session cookie)

| Method | Path                                             | Notes                                          |
| ------ | ------------------------------------------------ | ---------------------------------------------- |
| `GET`  | `/api/public/config`                             | `{ registrationOpen, versionNumber }`          |
| `POST` | `/api/public/attempts/start-or-resume`           | Find-or-create; issues the session + CSRF token |
| `GET`  | `/api/public/attempts/current/bootstrap`         | Everything a screen needs, derived from the session |
| `PUT`  | `/api/public/attempts/current/answers/:questionId` | Idempotent per `clientMutationId`            |
| `POST` | `/api/public/attempts/current/finalize`          | Requires an `Idempotency-Key` header           |
| `GET`  | `/api/public/attempts/current/result`            | `409` until the attempt is complete            |
| `POST` | `/api/public/session/logout`                     | Clears this browser's cookies                  |

`score`, `internalValue` and `scoringMetadata` are stripped in
`server/src/modules/questionnaire/serializers.ts` and never appear on any public
endpoint.

### Admin (admin session cookie + `X-CSRF-Token`)

`POST /api/admin/login` · `POST /logout` · `GET /me` · `GET /dashboard` ·
`GET /characters` · `GET /versions` · `POST /versions/clone-active` ·
`POST /versions/:id/publish` · `GET|POST /versions/:id/questions` ·
`POST /versions/:id/questions/reorder` · `PATCH /questions/:id` ·
`GET /questions/:id/preview` · `PUT|DELETE /questions/:id/image` ·
`POST /questions/:id/options` · `PATCH /options/:id` ·
`PUT|DELETE /options/:id/image` · `GET /participants` ·
`DELETE /participants/:id` · `GET /attempts/:id` · `POST /attempts/:id/reopen` ·
`GET /exports/attempts.csv` · `GET|POST /media` · `DELETE /media/:id`

Every list endpoint is paginated and bounded (`pageSize` ≤ 100).

---

## How scoring works

The scoring map lives in **one place only**: `options.internalValue` in the
database. It is not duplicated in TypeScript constants and never sent to the
client.

1. Each of the 12 scored answers adds `options.score` (1 by default) to the
   character named by its `options.internalValue`.
2. A single highest scorer completes the attempt: status `Completed`, the result
   and score map are stored, and a tracking code is issued if there isn't one.
3. On a tie, if the tie-break question (QT) already has a valid answer for one of
   the tied characters, that wins. Otherwise the API returns
   `outcome: "tie_break_required"` with only the tied characters' options, and
   the attempt stays `InProgress`.
4. After answering QT, the client calls `finalize` again with a **new**
   `Idempotency-Key`.
5. If the tie-break cannot separate them (QT missing, inactive, or with fewer
   than two usable options), the result is resolved deterministically: the tied
   character chosen in the highest-numbered question, and failing that
   `characters.tieOrder` (DAVINCI 1, LINCOLN 2, CHURCHILL 3, EINSTEIN 4,
   EDISON 5).

Finalize runs inside one transaction behind `SELECT … FOR UPDATE` on the attempt
row, and its response is recorded against the `Idempotency-Key`. A retry with the
same key replays the stored response; the same key with a different payload is a
`409 IDEMPOTENCY_CONFLICT`.

Tracking codes are 8 random characters from an alphabet with no `O`/`0` and no
`I`/`1`, unique across attempts.

---

## Security notes

- HTTPS in production; the app refuses to start with `COOKIE_SECURE=false` there.
- Secrets only in the environment. `.env` is gitignored; `.env.example` holds no
  real values.
- Passwords hashed with `scrypt` (N=2^16, r=8, p=1) and compared in constant time.
  Login runs the comparison even for unknown usernames so timing does not reveal
  which accounts exist.
- Cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production. The CSRF
  token is bound to the session it was issued with, so a forged cookie cannot
  match it; mutations also check the request's origin.
- Rate limits on admin login, start-or-resume and finalize.
- Every request body, parameter and query string is validated with Zod; all
  queries go through the ORM as parameterized statements.
- The client is never trusted for scores, versions or completion state.
  **Ownership always comes from the session cookie, never from a
  client-supplied attempt id.**
- `publicId` and `trackingCode` are generated with `crypto` and are not guessable.
- Uploads: JPG/PNG/WebP only, never SVG. The declared MIME type, the file
  extension and the actual magic bytes must all agree; the stored filename is
  generated server-side, and every filesystem path goes through a
  path-traversal guard.
- Logs are minimal and structured, and never contain cookies, tokens or
  passwords.

---

## Operational notes

**Editing content.** Questions and options can only be edited while their version
has **zero attempts**. Once anyone has started, editing would silently change the
meaning of answers already recorded, so the API returns `409 VERSION_IN_USE`
(«برای تغییر، ابتدا نسخهٔ جدید بسازید») and the admin clones a new version
instead. Publishing is transactional and requires at least one active question
with at least two active options each.

**Attempts stay on their own version.** Publishing a new version mid-session does
not change the questions underneath anyone already playing.

**Reopening.** `POST /attempts/:id/reopen` sets the attempt back to
`InProgress`, clears the result fields, keeps the answers and the tracking code,
and increments `reopenCount` and `completionCycle`. The participant is sent back
to the review screen with a notice explaining why.

**Deleting a participant** removes the person, their attempt and all their
answers, permanently. The admin UI requires the participant's full name to be
typed before it will proceed, and says plainly that the person can then register
again from scratch.

**Nothing published?** Registration is disabled and the public site shows a
neutral Persian message with no admin details.

**Rate limiting is in-process.** That is correct for one process. If this is ever
run behind more than one instance, the limiter and the finalize row lock assume a
shared database — the limiter would need a shared store too.

**Local state.** The participant's answers live in IndexedDB (Dexie), namespaced
by attempt and version, and are cleared only after a definitive successful
finalize. `localStorage` holds the theme preference and nothing else.
