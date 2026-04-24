# AWS Manual Deploy

This project can be deployed manually from your local machine. You can still push code to GitHub by hand, then run one command or double-click one file to upload the latest build to S3 and refresh CloudFront.

## 1. Prepare AWS

Do not use root access keys.

Use one of these instead:

- IAM Identity Center / SSO profile, recommended.
- A limited IAM deploy user, if you prefer access keys.

The deploy identity needs only:

- `s3:ListBucket`, `s3:GetBucketLocation` on the bucket.
- `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` on bucket objects.
- `cloudfront:CreateInvalidation` on the CloudFront distribution.

Install AWS CLI v2, then check login:

```powershell
aws sts get-caller-identity --profile your-profile-name
```

## 2. Create Local Config

Copy the example file:

```powershell
Copy-Item .\deploy-aws.config.example.json .\deploy-aws.config.json
```

Edit `deploy-aws.config.json`:

```json
{
  "bucket": "your-s3-bucket-name",
  "distributionId": "YOUR_CLOUDFRONT_DISTRIBUTION_ID",
  "region": "ap-northeast-1",
  "profile": "your-profile-name",
  "skipTests": false,
  "skipInvalidation": false
}
```

`deploy-aws.config.json` is ignored by git.

## 3. Deploy

Command-line:

```powershell
.\deploy-aws.ps1
```

Or:

```powershell
npm.cmd run deploy:aws
```

One-click:

```text
deploy-aws.bat
```

The script runs tests, builds the Vite site into `dist/`, uploads those public files, then creates a CloudFront invalidation for `/*`.

Uploaded files:

```text
dist/ contents
```

## Useful Options

Build without tests:

```powershell
.\deploy-aws.ps1 -SkipTests
```

Preview upload changes without writing:

```powershell
.\deploy-aws.ps1 -DryRun
```

Deploy to S3 but skip CloudFront invalidation:

```powershell
.\deploy-aws.ps1 -SkipInvalidation
```

Override config values temporarily:

```powershell
.\deploy-aws.ps1 -Bucket your-bucket -DistributionId E1234567890 -Profile your-profile-name
```
