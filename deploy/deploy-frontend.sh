#!/usr/bin/env bash
# Build and deploy the Angular client to the dev S3 bucket / CloudFront distribution.
#
# Fixes the "stale index.html" class of bug by setting Cache-Control per file type
# instead of relying on someone remembering to invalidate after every deploy:
#   - index.html: no-cache (always revalidated with S3, so a redeploy is visible
#     immediately — cheap, since revalidation is just a conditional GET)
#   - everything else (JS/CSS, content-hashed via outputHashing: all): cached for
#     a year as immutable, since a content change always means a new filename
set -euo pipefail

PROFILE="stuff-inventory"
BUCKET="stuff-inventory-dev-web"
DIST_DIR="client/dist/client/browser"

cd "$(dirname "$0")/.."

echo "==> Building Angular client (production)"
(cd client && npx ng build --configuration production)

echo "==> Syncing hashed assets (long-lived cache)"
aws s3 sync "$DIST_DIR/" "s3://$BUCKET/" \
  --delete \
  --exclude "index.html" \
  --cache-control "public, max-age=31536000, immutable" \
  --profile "$PROFILE"

echo "==> Uploading index.html (no-cache, always revalidated)"
aws s3 cp "$DIST_DIR/index.html" "s3://$BUCKET/index.html" \
  --cache-control "no-cache" \
  --profile "$PROFILE"

echo "==> Done. https://d3bguqe7gjdkvc.cloudfront.net"
