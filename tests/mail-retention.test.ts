import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import {
  MAILBOX_EMAIL_LIMIT,
  encodeMailCursor,
  decodeMailCursor,
  mailboxRetentionStats,
  pruneMailboxEmails,
} from "../server/mail-retention";

test("mail history cursors cannot bypass the 500-message budget or cross mailboxes", () => {
  const cursor = encodeMailCursor(
    "google-page",
    499,
    "owner",
    "mailbox",
    "secret",
    1000,
  );
  assert.deepEqual(
    decodeMailCursor(cursor, "owner", "mailbox", "secret", 2000),
    { providerToken: "google-page", seen: 499 },
  );
  for (const args of [
    [cursor, "other", "mailbox", "secret", 2000],
    [cursor, "owner", "other", "secret", 2000],
    [cursor, "owner", "mailbox", "wrong", 2000],
    [cursor, "owner", "mailbox", "secret", 86401001],
    [cursor + "x", "owner", "mailbox", "secret", 2000],
    ["raw-google-page", "owner", "mailbox", "secret", 2000],
    [
      encodeMailCursor("page", 500, "owner", "mailbox", "secret", 1000),
      "owner",
      "mailbox",
      "secret",
      2000,
    ],
    [
      encodeMailCursor("page", -1, "owner", "mailbox", "secret", 1000),
      "owner",
      "mailbox",
      "secret",
      2000,
    ],
  ] as const)
    assert.throws(() => decodeMailCursor(...args));
  assert.deepEqual(decodeMailCursor("", "owner", "mailbox", "secret"), {
    providerToken: "",
    seen: 0,
  });
  assert.equal(MAILBOX_EMAIL_LIMIT, 500);
});

test(
  "retention keeps the newest 500, draft and lead history, and isolates owners and mailboxes",
  { skip: !process.env.GMAIL_TEST_DATABASE_URL },
  async () => {
    const pool = new Pool({
      connectionString: process.env.GMAIL_TEST_DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    const owner = randomUUID(),
      outsider = randomUUID(),
      connection = randomUUID(),
      otherConnection = randomUUID(),
      outsiderConnection = randomUUID();
    const fixtureEmail = `retention-${randomUUID()}@example.com`;
    const db = await pool.connect();
    try {
      await db.query(
        "INSERT INTO public.users(id,email,full_name) VALUES($1,$2,'Retention fixture'),($3,$4,'Retention fixture')",
        [owner, fixtureEmail, outsider, `other-${fixtureEmail}`],
      );
      await db.query(
        "INSERT INTO public.email_connections(id,user_id,provider,email,is_active) VALUES($1,$2,'gmail',$3,true),($4,$2,'gmail','sibling@example.com',true),($5,$6,'gmail',$7,true)",
        [
          connection,
          owner,
          fixtureEmail,
          otherConnection,
          outsiderConnection,
          outsider,
          `other-${fixtureEmail}`,
        ],
      );
      const thread = async (
        user: string,
        mailbox: string,
        label: string,
        lead: string | null = null,
      ) =>
        (
          await db.query(
            "INSERT INTO public.email_threads(user_id,lead_id,subject,thread_identifier,status) VALUES($1,$2,'Retention fixture',$3,'active') RETURNING id",
            [user, lead, `${mailbox}:${label}`],
          )
        ).rows[0].id as string;
      const ordinary = await thread(owner, connection, "ordinary");
      // 520 messages with strictly increasing dates: the first twenty are old.
      await db.query(
        `INSERT INTO public.emails(user_id,thread_id,from_email,to_email,subject,body_text,status,direction,external_email_id,received_at)
      SELECT $1,$2,'sender@example.com',$3,'Retention fixture','Synthetic text','sent','inbound','fixture-'||n,NOW()-(521-n)*INTERVAL '1 minute' FROM generate_series(1,520) n`,
        [owner, ordinary, fixtureEmail],
      );
      const lead = (
        await db.query(
          "INSERT INTO public.leads(user_id,company,contact_name,email,status) VALUES($1,'Fixture','Fixture','lead@example.com','warm') RETURNING id",
          [owner],
        )
      ).rows[0].id;
      const leadThread = await thread(owner, connection, "lead", lead);
      const draftThread = await thread(owner, connection, "draft");
      const scheduledThread = await thread(owner, connection, "scheduled");
      const emptyAfterCleanup = await thread(owner, connection, "old-thread");
      const sibling = await thread(owner, otherConnection, "sibling");
      const stranger = await thread(outsider, outsiderConnection, "stranger");
      const oldMail = async (
        user: string,
        threadId: string,
        status = "sent",
        external: string | null = randomUUID(),
      ) =>
        (
          await db.query(
            "INSERT INTO public.emails(user_id,thread_id,from_email,to_email,subject,status,direction,external_email_id,received_at) VALUES($1,$2,'sender@example.com','fixture@example.com','Retention fixture',$3,'inbound',$4,NOW()-INTERVAL '2 years') RETURNING id",
            [user, threadId, status, external],
          )
        ).rows[0].id;
      const kept = [
        await oldMail(owner, leadThread),
        await oldMail(owner, draftThread),
        await oldMail(owner, draftThread, "draft", null),
        await oldMail(owner, scheduledThread),
        await oldMail(owner, scheduledThread, "scheduled", null),
        await oldMail(owner, sibling),
        await oldMail(outsider, stranger),
        await oldMail(owner, ordinary, "sent", null),
      ];
      const discarded = await oldMail(owner, emptyAfterCleanup);
      const legacyThread = await thread(owner, connection, "legacy");
      await db.query(
        "UPDATE public.email_threads SET thread_identifier='legacy-gmail-thread' WHERE id=$1",
        [legacyThread],
      );
      const legacyMessage = await oldMail(owner, legacyThread);
      await db.query("UPDATE public.emails SET to_email=$1 WHERE id=$2", [
        fixtureEmail,
        legacyMessage,
      ]);
      const cleanupStarted = performance.now();
      const before = await mailboxRetentionStats(db, owner, connection);
      assert.equal(before.removableEmails, 22);
      const result = await pruneMailboxEmails(db, owner, connection);
      assert(
        performance.now() - cleanupStarted < 10000,
        "Mailbox cleanup should finish within ten seconds for 500 messages",
      );
      assert.equal(result.removedEmails, 22);
      assert.equal(result.storedEmails, 503);
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM public.emails WHERE id=$1",
            [legacyMessage],
          )
        ).rows[0].n,
        0,
      );
      assert.equal(result.protectedOlderEmails, 3);
      assert.equal(result.removableEmails, 0);
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM public.emails WHERE id=ANY($1::uuid[])",
            [kept],
          )
        ).rows[0].n,
        kept.length,
      );
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM public.emails WHERE id=$1",
            [discarded],
          )
        ).rows[0].n,
        0,
      );
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM public.email_threads WHERE id=$1",
            [emptyAfterCleanup],
          )
        ).rows[0].n,
        0,
      );
      assert.equal(
        (
          await db.query(
            "SELECT min(external_email_id::text) AS first FROM public.emails WHERE thread_id=$1 AND external_email_id='fixture-21'",
            [ordinary],
          )
        ).rows[0].first,
        "fixture-21",
      );
      assert.equal(
        (await pruneMailboxEmails(db, owner, connection)).removedEmails,
        0,
      );
    } finally {
      await db.query("ROLLBACK");
      // Cascades remove only the two randomly generated fixture owners.
      await db.query(
        "DELETE FROM public.users WHERE id=ANY($1::uuid[]) AND full_name='Retention fixture'",
        [[owner, outsider]],
      );
      db.release();
      await pool.end();
    }
  },
);
