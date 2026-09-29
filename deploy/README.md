# Deploy runbook — dev environment

Reference: [README.md's Dev environment section](../README.md#dev-environment) for what's currently live (URLs, resource names, account).

All commands use the scoped CLI profile: add `--profile stuff-inventory` (already assumed below).

## Architecture (serverless, migrated 2026-09-29)

- **Frontend**: Angular build in S3 (`stuff-inventory-dev-web`), served through CloudFront
- **API**: Express app wrapped with `serverless-http`, running on **Lambda** (`stuff-inventory-dev-api`), fronted by an **API Gateway HTTP API**, proxied through the same CloudFront distribution's `/api/*` behavior
- **Database**: MongoDB Atlas M0
- **Uploads**: S3, presigned URLs

Unlike the old Elastic Beanstalk setup, **there's no always-on compute to shut down between uses** — Lambda and API Gateway both scale to zero automatically and cost nothing when idle. The old "terminate the environment when not in use" workflow this runbook used to document no longer applies to anything. (EB is retired; see CHANGELOG.md if you need the old runbook for reference.)

## Redeploying the API

```bash
./deploy/deploy-api.sh
```

Builds a clean `node_modules` (production deps only — Lambda doesn't run `npm install` for you, unlike EB) in a temp directory, zips it with `server/src`, and calls `aws lambda update-function-code`. Takes well under a minute.

## Redeploying the frontend

```bash
./deploy/deploy-frontend.sh
```

Unchanged by the serverless migration — still builds the Angular app and syncs to S3 with the right `Cache-Control` headers (see AGENTS.md for why that matters).

## Updating environment variables / secrets

```bash
aws lambda update-function-configuration \
  --function-name stuff-inventory-dev-api \
  --environment "Variables={MONGODB_URI='...',GOOGLE_CLIENT_ID='...',JWT_SECRET='...',ALLOWED_EMAILS='...',S3_BUCKET_NAME='stuff-inventory-dev-uploads'}" \
  --profile stuff-inventory
```

**This replaces `update-function-configuration`'s existing `Variables` map wholesale** — always pass all of them, not just the one you're changing, or you'll silently drop the others. There's no local file that mirrors these (unlike the old `deploy/eb-options.json`) — keep them in a password manager or similar if you need a durable record outside AWS itself. `AWS_REGION` is a Lambda-reserved variable name and gets set automatically; never try to set it yourself, the API call will fail.

## One-time setup (already done, for reference only)

- **IAM**: `stuff-inventory-dev-lambda-role` (trusts `lambda.amazonaws.com`; `AWSLambdaBasicExecutionRole` managed policy + an inline policy scoped to `s3:PutObject`/`GetObject`/`DeleteObject`/`ListBucket` on `stuff-inventory-dev-uploads` only). The `stuff-inventory-deployer` user has `AWSLambda_FullAccess`, `AmazonAPIGatewayAdministrator`, and `iam:PassRole` scoped to this role (plus the still-attached, now-unused EB permissions — see CHANGELOG.md).
- **Lambda**: `stuff-inventory-dev-api`, Node.js 22.x runtime, handler `src/lambda.handler`, 256MB memory, 30s timeout.
- **API Gateway**: HTTP API `stuff-inventory-dev-api`, quick-created with a Lambda proxy target — this auto-creates a `$default` route/stage but does **not** grant the Lambda resource-based invoke permission, so `aws lambda add-permission` (principal `apigateway.amazonaws.com`, source ARN `arn:aws:execute-api:us-east-1:496739947739:<api-id>/*/*`) is a required extra step, easy to miss.
- **CloudFront**: the existing distribution's `/api/*` origin was repointed from the EB CNAME to the API Gateway's `execute-api` domain (`OriginProtocolPolicy: https-only` — API Gateway has no plain-HTTP option, unlike EB). Same `CachingDisabled` + `AllViewerExceptHostHeader` policies as before; no other changes needed since S3 origin, Origin Access Control, the SPA-routing CloudFront Function, custom domain, and ACM cert are all frontend-side and untouched by this migration.

See git history around the "Migrate dev API to Lambda + API Gateway" commit for the exact commands if any of this ever needs rebuilding.
