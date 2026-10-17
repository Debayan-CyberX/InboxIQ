# InboxIQ's conversation-to-opportunity workflow

1. Connect Gmail and import recent conversations. Subsequent syncs are incremental
   and preserve Gmail message identifiers.
2. While the workspace is visible, InboxIQ reviews new or changed conversations.
   Obvious automated mail and newsletters are excluded from lead detection. Other
   conversations use the configured Groq model and validated JSON results.
3. A qualified opportunity creates or links a lead by email address within the
   current user's workspace. Existing lead stages and edited drafts are preserved.
4. Next steps depend on the latest real message: reply to inbound requests, wait
   after recent outbound mail, or consider a follow-up after three days. A sent
   message does not permanently exclude a lead from future follow-ups.
5. With AI enabled and automatic drafts enabled, qualifying conversations receive
   a contextual draft for review. Otherwise, prepare a response from the lead.
6. Edit and review the saved draft before choosing Send. The backend sends the
   authoritative saved text through an owned, connected Gmail account and updates
   delivery state only after Gmail confirms acceptance. No automatic sending.

The status banner shows analysis progress, interruptions, and whether AI is
available. Free-tier limits pause and retry analysis. The server caches analysis
against the last real message, so repeats do not consume AI requests unnecessarily.
Your AI toggle, confidence threshold, automatic-draft preference and tone apply.
When AI is unavailable or disabled, conservative rules and clearly labeled template
drafts remain available; templates are never presented as AI-generated responses.

## Server configuration

- Keep the existing database and Better Auth configuration. Use the Supabase shared
  session pooler on port 5432 for DATABASE_URL. Port 6543 transaction pooling does
  not preserve the session locks used to serialize sync and analysis jobs.
- Set GROQ_API_KEY and GROQ_MODEL on Render, never in VITE-prefixed variables.
- The verified model for this deployment is `openai/gpt-oss-20b`.
- Gmail uses the existing GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and the
  previously approved Gmail read/send scopes.
- Apply `supabase/migrations/20261017_conversation_intelligence.sql`.

No worker, paid scheduler, new database, paid plan, or external sender is needed.
Analysis and polling resume while the workspace is open. A draft with uncertain
delivery is marked failed and is not blindly resent; check Gmail Sent first.
Sending supports one recipient and plain-text messages. File attachments and
delivery/open tracking are outside this workflow.

## Verification

`npm test`, `npm run type:check`, `npm run build`, plus opt-in database integration
tests using GMAIL_TEST_DATABASE_URL. Synthetic provider tests cover the complete
lead/draft/task/send path, ownership isolation, repeat analysis, header validation,
idempotent delivery, and uncertain delivery. Real AI was also verified using a
synthetic business inquiry. Delivery tests use a simulated Gmail transport and do
not send email to contacts.

## AI reply to any email

Open any synced email, choose Reply (or Reply or draft with AI), and use Draft
with AI in the composer. Choose a tone and optionally describe what you want to
say. The selected message and preceding conversation provide context; no lead
is required, including in archived conversations. Generated replies are saved
as AI-assisted drafts, and regeneration reuses the current draft. Edit, undo AI
changes, or save your response. Sending still requires your explicit confirmation.
