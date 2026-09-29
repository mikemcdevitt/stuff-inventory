# Changelog

Notable changes to Stuff Inventory. Not tied to version numbers (no releases yet) — grouped by date instead. See [TASKS.md](TASKS.md) for what's in progress or planned.

## 2026-09-29

### Changed
- **Migrated the dev API from Elastic Beanstalk to Lambda + API Gateway**, eliminating the always-on EC2 instance (~$7–8/mo) in favor of true scale-to-zero compute. The Express app is unchanged except for a new entry point (`server/src/lambda.js`) that wraps it with `serverless-http` and caches the MongoDB connection across warm Lambda invocations instead of reconnecting per request.
- CloudFront's `/api/*` origin repointed from the EB CNAME to the new API Gateway HTTP API (`https-only`, since API Gateway has no plain-HTTP option — EB's origin was `http-only`).
- Max attachment upload size dropped from 20MB to 4MB. API Gateway's Lambda proxy integration hard-caps request bodies at 6MB, delivered base64-encoded (~33% larger than the raw bytes), so 4MB of real file content is the safe ceiling until uploads move to direct-to-S3 presigned URLs (tracked in TASKS.md).
- New IAM role `stuff-inventory-dev-lambda-role`, purpose-named this time (unlike the shared, generically-named `aws-elasticbeanstalk-ec2-role` it replaces) — scoped to CloudWatch Logs plus S3 access on just the uploads bucket.

### Removed
- The Elastic Beanstalk environment, application, and their IAM roles/deploy tooling (`deploy/eb-options.json` and its template) — fully decommissioned after the new stack was verified end-to-end. `deploy/README.md`'s old "terminate between uses to save cost" runbook no longer applies to anything; Lambda and API Gateway have no idle cost to begin with.

### Verified
- Full stack tested end-to-end after the cutover: API Gateway → Lambda → Atlas directly (bypassing CloudFront), then through CloudFront, then through the custom domain — health check, unauthenticated 401, authenticated create/list/delete, and an S3-backed attachment upload/fetch all confirmed working before the EB environment was torn down.

## 2026-09-14

### Added
- Custom domain for dev: `https://dev-stuff.otherstuff.info`, via Route 53 + an ACM certificate (us-east-1) attached to the CloudFront distribution as an Alternate Domain Name. Both the custom domain and the original `*.cloudfront.net` URL work.

### Fixed
- Stale `index.html` on redeploy. Added `deploy/deploy-frontend.sh`, which sets `Cache-Control: public, max-age=31536000, immutable` on hashed JS/CSS and `Cache-Control: no-cache` on `index.html` at upload time — self-enforcing, so no one has to remember a manual CloudFront invalidation after each deploy. Verified for real: a content change to `index.html` appeared through CloudFront within ~2 seconds.

## 2026-09-07

### Added
- Angular client deployed to S3 + CloudFront (dev). One distribution serves both the static frontend (default behavior, private S3 bucket via Origin Access Control) and the API (`/api/*` behavior, proxied to Elastic Beanstalk) — same origin, so no CORS needed, and it resolves the mixed-content issue an HTTP-only API would cause on an HTTPS page.
- A CloudFront Function rewrites extensionless paths to `/index.html` for Angular client-side routing, scoped to the default behavior only so it never intercepts real API error responses.

### Added
- `deploy/README.md` runbook and `deploy/eb-options.example.json` template for shutting down and recreating the dev Elastic Beanstalk environment.

### Verified
- Real Google sign-in confirmed end-to-end on the live dev deployment, including that a non-allowlisted account is correctly rejected.
- Full shutdown/bring-up flow tested for real: terminated the dev environment, confirmed it was actually unreachable, recreated it, and confirmed a full authenticated round trip through CloudFront again. The environment's CNAME came back identical across recreation (not guaranteed by AWS, but observed) — corrected the runbook, which had assumed it would change.

### Fixed
- Runbook pointed to `server/.env` as the source for the deployed dev secrets; that file actually points at local MongoDB. `deploy/eb-options.json` (gitignored) is the real durable record now.

## 2026-09-06

### Added
- Item detail page (`/items/:id`).
- Attachment upload/delete UI on the item detail page, wired to the existing upload API.
- Dashboard/home view: item counts by location and category (clickable through to a filtered items list), and a list of items missing a model or serial number.
- Google OAuth login: Google Identity Services on the client, ID token verification + an `ALLOWED_EMAILS` allowlist on the server, our own signed session JWT. `requireAuth` middleware gates the API.
- Dev environment stood up on AWS: scoped `stuff-inventory-deployer` IAM user, S3 bucket for attachments, MongoDB Atlas M0 cluster, Elastic Beanstalk single-instance environment for the API — verified end-to-end against real infrastructure.

### Fixed
- `location` wasn't populated on the `create`/`addAttachment`/`removeAttachment` item API responses, causing it to briefly show as a raw ObjectId in the UI after those actions.
- Attachment URLs 403'd once S3-backed, because the app returned the permanent (but privately-bucketed) S3 object URL. Attachments now store `storage` + `key`; a fresh presigned URL (or local `/uploads/...` path) is resolved on every read instead.

## 2026-09-05

### Added
- Initial scaffold: README design doc, Express + Mongoose API (Location/Item models, REST routes), Angular client (standalone components, Locations/Items list/create/edit, search and filtering), published to GitHub.
