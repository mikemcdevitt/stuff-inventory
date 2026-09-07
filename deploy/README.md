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

1. Copy the template and fill in the real secrets (from `server/.env`, or wherever you're keeping them):

   ```bash
   cp deploy/eb-options.example.json deploy/eb-options.json
   # edit deploy/eb-options.json: MONGODB_URI, GOOGLE_CLIENT_ID, JWT_SECRET, ALLOWED_EMAILS
   ```

   `deploy/eb-options.json` is gitignored — never commit it.

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

3. **Important**: Elastic Beanstalk assigns a new random CNAME every time an environment is created — it will *not* be `stuff-inventory-dev.eba-2da8ez7g.us-east-1.elasticbeanstalk.com` again. Get the new one:

   ```bash
   aws elasticbeanstalk describe-environments --application-name stuff-inventory --environment-names stuff-inventory-dev --profile stuff-inventory --query "Environments[0].CNAME" --output text
   ```

4. Update the CloudFront distribution's API origin to point at the new CNAME. Get the current distribution config and ETag, edit the `eb-api-origin` origin's `DomainName`, then update:

   ```bash
   aws cloudfront get-distribution-config --id E3RRU6B2L1FUN6 --profile stuff-inventory > /tmp/cf-config.json
   # edit /tmp/cf-config.json: replace the eb-api-origin origin's DomainName with the new CNAME from step 3
   # extract the ETag value from the file first, then:
   aws cloudfront update-distribution --id E3RRU6B2L1FUN6 --profile stuff-inventory \
     --distribution-config file:///tmp/cf-config.json --if-match THE_ETAG_FROM_THE_FILE
   ```

   CloudFront takes a few minutes to propagate the change.

5. Verify:

   ```bash
   curl https://d3bguqe7gjdkvc.cloudfront.net/api/health
   ```

## One-time setup (already done, for reference only)

The IAM roles/user, S3 buckets, Origin Access Control, CloudFront Function, and CloudFront distribution itself are all persistent and were created once — see git history around the "Deploy API to Elastic Beanstalk" and "Deploy Angular client to S3 + CloudFront" commits for the exact commands if any of these ever need to be rebuilt from scratch.
