# Render deployment

The root `render.yaml` defines a single **Free** Node web service. It builds
the React frontend and serves it with the Express API on the same origin.
The database remains in the existing Supabase project.

Create the service from this directory in a Git repository using Render's
Blueprint workflow. If this directory is nested in the repository, set its
Render root directory to `InboxIQ-main` and use its `render.yaml`.

Provide `DATABASE_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` from
the local configuration using Render's environment settings. Never commit
`.env.local`. The Blueprint generates `BETTER_AUTH_SECRET`. Render supplies
`RENDER_EXTERNAL_URL`, which the backend uses for its authentication origin.
Leave `VITE_BETTER_AUTH_URL` unset for same-origin requests.

Use Supabase's pooler URI for the database. Replace the exposed database
password in Supabase and update local and hosted settings after rotation.

After deployment, verify `/health`, sign-up, sign-in, session persistence,
and authenticated dashboard data. AI features require `GROQ_API_KEY`;
mail integrations require their respective OAuth and email-delivery settings.
Configure OAuth callbacks with the new public hostname.

Render Free sleeps after 15 minutes without inbound traffic. Its next request
can take about a minute to wake it. Free hosting does not guarantee continuous
availability: https://render.com/docs/free

Local validation of this setup passed: frontend and sign-in routes returned
HTML, health returned JSON, unknown API routes returned JSON 404, and an invalid
sign-in returned the expected 401 instead of a database/server error.
