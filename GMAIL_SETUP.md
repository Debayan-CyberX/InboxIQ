# Gmail connection on the Vercel / Render deployment

Enable Gmail API in the Google Cloud project, configure the OAuth consent screen,
and add your Gmail address under Audience → Test users while the app is in Testing.
Use a Web application OAuth client with:

- JavaScript origin: `https://inboxiq.debx.co.in`
- Redirect URI: `https://inboxiq.debx.co.in/api/email-connections/callback`
- Scopes: `https://www.googleapis.com/auth/gmail.readonly` and `https://www.googleapis.com/auth/gmail.send`

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` on the
existing Render backend. Keep credentials out of Git and frontend VITE variables.
The backend also needs its existing DATABASE_URL, BETTER_AUTH_SECRET, and FRONTEND_URL.
For local development use the corresponding localhost callback in Google Console
and GOOGLE_REDIRECT_URI; use a private BETTER_AUTH_SECRET on the local server.

After signing in to InboxIQ, choose Connect email → Google / Gmail and approve
Google's requested access. The callback imports up to 100 recent conversations in
four batches of 25. Load older conversations continues pagination. Manual Sync
refreshes recent messages. The visible workspace polls recent messages every three
minutes; polling stops when the tab is hidden or the workspace is closed. This
does not provision any paid worker, scheduler, or service. Render Free may cold start.
Google Testing-mode grants with Gmail scopes can expire after seven days; reconnect
when asked. A public launch requires Google's applicable OAuth verification.

Imports preserve message dates, direction, plain text/HTML, and existing lead
matches, skip drafts and file attachments, and avoid duplicate messages. New
correspondents are not automatically marked as sales leads. A failed sync remains
visible in connection settings. Disconnect removes locally stored OAuth tokens.
The existing Compose sender is a separate integration; Gmail sending is not
implemented by this sync change.

Apply `supabase/migrations/20261017_protect_email_connection_tokens.sql` so browser
database roles cannot read OAuth tokens. Email connection operations use the
session-authenticated backend; those endpoints never return tokens.

Validation: `npm test`, `npm run type:check`, and `npm run build`. Actual Google
consent must be completed by the mailbox owner; simulated provider tests do not
prove authorization of a real Gmail account.

Gmail reads are paced and serialized, including inline-body requests. Temporary
rate limits and server errors receive bounded exponential backoff. Quota failures
remain retryable during visible-workspace polling; they do not require reconnecting.
Each completed batch refreshes the inbox so conversations appear during import.
