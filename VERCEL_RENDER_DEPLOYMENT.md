# Vercel frontend + Render backend + Supabase database

1. Deploy the Node service with `render.yaml`, selecting Free.
   Use the existing Supabase pooler `DATABASE_URL` and a generated
   `BETTER_AUTH_SECRET`. Do not commit `.env.local` or upload the source ZIP
   without checking it for secrets.
2. Once Render returns its real backend URL, run:
   `node scripts/configure-vercel.mjs https://YOUR-SERVICE.onrender.com`.
   This routes API calls through the Vercel origin so authentication cookies
   work without third-party cookie access.
3. Deploy this directory to Vercel Hobby as a Vite project. Set only the public
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` on Vercel. Leave
   `VITE_BETTER_AUTH_URL` unset. Never put database credentials on the frontend.
4. On Render, set both `BETTER_AUTH_URL` and `FRONTEND_URL` to the final Vercel
   production origin. Redeploy Render and verify sign-up, sign-in, session
   persistence, and dashboard data through Vercel.
5. Point email-provider OAuth callback URLs to the Vercel origin. AI and email
   services require their respective credentials on Render.

Account connections and actual returned deployment URLs are needed before
steps 1–4 can be completed. Neither deployment has been created by this guide.

Render Free sleeps after 15 minutes without traffic; the API can take about a
minute to wake up. Select only Free/Hobby plans and do not enable paid add-ons.
