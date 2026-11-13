# Vercel + Supabase (personal iPhone pilot)

Deploy `server/` as the Vercel project root, Node 22, Fastify / Fluid Compute, maxDuration 300 seconds.
Apply `../supabase/migrations/*_cloud_story_jobs.sql` once to a dedicated Supabase project.

Server-only environment variables:
- `GEMINI_KEY`
- `SUPABASE_URL=https://vrmytejjtpagpzgedsuf.supabase.co`
- `SUPABASE_SECRET_KEY` (secret key, never put in app or Git)
- `APP_API_TOKEN` (random pilot access token)

App build: `EXPO_PUBLIC_API_URL` = deployed HTTPS origin; `EXPO_PUBLIC_API_TOKEN` = pilot access token.
GitHub workflow reads variable `SCANSCIENCE_API_URL` and secret `SCANSCIENCE_API_TOKEN`.
Rebuild and sideload IPA after changing these. The installed LAN build does not change automatically.

Stories live in Postgres; media uses the private `story-media` bucket with signed redirects.
Camera images are never persisted. Media URLs are bearer capabilities: anyone with the URL may read that media.
Database and RPC access are service-role only; no client RLS policies is intentional.

Each poll can claim one planning/image/audio step using an expiring database lease.
`waitUntil` keeps that invocation alive after response; each model chain is capped at 200 seconds.
Claims expire after 240 seconds; a lease token fences late writes. A killed step is retried on a later poll.
Errors settle to the existing app fallback; retry resets errors durably before returning.
Closing the app can pause further generation; reopening resumes pending steps.
WAV fallback works without ffmpeg on Vercel, but uses more storage/bandwidth than local MP3.

Pilot token is embedded in the IPA and is NOT per-user authentication. Before wider release add user auth,
per-user database ownership, shared quota/rate limits, and media retention/cleanup. Hosting free tier does not include Gemini usage.

Checks: `npm run typecheck`; `node --import tsx --test src/cloud.test.ts`.
Cloud acceptance still requires authenticated deployment plus create/poll/retry/media tests on that deployment and an iPhone install.
