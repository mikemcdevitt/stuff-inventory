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

Before deploying a server change, it's also worth invoking `server/src/lambda.js`'s handler directly with a hand-built API Gateway v2 event (see git history around the Lambda migration commit for an example) — cheaper than a full deploy-and-curl cycle for catching handler-level mistakes.

## Architecture notes worth knowing before changing things

- **Angular is zoneless** (no `zone.js` dependency) and uses the newer `@Service()` decorator (an alias for `@Injectable({ providedIn: 'root' })`) — this is current Angular CLI (v22) convention here, not a typo.
- **Auth**: Google Identity Services on the client hands a Google ID token to `POST /api/auth/google`, which verifies it server-side (`google-auth-library`) against an `ALLOWED_EMAILS` allowlist, then issues our own JWT. `requireAuth` middleware (`server/src/middleware/auth.js`) gates `/api/locations` and `/api/items`; `/api/auth/*` is public. No user database — the allowlist is the entire user model. Session token lives in `localStorage` on the client; `authInterceptor` attaches it and logs out on any 401.
- **Attachments**: never store a permanent URL. The `Attachment` schema holds `storage` (`'s3'` or `'local'`) + `key`; `server/src/utils/attachmentUrl.js` resolves a fresh URL on every read — a 1-hour presigned S3 URL, or a `/uploads/...` path for local disk. If you add a new place that returns an `Item`, route it through `withResolvedAttachmentUrls`/`withResolvedAttachmentUrlsMany` or attachment links will silently be wrong (permanent, and 403 in the S3 case since the bucket is private).
- **Dev deployment is one CloudFront distribution** in front of two origins: S3 (Angular static build, default behavior) and an API Gateway HTTP API → Lambda (API, `/api/*` behavior). Same-origin, so no CORS config exists or is needed. A CloudFront Function rewrites extensionless paths to `/index.html` for SPA routing — it's attached only to the default (S3) behavior, deliberately, so it never intercepts real API 404/403 responses. Don't add a global `CustomErrorResponse` for 403/404 on the distribution — it would break real API error responses the same way.
- **Always redeploy the frontend via `deploy/deploy-frontend.sh`**, not a raw `aws s3 sync`. It sets `Cache-Control` per file type (long-lived immutable for hashed JS/CSS, `no-cache` for `index.html`) so a redeploy is visible through CloudFront within seconds — a plain sync would let CloudFront serve a stale `index.html` referencing since-deleted hashed asset files for up to a day.
- **API runs on Lambda** (`server/src/lambda.js`, wraps the Express app with `serverless-http`), not Elastic Beanstalk — that was retired 2026-09-29. Redeploy via `deploy/deploy-api.sh`, which bundles production `node_modules` into the zip (Lambda doesn't `npm install` for you, unlike EB). The MongoDB connection is cached at module scope and reused across warm invocations — don't move that connection logic inside the handler function or it'll reconnect on every request. Uploads are capped at 4MB (`server/src/middleware/upload.js`) because of API Gateway's 6MB Lambda-proxy payload limit plus base64 overhead — raising it means moving to direct client-to-S3 presigned uploads instead, not just bumping the multer limit.
- **No idle cost, so no shutdown/bring-up cycle** — this was a whole workflow under Elastic Beanstalk (`deploy/README.md` used to document terminating/recreating the environment between uses); Lambda and API Gateway both scale to zero for free, so there's nothing to remember to pause anymore.
- **AWS access**: use the `stuff-inventory` CLI profile (`--profile stuff-inventory`), a scoped IAM user — not the account's admin credentials. IAM policy/role changes still require the admin profile (the scoped user can't modify its own permissions). Quick-creating an API Gateway HTTP API with `--target <lambda-arn>` does *not* grant the Lambda resource-based invoke permission automatically — `aws lambda add-permission` for principal `apigateway.amazonaws.com` is an easy-to-miss extra step.

## Conventions

- No comments unless explaining a non-obvious *why* (see existing files for the bar).
- Commit messages and PR descriptions end with the attribution line currently in force for this session — check recent `git log` for the exact wording.
- Keep TASKS.md current: check items off in the same commit (or an immediately following one) as the work that completes them, and add new items when scope is discovered mid-task rather than silently expanding the current change.
