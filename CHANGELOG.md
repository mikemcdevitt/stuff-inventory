# Changelog

Notable changes to Stuff Inventory. Not tied to version numbers (no releases yet) — grouped by date instead. See [TASKS.md](TASKS.md) for what's in progress or planned.

## 2026-09-07

### Added
- Angular client deployed to S3 + CloudFront (dev). One distribution serves both the static frontend (default behavior, private S3 bucket via Origin Access Control) and the API (`/api/*` behavior, proxied to Elastic Beanstalk) — same origin, so no CORS needed, and it resolves the mixed-content issue an HTTP-only API would cause on an HTTPS page.
- A CloudFront Function rewrites extensionless paths to `/index.html` for Angular client-side routing, scoped to the default behavior only so it never intercepts real API error responses.

### Verified
- Real Google sign-in confirmed end-to-end on the live dev deployment, including that a non-allowlisted account is correctly rejected.

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
