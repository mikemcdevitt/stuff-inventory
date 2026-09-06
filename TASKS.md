# Tasks

Working backlog, grouped so each group is roughly one commit (or a short related series). Check items off as they land; add new ones as they come up.

## Next up

- [x] **Item detail page**
  - Route/component to view a single item (all fields, not just the list columns)
  - Link from the item list row to the detail page
- [x] **Attachment upload UI**
  - File input on the item detail page (manual/photo/receipt), wired to the existing `POST /api/items/:id/attachments`
  - List existing attachments on the detail page with a delete action (`DELETE /api/items/:id/attachments/:attachmentId` already exists)
- [ ] **Dashboard / home view**
  - Counts of items per location and per category
  - Quick links to items missing a model number or serial number
- [ ] **Basic auth**
  - Single-user login (household-shared credentials are fine for v1)
  - Protect the API routes and the Angular routes behind it

## Deployment

- [ ] Stand up MongoDB Atlas cluster (AWS region) and point `MONGODB_URI` at it
- [ ] Create S3 bucket for attachments, wire up `AWS_*` / `S3_BUCKET_NAME` env vars
- [ ] Deploy API to Elastic Beanstalk (or a single Fargate service)
- [ ] Build Angular client and deploy to S3 + CloudFront
- [ ] Secrets in AWS Secrets Manager / SSM Parameter Store instead of `.env`

## Later / backlog

- [ ] Warranty expiration reminders (email/notification)
- [ ] QR/barcode label generation + scanning to jump to an item
- [ ] Multi-user households with shared access and permissions
- [ ] Move-between-locations history log
- [ ] CSV import/export
- [ ] Maintenance log per item (filter changes, tune-ups, etc.)
- [ ] Sub-locations / rooms within a location
