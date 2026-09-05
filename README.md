# Stuff Inventory

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
- Auth: single-user or small-household to start — a simple login is enough; can grow into multi-user with shared/shared-household access later

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
| manualUrl | string | link to a manufacturer manual page, or an uploaded file |
| photoUrl | string | optional photo of the item or its label/nameplate |
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
```

## Project Structure

```
stuff-inventory/
├── server/                 # Express + Mongoose API
│   ├── src/
│   │   ├── models/         # Location.js, Item.js
│   │   ├── routes/         # locations.js, items.js
│   │   ├── controllers/
│   │   ├── middleware/     # auth, upload
│   │   └── app.js
│   └── package.json
├── client/                 # Angular SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── locations/
│   │   │   ├── items/
│   │   │   └── shared/
│   │   └── ...
│   └── package.json
└── README.md
```

## Deployment (AWS)

The MEAN stack maps cleanly onto a small, low-maintenance AWS setup — no Kubernetes or custom VPC work needed for a household-scale app:

| Piece | AWS service |
|---|---|
| Angular build (static files) | S3 + CloudFront |
| Express/Node API | Elastic Beanstalk or a single ECS Fargate service (EC2/Lightsail also fine to start) |
| MongoDB | MongoDB Atlas hosted in an AWS region — simplest, full Mongoose compatibility. (Amazon DocumentDB is an alternative if everything needs to live in one AWS account/VPC, but it's only partially MongoDB-wire-compatible and can trip up newer Mongoose features.) |
| Manuals/photos | S3 bucket, served via CloudFront or direct S3 URLs |
| Secrets (DB URI, S3 keys) | AWS Secrets Manager or SSM Parameter Store |

Start with Elastic Beanstalk for the API, Atlas for Mongo, and S3 + CloudFront for the built Angular app and file storage; revisit if scale or team size ever demands more.

## Getting Started

Prerequisites: Node.js, a local MongoDB (`brew install mongodb-community` on macOS, then `brew services start mongodb-community`).

```bash
# API server
cd server
cp .env.example .env
npm install
npm run dev          # http://localhost:3000

# Angular client (separate terminal)
cd client
npm install
npm start             # http://localhost:4200
```

File uploads fall back to local disk (`server/uploads/`) in dev when `S3_BUCKET_NAME` is unset — set the AWS variables in `server/.env` to use S3 instead.

## Status

Scaffolded and verified end-to-end: Express + Mongoose API (Location/Item models, REST routes, S3-or-local-disk file uploads) and an Angular client (standalone components, Locations and Items list/create/edit views, cross-field search and filtering). Not yet built: attachment upload UI, warranty reminders, auth, and the other items under Future Enhancements.
