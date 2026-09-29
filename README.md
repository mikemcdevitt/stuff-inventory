# Stuff Inventory

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-DD0031?style=flat&logo=angular&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazonaws&logoColor=white)

A MEAN-stack app for tracking the physical stuff you own, organized by where it lives. Instead of digging through drawers or the garage to find a model number, you look it up: which location has it, what the make/model/serial number is, and (eventually) where the manual or replacement parts are.

## Problem

Across multiple properties (houses, condos, offices, storage units), it's hard to remember:

- What appliances, tools, bikes, instruments, and electronics you own
- Which location each item is at
- Model and serial numbers, needed for warranty claims, replacement parts, or ordering accessories
- Where the manual or receipt is

Stuff Inventory is a simple system of record for that: **Locations** contain **Items**, and each Item carries the identifying details you'd otherwise have to go find in person.

## Tech Stack (MEAN)

- **MongoDB** — document store for locations and items
- **Express** — REST API server
- **Angular** — frontend SPA
- **Node.js** — runtime for the API server

Supporting choices:
- **Mongoose** for schema/validation on top of MongoDB
- **Multer + Amazon S3** for photo/manual file uploads — the API streams uploads to an S3 bucket rather than local disk (local disk doesn't survive redeploys/scaling on most hosting). Can move to presigned client-to-S3 uploads later if uploads need to scale past what proxying through the API comfortably handles.
- **Auth: Google OAuth** — sign in with Google (via Google Identity Services), gated by an allowlist of authorized email addresses (`ALLOWED_EMAILS`). No passwords to manage. Good enough for a single user or small household; can grow into per-user data with real accounts later.

## Core Concepts

### Location
A place where things live: a house, condo, office, storage unit, etc. Locations can optionally have sub-locations (rooms) for finer-grained organization, but that's not required to start.

| Field | Type | Notes |
|---|---|---|
| name | string | e.g. "Lake House", "Downtown Condo", "Office" |
| type | string | house / condo / office / storage / other |
| address | string | optional |
| notes | string | optional |

### Item
A physical thing worth tracking — appliances, bikes, musical instruments, tools, electronics, furniture, etc.

| Field | Type | Notes |
|---|---|---|
| name | string | e.g. "Kitchen Refrigerator", "Trek Road Bike" |
| category | string | appliance / bike / instrument / electronics / tool / furniture / other |
| location | ref → Location | where it currently is |
| brand | string | e.g. "LG", "Trek", "Yamaha" |
| modelNumber | string | the detail you need for parts/manuals |
| serialNumber | string | the detail you need for warranty/support |
| purchaseDate | date | optional |
| purchasePrice | number | optional |
| purchasedFrom | string | optional, retailer/store |
| warrantyExpiration | date | optional |
| attachments | array | manuals/photos/receipts — each stores `kind`, `storage` ('s3' or 'local'), `key`, `originalName`. `url` is never stored — it's a fresh presigned S3 URL (or local path) resolved on every read, since the uploads bucket is private |
| tags | string[] | free-form, e.g. ["kitchen", "needs-filter"] |
| notes | string | free-form |
| createdAt / updatedAt | date | automatic |

Categories start as a fixed list but should be stored as plain strings (not a rigid enum in the DB) so new categories can be added without a migration.

## Key Features (v1)

- **Locations**: create/edit/delete locations; list items per location
- **Items**: create/edit/delete items; assign to a location and category
- **Search & filter**: find an item by name, brand, model number, or serial number across all locations; filter by location or category
- **Manuals & receipts**: attach a link or upload a file (PDF/image) per item
- **Photos**: attach a photo of the item, useful for identifying a nameplate/label
- **Dashboard**: counts of items per location/category, quick links to items missing a model/serial number

## Future Enhancements (not v1)

- Warranty expiration reminders (email/notification)
- Barcode/QR code label generation and scanning to pull up an item
- Multi-user households with shared access and permissions
- Moving an item between locations with a history log
- Import/export (CSV)
- Maintenance log per item (e.g. filter changes, tune-ups)

## API Design (REST)

```
GET    /api/locations
POST   /api/locations
GET    /api/locations/:id
PUT    /api/locations/:id
DELETE /api/locations/:id

GET    /api/items                 ?location=&category=&q=
POST   /api/items
GET    /api/items/:id
PUT    /api/items/:id
DELETE /api/items/:id

POST   /api/items/:id/attachments  (manual/photo upload)
DELETE /api/items/:id/attachments/:attachmentId

POST   /api/auth/google  (body: { credential }, a Google ID token) → { token, user }
GET    /api/auth/me      (requires Authorization: Bearer <token>)
```

`/api/locations` and `/api/items` require `Authorization: Bearer <token>` — get a token by signing in with Google on the client, which exchanges the Google ID token for one of ours.

## Project Structure

```
stuff-inventory/
├── server/                 # Express + Mongoose API
│   ├── src/
│   │   ├── models/         # Location.js, Item.js
│   │   ├── routes/         # locations.js, items.js, auth.js
│   │   ├── controllers/
│   │   ├── middleware/     # auth, upload
│   │   ├── utils/          # s3.js, attachmentUrl.js (presigned URL resolution)
│   │   ├── app.js          # Express app definition
│   │   ├── server.js       # local dev entry point (npm run dev)
│   │   └── lambda.js       # AWS entry point — wraps app.js with serverless-http
│   └── package.json
├── client/                 # Angular SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # models, services, guards, interceptors
│   │   │   ├── dashboard/
│   │   │   ├── login/
│   │   │   ├── locations/
│   │   │   └── items/
│   │   └── ...
│   └── package.json
└── README.md
```

## Deployment (AWS)

The MEAN stack maps cleanly onto a small, low-maintenance AWS setup — no Kubernetes or custom VPC work needed for a household-scale app:

| Piece | AWS service |
|---|---|
| Angular build (static files) | S3 + CloudFront |
| Express/Node API | Lambda (via `serverless-http`) behind an API Gateway HTTP API — no idle cost, scales to zero |
| MongoDB | MongoDB Atlas hosted in an AWS region — simplest, full Mongoose compatibility. (Amazon DocumentDB is an alternative if everything needs to live in one AWS account/VPC, but it's only partially MongoDB-wire-compatible and can trip up newer Mongoose features.) |
| Manuals/photos | S3 bucket, served via presigned URLs |
| Secrets (DB URI, S3 keys) | Lambda environment variables today; AWS Secrets Manager or SSM Parameter Store would be the prod-hardening step |

Originally deployed on Elastic Beanstalk (a single EC2 instance); migrated to Lambda + API Gateway on 2026-09-29 to eliminate the ~$7–8/mo always-on EC2 cost entirely rather than just pausing it between uses. See CHANGELOG.md for the migration notes.

### Dev environment

Live and verified end-to-end with a real Google account, including that a non-allowlisted account is correctly rejected — plus DB read/write, S3 upload, and SPA routing.

- **App**: `https://dev-stuff.otherstuff.info` (or the underlying `https://d3bguqe7gjdkvc.cloudfront.net` — both work) — one CloudFront distribution serves everything:
  - Default behavior → S3 bucket `stuff-inventory-dev-web` (private, read via Origin Access Control) serving the built Angular app. A CloudFront Function rewrites extensionless paths to `/index.html` so client-side routes (e.g. `/items`) work on refresh/deep-link.
  - `/api/*` behavior → an API Gateway HTTP API (`CachingDisabled` + `AllViewerExceptHostHeader` origin request policy, so the `Authorization` header reaches the API; `https-only`, since API Gateway has no plain-HTTP option). Frontend and API are same-origin, so there's no CORS to configure.
- **API**: Lambda function `stuff-inventory-dev-api` (Node.js 22.x, handler `src/lambda.handler`, 256MB/30s), fronted by API Gateway HTTP API `stuff-inventory-dev-api`. The MongoDB connection is cached at module scope (`server/src/lambda.js`) and reused across warm invocations rather than reconnected per-request.
- **Database**: MongoDB Atlas M0 cluster `stuff-inventory-dev`, database `stuff-inventory-dev-db`, username/password auth
- **Uploads**: S3 bucket `stuff-inventory-dev-uploads` (private; the Lambda execution role has scoped access, no static AWS keys on the app). `attachment.url` is a 1-hour presigned URL generated fresh on every read. Upload size capped at 4MB (`server/src/middleware/upload.js`) — API Gateway's Lambda proxy integration hard-caps request bodies at 6MB, and they arrive base64-encoded (~33% larger), so 4MB of real file content stays safely under that.
- **Custom domain**: `dev-stuff.otherstuff.info`, hosted in Route 53 (hosted zone `Z1OJXY7XMX49RI`), with an ACM certificate in us-east-1 attached to the CloudFront distribution as an Alternate Domain Name, and a Route 53 ALIAS record pointing at it.
- **AWS account**: `496739947739` (us-east-1), via a scoped `stuff-inventory-deployer` IAM user (Lambda + API Gateway + CloudFront + Route 53 [scoped to this one hosted zone] + ACM management, S3 access limited to `stuff-inventory-*` buckets) — local CLI profile name `stuff-inventory`
- **Redeploying the API**: `./deploy/deploy-api.sh` — packages `server/src` with production `node_modules` and updates the Lambda function code directly.
- **Redeploying the frontend**: `./deploy/deploy-frontend.sh` — builds and syncs to S3 with per-file `Cache-Control` (long-lived + immutable for hashed JS/CSS, `no-cache` for `index.html`), so changes show up through CloudFront within seconds with no manual invalidation step needed.
- **No shutdown/bring-up needed**: unlike the old Elastic Beanstalk setup, Lambda and API Gateway both scale to zero automatically with no idle cost — nothing to remember to pause between uses.

Prod is a separate, not-yet-started environment — see TASKS.md for the plan (Atlas IAM auth, Secrets Manager, a separate Atlas cluster/project).

## Getting Started

Prerequisites: Node.js, a local MongoDB (`brew install mongodb-community` on macOS, then `brew services start mongodb-community`).

### Google OAuth setup (one-time)

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create (or pick) a project, then create an **OAuth client ID** of type **Web application**.
2. Under **Authorized JavaScript origins**, add `http://localhost:4200` (and your production domain later). No redirect URI is needed — sign-in happens client-side via Google Identity Services.
3. Copy the generated **Client ID** (looks like `xxxx.apps.googleusercontent.com`):
   - Paste it into `server/.env` as `GOOGLE_CLIENT_ID`
   - Paste it into `client/src/environments/environment.ts` as `googleClientId`
4. Set `JWT_SECRET` in `server/.env` to a random string (e.g. `openssl rand -hex 32`) — this signs the app's own session tokens after Google verifies who you are.
5. Set `ALLOWED_EMAILS` in `server/.env` to a comma-separated list of the Google account email(s) allowed to sign in.

```bash
# API server
cd server
cp .env.example .env   # then fill in GOOGLE_CLIENT_ID, JWT_SECRET, ALLOWED_EMAILS
npm install
npm run dev          # http://localhost:3000

# Angular client (separate terminal)
cd client
npm install
npm start             # http://localhost:4200
```

File uploads fall back to local disk (`server/uploads/`) in dev when `S3_BUCKET_NAME` is unset — set the AWS variables in `server/.env` to use S3 instead.

## Status

Scaffolded and verified end-to-end: Express + Mongoose API (Location/Item models, REST routes, S3-or-local-disk file uploads, Google OAuth), an Angular client (standalone components, Locations/Items list/detail/create/edit views, attachment upload UI, dashboard, cross-field search and filtering, Google sign-in), all protected behind an email-allowlisted login. Not yet built: warranty reminders and the other items under Future Enhancements, and production deployment.
