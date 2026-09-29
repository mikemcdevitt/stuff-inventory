#!/usr/bin/env bash
# Package and deploy the Express API to the dev Lambda function.
#
# Unlike the old Elastic Beanstalk deploy, Lambda needs node_modules bundled
# into the zip — Lambda doesn't run `npm install` for you. Production
# dependencies only, built fresh in a clean staging directory each time.
set -euo pipefail

PROFILE="stuff-inventory"
FUNCTION_NAME="stuff-inventory-dev-api"
SERVER_DIR="server"
STAGE_DIR="$(mktemp -d)"
ZIP_PATH="$STAGE_DIR.zip"

cd "$(dirname "$0")/.."
trap 'rm -rf "$STAGE_DIR" "$ZIP_PATH"' EXIT

echo "==> Staging production dependencies"
cp "$SERVER_DIR/package.json" "$SERVER_DIR/package-lock.json" "$STAGE_DIR/"
cp -r "$SERVER_DIR/src" "$STAGE_DIR/"
(cd "$STAGE_DIR" && npm ci --omit=dev --silent)

echo "==> Packaging"
(cd "$STAGE_DIR" && zip -rq "$ZIP_PATH" . -x "*.DS_Store")

echo "==> Updating Lambda function code"
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --zip-file "fileb://$ZIP_PATH" \
  --profile "$PROFILE" \
  --query "{State:State,LastUpdateStatus:LastUpdateStatus}"

echo "==> Waiting for update to complete"
until [ "$(aws lambda get-function --function-name "$FUNCTION_NAME" --profile "$PROFILE" --query 'Configuration.LastUpdateStatus' --output text)" = "Successful" ]; do
  sleep 2
done

echo "==> Done. https://dev-stuff.otherstuff.info/api/health"
curl -s https://dev-stuff.otherstuff.info/api/health
echo
