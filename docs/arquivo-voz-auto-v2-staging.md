# Arquivo Voz — V2 automatic narration (staging, not deployed)

Decision: trigger only when editorial content is explicitly marked complete, generate cloud Kokoro pf_dora 0.92, require manual audio review before public access. Keep production Polly and public narration untouched.

Existing proven path: Supabase arquivo_voz_cloud_jobs -> GitHub Actions staging -> Kokoro -> private Cloudflare R2 -> status review. The successful staging test did not test automatic V2 submission or public playback.

Implementation gates before activation:
1. Map every V2 content type and actual editorial completion transition, including drafts and scheduled cases. Do not equate a save event with completeness.
2. On the server, authenticate admin and validate content readiness; extract the same editorial blocks used by V2. Never trust browser-provided arbitrary text or allow public users to enqueue jobs.
3. Prepare a separate narration script, applying only approved pronunciation dictionary entries. Flag unresolved names/acronyms for review; never silently guess or change factual meaning.
4. Hash source blocks, prepared script, pronunciation dictionary revision and voice config; enqueue idempotently using existing unique(content_type,content_id,source_hash). Changed drafts supersede stale revisions without deleting existing published audio.
5. Dispatch staging Actions only from a secure server-side integration (GitHub App or fine-scoped token). Do not embed GitHub tokens or Supabase service role in V2 JavaScript. Include retry, rate limits and cost ceilings.
6. Verify R2 object existence and size before marking review. Private review playback requires short-lived authorized URLs or a backend proxy; never enable bucket public access.
7. Require an authenticated admin approval action with source-hash recheck and audit trail before any switch to cloud audio. Public login gate and Polly fallback remain in place.
8. Test all content types, rapid edits, stale jobs, foreign names, repeated triggers, worker failure, mobile playback and access control in staging. Roll out only after explicit production authorization.

This branch introduces the conservative preparation module and its tests. It intentionally does not install triggers or alter the production public player.
