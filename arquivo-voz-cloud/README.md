# Arquivo Voz — GitHub Actions + Cloudflare R2 (STAGING)

Architecture: Supabase holds only metadata and queue rows. GitHub Actions starts Kokoro on a temporary runner, generates MP3, uploads the MP3 to a **private** Cloudflare R2 bucket, and marks the job `review`. The existing Polly player stays untouched until the new public player is ready.

## Setup requiring the owner's accounts

1. Create a Cloudflare account and a **private** R2 bucket named `arquivo-voz`. Check whether Cloudflare requires payment-method verification and configure billing alerts; the free tier is **not unlimited**.
2. Create a scoped R2 API token with object read/write permissions only for this bucket. Copy the S3 endpoint.
3. In GitHub repository settings, create the protected environment `arquivo-voz-staging` with manual approval if desired. Set environment secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`. Never put them in repository files or public workflow logs.
4. Review and apply `sql/arquivo_voz_cloud.sql` to Supabase. It creates a separate queue with RLS and no browser access. Do not apply until secrets and workflow are ready.
5. Create one short, reviewed sample queue job through a secure administrative process (not public browser insertion). Trigger the workflow **manually** under Actions → Arquivo Voz - Kokoro to R2 (staging). Verify MP3 pronunciation, duration, playback and storage size.

## Remaining production work

- Authenticated V2 enqueue function: verify admin identity and approved revision; create snapshot/hash and a job.
- Reliable dispatch after approval: start GitHub workflow using a securely stored fine-grained token, or scheduled GitHub Actions polling; avoid exposing any GitHub token in browser JavaScript.
- Admin-only R2 preview/approval and expiring signed playback URLs after login. Never expose permanent public R2 links.
- Full-dossier chunk/seek compatibility tests, retry handling, retention policy and budget/usage monitoring.
- Production rollout only after an end-to-end test; Polly remains as rollback until then.

This branch does **not** activate a paid service, create a Cloudflare account, migrate the live database, or replace Polly.
