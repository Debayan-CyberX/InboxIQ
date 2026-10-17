import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
import { Pool } from "pg";
import { decodeMailCursor, encodeMailCursor } from "../server/mail-retention";
import { createGmailRouter, signOAuthState } from "../server/gmail";

// Explicit opt-in: synthetic data only, isolated fixture user, removed in finally.
test(
  "database import isolates mailboxes, paginates, avoids duplicates, and preserves refresh tokens",
  { skip: !process.env.GMAIL_TEST_DATABASE_URL },
  async () => {
    const pool = new Pool({
      connectionString: process.env.GMAIL_TEST_DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    const owner = randomUUID(),
      outsider = randomUUID(),
      email = `gmail-test-${randomUUID()}@example.com`;
    const env = {
      GOOGLE_CLIENT_ID: "fake-client",
      GOOGLE_CLIENT_SECRET: "fake-secret",
      BETTER_AUTH_SECRET: "fake-state-key",
      FRONTEND_URL: "https://inboxiq.debx.co.in",
    };
    const app = express();
    app.use(express.json());
    let failProvider = false;
    let expectedPageSize = 25;
    const request: typeof fetch = async (url, init) => {
      const target = new URL(String(url));
      if (target.hostname === "oauth2.googleapis.com")
        return Response.json({
          access_token: "synthetic-access",
          expires_in: 3600,
        });
      if (target.pathname.endsWith("/profile"))
        return Response.json({ emailAddress: email });
      if (failProvider)
        return Response.json(
          { error: "provider-private-detail" },
          { status: 503 },
        );
      if (target.pathname.endsWith("/messages")) {
        assert.equal(
          Number(target.searchParams.get("maxResults")),
          expectedPageSize,
        );
        const thread = target.searchParams.get("pageToken")
          ? "older"
          : "recent";
        assert.equal(target.searchParams.get("q"), "-in:drafts");
        return Response.json({
          messages: [{ id: `${thread}-message`, threadId: thread }],
          nextPageToken: "second-page",
        });
      }
      const messageId = target.pathname.split("/").at(-1)!;
      const thread = messageId.replace(/-message$/, "");
      return Response.json({
        id: messageId,
        threadId: thread,
        internalDate: "1700000000000",
        labelIds: ["INBOX"],
        payload: {
          mimeType: "text/plain",
          headers: [
            { name: "From", value: "Contact <contact@example.com>" },
            { name: "To", value: email },
            { name: "Subject", value: `Synthetic ${thread}` },
          ],
          body: { data: Buffer.from("Synthetic body").toString("base64url") },
        },
      });
    };
    // Map fixture identities without creating a Better Auth account. All mailbox SQL
    // is the production SQL executed against the real database schema.
    const mappedPool = {
      query: async (sql: string, values?: unknown[]) =>
        sql.startsWith("SELECT public.get_user_uuid")
          ? { rows: [{ id: values?.[0] === "owner" ? owner : outsider }] }
          : pool.query(sql, values),
      connect: () => pool.connect(),
    } as unknown as Pool;
    app.use(
      createGmailRouter({
        env,
        pool: mappedPool,
        request,
        sessionUserId: async (req) => req.get("x-test-user") || null,
      }),
    );
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((r) => server.once("listening", r));
    const address = server.address();
    assert(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    let connectionId = "";
    const sync = async (user = "owner", body = {}) =>
      fetch(`${base}/api/email-connections/${connectionId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-test-user": user },
        body: JSON.stringify(body),
      });
    try {
      await pool.query(
        "INSERT INTO public.users(id,email,full_name) VALUES($1,$2,'Gmail synthetic test')",
        [owner, email],
      );
      connectionId = (
        await pool.query(
          "INSERT INTO public.email_connections(user_id,provider,email,access_token,refresh_token,is_active) VALUES($1,'gmail',$2,'synthetic-access','synthetic-refresh',true) RETURNING id",
          [owner, email],
        )
      ).rows[0].id;
      const first = await sync();
      assert.equal(first.status, 200);
      const result = await first.json();
      assert.equal(result.emailsSynced, 1);
      assert.equal(
        decodeMailCursor(
          result.nextPageToken,
          owner,
          connectionId,
          env.BETTER_AUTH_SECRET,
        ).providerToken,
        "second-page",
      );
      assert.equal(result.retention.limit, 500);
      assert.equal(
        (await sync("owner", { pageToken: "second-page" })).status,
        400,
      );
      assert.equal((await (await sync()).json()).emailsSynced, 0);
      assert.equal(
        (
          await (
            await sync("owner", { pageToken: result.nextPageToken })
          ).json()
        ).emailsSynced,
        1,
      );
      expectedPageSize = 1;
      const lastPage = await (
        await sync("owner", {
          pageToken: encodeMailCursor(
            "second-page",
            499,
            owner,
            connectionId,
            env.BETTER_AUTH_SECRET,
          ),
        })
      ).json();
      assert.equal(lastPage.nextPageToken, null);
      expectedPageSize = 25;
      const stats = await fetch(
        `${base}/api/email-connections/${connectionId}/retention`,
        { headers: { "x-test-user": "owner" } },
      );
      assert.equal((await stats.json()).storedEmails, 2);
      assert.equal(
        (
          await fetch(
            `${base}/api/email-connections/${connectionId}/retention`,
            { headers: { "x-test-user": "outsider" } },
          )
        ).status,
        404,
      );
      assert.equal((await sync("outsider")).status, 404);
      const counts = await pool.query(
        "SELECT count(*)::int AS count FROM public.emails WHERE user_id=$1",
        [owner],
      );
      assert.equal(counts.rows[0].count, 2);
      const threadId = (
        await pool.query(
          "SELECT id FROM public.email_threads WHERE user_id=$1 LIMIT 1",
          [owner],
        )
      ).rows[0].id;
      const messages = await fetch(
        `${base}/api/email-threads/${threadId}/emails`,
        { headers: { "x-test-user": "owner" } },
      );
      assert.equal(messages.status, 200);
      assert.equal((await messages.json()).emails.length, 1);
      assert.equal(
        (
          await fetch(`${base}/api/email-threads/${threadId}/emails`, {
            headers: { "x-test-user": "outsider" },
          })
        ).status,
        404,
      );
      const safe = await fetch(base + "/api/email-connections", {
        headers: { "x-test-user": "owner" },
      });
      const safeBody = await safe.text();
      assert(
        !safeBody.includes("access_token") &&
          !safeBody.includes("refresh_token") &&
          !safeBody.includes("synthetic-access"),
      );
      const { state, cookie } = signOAuthState("owner", env.BETTER_AUTH_SECRET);
      const callback = await fetch(
        base + `/api/email-connections/callback?code=fake&state=${state}`,
        {
          headers: {
            "x-test-user": "owner",
            Cookie: `inboxiq.gmail_oauth=${cookie}`,
          },
          redirect: "manual",
        },
      );
      assert.equal(callback.status, 302);
      assert(
        callback.headers
          .get("location")
          ?.includes(`gmailConnected=${connectionId}`),
      );
      assert.equal(
        (
          await pool.query(
            "SELECT refresh_token FROM public.email_connections WHERE id=$1",
            [connectionId],
          )
        ).rows[0].refresh_token,
        "synthetic-refresh",
      );
      failProvider = true;
      assert.equal((await sync()).status, 502);
      const failed = (
        await pool.query(
          "SELECT error_message FROM public.email_connections WHERE id=$1",
          [connectionId],
        )
      ).rows[0].error_message;
      assert(failed && !failed.includes("provider-private-detail"));
      const disconnected = await fetch(
        `${base}/api/email-connections/${connectionId}`,
        {
          method: "PATCH",
          headers: {
            "x-test-user": "owner",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_active: false }),
        },
      );
      assert.equal(disconnected.status, 200);
      const row = (
        await pool.query(
          "SELECT access_token,refresh_token,is_active FROM public.email_connections WHERE id=$1",
          [connectionId],
        )
      ).rows[0];
      assert.equal(row.access_token, null);
      assert.equal(row.refresh_token, null);
      assert.equal(row.is_active, false);
    } finally {
      await new Promise<void>((r, j) => server.close((e) => (e ? j(e) : r())));
      await pool.query("DELETE FROM public.emails WHERE user_id=$1", [owner]);
      await pool.query("DELETE FROM public.email_threads WHERE user_id=$1", [
        owner,
      ]);
      await pool.query(
        "DELETE FROM public.email_connections WHERE user_id=$1",
        [owner],
      );
      await pool.query("DELETE FROM public.users WHERE id=$1 AND email=$2", [
        owner,
        email,
      ]);
      await pool.end();
    }
  },
);
