# AGENTS.md

Stuff Inventory: MEAN-stack app (MongoDB, Express, Angular, Node) for tracking physical belongings by location. Full design doc: [README.md](README.md). Working backlog: [TASKS.md](TASKS.md). Deployment runbook: [deploy/README.md](deploy/README.md).

## Running locally

```bash
# API — needs a local MongoDB running (see README's Getting Started)
cd server && cp .env.example .env  # fill in GOOGLE_CLIENT_ID, JWT_SECRET, ALLOWED_EMAILS
npm install && npm run dev          # http://localhost:3000

# Client
cd client && npm install && npm start   # http://localhost:4200
```

## Testing

```bash
cd client && npx ng test && npx ng build   # unit tests + prod build sanity check
```

No server-side test suite yet — verify API changes by hand against a running `npm run dev` instance (curl or the client UI). Always check both a real MongoDB-backed run and, for anything touching `server/src/middleware/upload.js` or `server/src/utils/`, both the local-disk and S3-backed code paths (S3 only activates when `S3_BUCKET_NAME` is set).

## Architecture notes worth knowing before changing things

- **Angular is zoneless** (no `zone.js` dependency) and uses the newer `@Service()` decorator (an alias for `@Injectable({ providedIn: 'root' })`) — this is current Angular CLI (v22) convention here, not a typo.
- **Auth**: Google Identity Services on the client hands a Google ID token to `POST /api/auth/google`, which verifies it server-side (`google-auth-library`) against an `ALLOWED_EMAILS` allowlist, then issues our own JWT. `requireAuth` middleware (`server/src/middleware/auth.js`) gates `/api/locations` and `/api/items`; `/api/auth/*` is public. No user database — the allowlist is the entire user model. Session token lives in `localStorage` on the client; `authInterceptor` attaches it and logs out on any 401.
- **Attachments**: never store a permanent URL. The `Attachment` schema holds `storage` (`'s3'` or `'local'`) + `key`; `server/src/utils/attachmentUrl.js` resolves a fresh URL on every read — a 1-hour presigned S3 URL, or a `/uploads/...` path for local disk. If you add a new place that returns an `Item`, route it through `withResolvedAttachmentUrls`/`withResolvedAttachmentUrlsMany` or attachment links will silently be wrong (permanent, and 403 in the S3 case since the bucket is private).
- **Dev deployment is one CloudFront distribution** in front of two origins: S3 (Angular static build, default behavior) and Elastic Beanstalk (API, `/api/*` behavior). Same-origin, so no CORS config exists or is needed. A CloudFront Function rewrites extensionless paths to `/index.html` for SPA routing — it's attached only to the default (S3) behavior, deliberately, so it never intercepts real API 404/403 responses. Don't add a global `CustomErrorResponse` for 403/404 on the distribution — it would break real API error responses the same way.
- **Shutting down / recreating the EB environment**: tested 2026-09-07 — terminate, recreate, and CloudFront just works again with no changes (the CNAME came back identical). Not an AWS-documented guarantee, so `deploy/README.md`'s bring-up steps still verify the CNAME rather than assume it. The real secrets for recreating it (`MONGODB_URI` etc.) live in the gitignored `deploy/eb-options.json`, not `server/.env` (which normally points at local MongoDB) — keep that file up to date rather than treating it as disposable.
- **AWS access**: use the `stuff-inventory` CLI profile (`--profile stuff-inventory`), a scoped IAM user — not the account's admin credentials. IAM policy/role changes still require the admin profile (the scoped user can't modify its own permissions).

## Conventions

- No comments unless explaining a non-obvious *why* (see existing files for the bar).
- Commit messages and PR descriptions end with the attribution line currently in force for this session — check recent `git log` for the exact wording.
- Keep TASKS.md current: check items off in the same commit (or an immediately following one) as the work that completes them, and add new items when scope is discovered mid-task rather than silently expanding the current change.
