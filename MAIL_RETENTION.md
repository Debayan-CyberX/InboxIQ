# Gmail storage retention

InboxIQ retains the newest 500 synced messages per connected Gmail mailbox.
Cleanup runs after each successful sync page, using message dates and a stable
ID tie-breaker. It affects InboxIQ's database copies; no Gmail delete, trash, or
modify endpoint is called, and OAuth permissions are unchanged.

Older messages remain when their conversation is linked to a lead or contains a
draft, scheduled message, or failed message. Messages referenced by an action are
also preserved. Drafts and messages without a provider ID are never cleanup
candidates. These exceptions can make the total exceed 500.

Gmail history import reads message pages rather than whole conversations, with
a server-enforced budget of 500 messages per traversal. Continuation cursors are
signed, expire after 24 hours, and are bound to the signed-in owner and connection.
A fresh sync starts with recent messages. Sync remains paced and paginated; it
does not fetch all 500 in one request.

Cleanup locks conversation parents and uses a transaction and the existing
per-user sync lock. Only emptied conversations affected by cleanup are removed.
Lead records and conversations containing local work remain intact. Legacy
conversations are included when their sender/recipient and message direction
identify exactly one connected mailbox. Ambiguous legacy ownership is preserved
rather than guessed.

`GET /api/email-connections/:connectionId/retention` returns the limit, stored
synced-message count, protected older count, and eligible cleanup count. It requires
the connection owner's session. Sync responses also include these counts and the
number removed on that page. This policy applies to the active Gmail integration;
legacy IMAP/Outlook sync paths are unchanged.

Validation covers cursor tampering, expiry, cross-account access, the final import
page budget, duplicate imports, newest-first cleanup, drafts and scheduled work,
lead history, mailbox isolation, empty-thread cleanup, and repeated cleanup.
Database tests require explicit `GMAIL_TEST_DATABASE_URL` opt-in and use temporary,
isolated fixture owners with cleanup in `finally`.

500 is a starting retention policy, not a database byte quota. Message size,
protected history, and the number of connected mailboxes still determine total
storage. No new services, database migrations, dependencies, or paid plans are
required.
