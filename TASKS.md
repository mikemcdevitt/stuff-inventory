# Tasks

Working backlog, grouped so each group is roughly one commit (or a short related series). Check items off as they land; add new ones as they come up.

## Next up

- [x] **Item detail page**
  - Route/component to view a single item (all fields, not just the list columns)
  - Link from the item list row to the detail page
- [x] **Attachment upload UI**
  - File input on the item detail page (manual/photo/receipt), wired to the existing `POST /api/items/:id/attachments`
  - List existing attachments on the detail page with a delete action (`DELETE /api/items/:id/attachments/:attachmentId` already exists)
- [x] **Dashboard / home view**
  - Counts of items per location and per category
  - Quick links to items missing a model number or serial number
- [x] **Basic auth**
  - Google OAuth sign-in, gated by an `ALLOWED_EMAILS` allowlist (see README)
  - Protect the API routes and the Angular routes behind it
  - **Still needed before this actually works**: create a Google OAuth client ID (see README's "Google OAuth setup") and set `GOOGLE_CLIENT_ID` / `JWT_SECRET` / `ALLOWED_EMAILS` in `server/.env`, plus `googleClientId` in `client/src/environments/environment.ts`

## Deployment

### Dev environment (AWS account 496739947739, us-east-1)

- [x] IAM bootstrap: `aws-elasticbeanstalk-service-role` / `aws-elasticbeanstalk-ec2-role`, scoped `stuff-inventory-deployer` IAM user (EB management + S3 access limited to `stuff-inventory-*` buckets), local `stuff-inventory` CLI profile
- [x] S3 bucket `stuff-inventory-dev-uploads` for attachments (private, public access blocked; EC2 instance role granted scoped access — no static AWS keys in the app)
- [x] MongoDB Atlas dev cluster (M0, us-east-1), database `stuff-inventory-dev-db` — using a database username/password for dev (simpler than IAM auth; see prod note below), `0.0.0.0/0` network access (acceptable for dev only — EB single-instance has no fixed IP)
- [x] Deploy API to Elastic Beanstalk (`stuff-inventory` app, `stuff-inventory-dev` environment, single-instance tier) — live at `stuff-inventory-dev.eba-2da8ez7g.us-east-1.elasticbeanstalk.com`, verified end-to-end (auth, DB read/write, S3 upload all confirmed against the real deployment)
- [x] **Fix: attachment URLs 403 when S3-backed.** Attachments now store `storage` ('s3'/'local') + `key` instead of a permanent URL; `attachment.url` is resolved on every read (list/get/create/update/add/remove) — a 1-hour presigned GET URL for S3, a `/uploads/...` path for local disk. Verified against the real dev deployment: upload → presigned URL → direct fetch all returned real file content.
- [x] Build Angular client and deploy to S3 + CloudFront — live at `https://d3bguqe7gjdkvc.cloudfront.net`. One distribution serves both: default behavior → S3 (`stuff-inventory-dev-web` bucket, private, read via Origin Access Control), `/api/*` behavior → the Elastic Beanstalk origin (`CachingDisabled` + `AllViewerExceptHostHeader` origin request policy so the `Authorization` header reaches the API). A CloudFront Function on the default behavior rewrites extensionless paths to `/index.html` for Angular client-side routing, scoped so it never touches `/api/*`. Same-origin frontend+API means no CORS needed. Verified: static page loads, SPA deep-link routing, `/api/health`, and a full authenticated create/list/delete round trip all confirmed through the CloudFront domain.
- [ ] Add the CloudFront dev URL (`https://d3bguqe7gjdkvc.cloudfront.net`) to the Google OAuth client's Authorized JavaScript origins — needs confirming it's actually saved in Google Cloud Console before Google Sign-In will work on the deployed frontend
- [ ] **Cache invalidation on redeploy.** `index.html` isn't content-hashed (the JS/CSS bundles are, via `outputHashing: all`), so after a future frontend redeploy, CloudFront may keep serving a cached `index.html` that references since-deleted hashed asset files until it expires or is invalidated. Next deploy should either run `aws cloudfront create-invalidation --paths /index.html` after the S3 sync, or set `Cache-Control: no-cache` on `index.html` at upload time.

### Prod environment (not started)

- [ ] Look into a serverless architecture (Lambda + API Gateway via `serverless-http`, or App Runner) instead of always-on EC2 — avoids idle compute cost, worth it once traffic is real
- [ ] Use MongoDB Atlas AWS IAM authentication instead of a DB password — ties DB access to the compute's IAM role instead of a stored secret. Needs a purpose-named role (not the generic `aws-elasticbeanstalk-ec2-role` default) so access doesn't leak to unrelated future resources that reuse that default name
- [ ] Secrets in AWS Secrets Manager / SSM Parameter Store instead of plain env vars
- [ ] Separate MongoDB Atlas cluster/project from dev (or at minimum a separate database + user) for real data isolation

## Later / backlog

- [ ] Warranty expiration reminders (email/notification)
- [ ] QR/barcode label generation + scanning to jump to an item
- [ ] Multi-user households with shared access and permissions
- [ ] Move-between-locations history log
- [ ] CSV import/export
- [ ] Maintenance log per item (filter changes, tune-ups, etc.)
- [ ] Sub-locations / rooms within a location
