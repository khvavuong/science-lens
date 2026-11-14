# Science Lens backend CI/CD

Source repository: `khvavuong/science-lens`, production branch: `main`.

- GitHub Actions `Backend CI/CD` runs typecheck and isolated API/MP4 tests for backend PRs and main pushes. Tests use synthetic media and do not call paid AI providers.
- Only a successful check on main can deploy production. Pull requests never receive the deployment token. Manual workflow runs on main can redeploy.
- CD uses Vercel CLI, so no GitHub App installation by the repository owner is required. Set GitHub Actions secret `VERCEL_TOKEN` to a Vercel token with access to this project; rotate it before its chosen expiry.
- Existing project: `lumoslab-scan-science` in `hungbils-projects`; production URL stays `https://lumoslab-scan-science.vercel.app` so installed apps keep working.
- Vercel project settings: Root Directory `server`, Framework `Fastify`, Node `26.x`. Deploy from the repository root; do not append another server directory.
- Provider/API/Supabase environment variables stay in the existing Vercel project. They are not copied into Git or into build workflow files.
- Supabase remains the same project and private bucket. Database migrations are reviewed and applied separately; deployment does not reset data or run migrations automatically.
- Rollback: revert the faulty commit on main, or promote a previous Ready deployment in Vercel. Do not reset Supabase.
- `science-lens` replaces `scan-science` as the active repository. The old repository is retained for history; do not deploy further changes from it.
- iPhone builds use the existing `ios-sideload.yml`, variable `SCANSCIENCE_API_URL`, and secret `SCANSCIENCE_API_TOKEN` in the new repo.

## Runtime configuration

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

Each poll can claim one planning/image/audio/video step using an expiring database lease.
Video steps run after images/audio, use the stored image as their first frame, and share the 200-second model-chain budget.
Video generation has not been validated against the live provider; errors retain the image fallback.
`waitUntil` keeps that invocation alive after response; each model chain is capped at 200 seconds.
Claims expire after 240 seconds; a lease token fences late writes. A killed step is retried on a later poll.
Errors settle to the existing app fallback; retry resets errors durably before returning.
Closing the app can pause further generation; reopening resumes pending steps.
WAV fallback works without ffmpeg on Vercel, but uses more storage/bandwidth than local MP3.

Pilot token is embedded in the IPA and is NOT per-user authentication. Before wider release add user auth,
per-user database ownership, shared quota/rate limits, and media retention/cleanup. Hosting free tier does not include Gemini usage.

Checks: `npm run typecheck`; `node --import tsx --test src/cloud.test.ts`.
Cloud acceptance still requires authenticated deployment plus create/poll/retry/media tests on that deployment and an iPhone install.
