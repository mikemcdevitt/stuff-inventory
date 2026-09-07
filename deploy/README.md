# Deploy runbook — dev environment

Reference: [README.md's Dev environment section](../README.md#dev-environment) for what's currently live (URLs, resource names, account).

All commands use the scoped CLI profile: add `--profile stuff-inventory` (already assumed below).

## What costs money vs. what doesn't

Only the Elastic Beanstalk EC2 instance has a meaningful ongoing cost (~$7–8/mo running 24/7). MongoDB Atlas (M0 free tier), the two S3 buckets, and CloudFront are all free or pennies at this project's traffic — there's no reason to ever tear those down. **Only the EB environment is worth shutting down when not in use.**

## Bringing the dev environment down

```bash
aws elasticbeanstalk terminate-environment --environment-name stuff-inventory-dev --profile stuff-inventory
```

Takes a couple of minutes to fully tear down (EC2 instance, Auto Scaling group, security group). The application itself (`stuff-inventory`) and its stored versions in S3 are untouched — only the environment goes away.

## Bringing it back up

1. Make sure `deploy/eb-options.json` exists and has the real secrets filled in (`MONGODB_URI`, `GOOGLE_CLIENT_ID`, `JWT_SECRET`, `ALLOWED_EMAILS`). If it doesn't exist yet: `cp deploy/eb-options.example.json deploy/eb-options.json` and fill it in. **This file is gitignored and is the durable local record of the deployed dev secrets — `server/.env` normally points at a local MongoDB instead, so don't rely on it for these values.** Keep `deploy/eb-options.json` up to date if any of these values ever change (e.g. rotating `JWT_SECRET`), rather than deleting it after use.

2. Recreate the environment, reusing the most recent application version already sitting in S3 (check `aws elasticbeanstalk describe-application-versions --application-name stuff-inventory` for the current version label — `v2` as of this writing):

   ```bash
   aws elasticbeanstalk create-environment \
     --application-name stuff-inventory \
     --environment-name stuff-inventory-dev \
     --solution-stack-name "64bit Amazon Linux 2023 v6.11.7 running Node.js 24" \
     --version-label v2 \
     --option-settings file://deploy/eb-options.json \
     --profile stuff-inventory
   ```

   Wait for it to go `Ready`/`Green`:

   ```bash
   until [ "$(aws elasticbeanstalk describe-environments --application-name stuff-inventory --environment-names stuff-inventory-dev --profile stuff-inventory --query 'Environments[0].Status' --output text)" = "Ready" ]; do sleep 15; done
   ```

3. Verify — tested 2026-09-07: recreating with the same application/environment name in the same account+region gave back the **exact same CNAME** (`stuff-inventory-dev.eba-2da8ez7g.us-east-1.elasticbeanstalk.com`), so CloudFront's origin needed no changes at all and just worked immediately:

   ```bash
   aws elasticbeanstalk describe-environments --application-name stuff-inventory --environment-names stuff-inventory-dev --profile stuff-inventory --query "Environments[0].CNAME" --output text
   curl https://d3bguqe7gjdkvc.cloudfront.net/api/health
   ```

   This isn't something AWS documents as a guarantee, so treat the CNAME check above as a cheap sanity check rather than skipping it — **if it ever does come back different**, update the CloudFront origin:

   ```bash
   aws cloudfront get-distribution-config --id E3RRU6B2L1FUN6 --profile stuff-inventory > /tmp/cf-config.json
   # edit /tmp/cf-config.json: replace the eb-api-origin origin's DomainName with the new CNAME
   # extract the ETag value from the file first, then:
   aws cloudfront update-distribution --id E3RRU6B2L1FUN6 --profile stuff-inventory \
     --distribution-config file:///tmp/cf-config.json --if-match THE_ETAG_FROM_THE_FILE
   ```

   CloudFront takes a few minutes to propagate a distribution config change.

## One-time setup (already done, for reference only)

The IAM roles/user, S3 buckets, Origin Access Control, CloudFront Function, and CloudFront distribution itself are all persistent and were created once — see git history around the "Deploy API to Elastic Beanstalk" and "Deploy Angular client to S3 + CloudFront" commits for the exact commands if any of these ever need to be rebuilt from scratch.
