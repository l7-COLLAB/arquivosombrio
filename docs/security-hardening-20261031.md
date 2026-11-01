# Public access security corrections — 2026-10-31

The Supabase migration `20261031191953_harden_public_access.sql` was applied to
`iuhotznurbyujzbyhizf`. No editorial or account records were deleted.

- Legacy comment e-mails are restricted to their owner or administrators. Anonymous
  access to legacy comments, suggestions and image submissions was removed.
- Suggestions and audio metrics go through `public-contribution-submit`, with bounded
  bodies, server-owned identity/moderation fields, validation and atomic per-identity
  and global limits. The frontend reports suggestion delivery only after success.
- `visual_site_public` and `home_featured_public` contain only the current safe
  display configuration. Private trigger functions update these projections after
  administrative changes. History remains accessible to administrators.
- Restrictive publication-time policies protect scheduled articles and chapters.
  Service-role public audio queries also enforce release time.
- Forum replies follow the visibility of their parent thread.
- API roles no longer have TRUNCATE, REFERENCES, TRIGGER or public-schema CREATE.
- Lite playback verifies the user session and applies rate limits. Public availability
  responses contain no audio URLs. Credentials are sent in headers, never query strings.
- All updated R2 signing paths explicitly set `X-Amz-Expires`: playback/preview URLs
  use 600 seconds and upload URLs use 900 seconds. The previous top-level `expires`
  option was ignored by aws4fetch, producing a 24-hour default.
- Lite renders account names and auth errors as text. Its scheduled rebuild reapplies
  the fix so the separate generator cannot restore the old behavior.
- The final Pages build adds a per-page CSP with exact inline-script hashes and a
  referrer policy after HTML generation. It does not claim to configure HTTP headers.

## Validation

Live anonymous requests to Lite playback, legacy e-mails and visual history return
401. Public availability and safe display projections return 200. Anonymous article
counts remained 22 dossiês, 47 daily/special records, 16 forensic records, 8 legends,
8 creepypastas and 226 chapters. SQL role tests preserve administrative history access.

Nine security behavior tests cover absent/invalid sessions, rate limits, approved
playback, 600-second URLs, input validation, server-owned identity, metadata filtering
and rebuild persistence. Two Python tests check CSP hashes and repeat builds.
Signup/CAPTCHA, admin, special-event and accessibility regressions also pass.

The existing reader-bookmark test uses old literal cache-version strings and fails
on the unchanged `caso.html`; this is independent of these corrections. Full Deno
type checking and Chromium UI checks could not run because dependency/browser
downloads were unavailable. Syntax, handler behavior and live API tests were run.

## Remaining host/account settings

- Supabase leaked-password protection is still disabled; the connected Supabase tools
  do not expose the Auth configuration update required to enable it.
- HSTS, frame-ancestors/X-Frame-Options, nosniff and Permissions-Policy require an HTTP
  host/proxy configuration. The connected Cloudflare account returned no zone for
  `arquivosombrio.net.br`; do not claim these headers are deployed on GitHub Pages.
- Previously issued signed audio URLs can remain valid until their original expiry.
  New authentication checks cannot revoke a previously issued R2 signature.

The account-deletion SECURITY DEFINER advisory is intentional: the function checks
auth.uid() and operates on that user's own contributions. Ten service-only tables
intentionally have RLS and no client policies; they must not be opened to silence INFO.
