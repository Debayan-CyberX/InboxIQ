import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import {
  createGmailRouter,
  GmailClient,
  GmailError,
  gmailRedirectUri,
  parseGmailMessage,
  signOAuthState,
  verifyOAuthState,
} from "../server/gmail";

test("OAuth state rejects tampering, expired requests, wrong users and wrong state", () => {
  const { state, cookie } = signOAuthState("user-a", "test-secret", 1000);
  assert(verifyOAuthState(cookie, state, "user-a", "test-secret", 2000));
  assert(!verifyOAuthState(cookie, state, "user-b", "test-secret", 2000));
  assert(!verifyOAuthState(cookie, state, "user-a", "wrong-secret", 2000));
  assert(
    !verifyOAuthState(cookie, "wrong-state", "user-a", "test-secret", 2000),
  );
  assert(!verifyOAuthState(cookie, state, "user-a", "test-secret", 601001));
  assert(!verifyOAuthState(cookie + "x", state, "user-a", "test-secret", 2000));
});
test("Gmail callback uses the canonical frontend callback without a provider query", () => {
  assert.equal(
    gmailRedirectUri({ FRONTEND_URL: "https://inboxiq.debx.co.in" }),
    "https://inboxiq.debx.co.in/api/email-connections/callback",
  );
});
test("nested MIME decodes headers and both bodies, ignores attachments, and preserves dates and direction", async () => {
  const result = await parseGmailMessage(
    {
      id: "message1",
      internalDate: "1700000000000",
      labelIds: ["SENT"],
      payload: {
        headers: [
          { name: "From", value: '"Example" <alias@example.com>' },
          { name: "To", value: "Person <person@example.com>" },
          { name: "Subject", value: "=?UTF-8?B?SGVsbG8g8J+MjQ==?=" },
        ],
        parts: [
          {
            mimeType: "multipart/alternative",
            parts: [
              {
                mimeType: "text/plain",
                body: {
                  data: Buffer.from("Hello world").toString("base64url"),
                },
              },
              { mimeType: "text/html", body: { attachmentId: "body1" } },
            ],
          },
          {
            mimeType: "text/plain",
            filename: "private.txt",
            body: { data: Buffer.from("attachment").toString("base64url") },
          },
        ],
      },
    },
    "owner@example.com",
    async () => Buffer.from("<p>Hello world</p>").toString("base64url"),
  );
  assert.equal(result.subject, "Hello 🌍");
  assert.equal(result.from, "alias@example.com");
  assert.equal(result.to, "person@example.com");
  assert.equal(result.bodyText, "Hello world");
  assert.equal(result.bodyHtml, "<p>Hello world</p>");
  assert.equal(result.direction, "outbound");
  assert.equal(result.date.getTime(), 1700000000000);
});
test("expired access token refreshes and preserves offline access when Google omits a new refresh token", async () => {
  let refreshes = 0,
    writes = 0;
  const connection = {
    id: "a",
    user_id: "u",
    email: "owner@example.com",
    access_token: "old",
    refresh_token: "offline-token",
    token_expires_at: new Date(0).toISOString(),
  };
  const client = new GmailClient(
    connection,
    async (tokens) => {
      writes++;
      assert.equal(tokens.access_token, "new");
    },
    { GOOGLE_CLIENT_ID: "test", GOOGLE_CLIENT_SECRET: "test" },
    async (url, init) => {
      if (String(url).includes("oauth2")) {
        refreshes++;
        assert.equal(
          new URLSearchParams(String(init?.body)).get("refresh_token"),
          "offline-token",
        );
        return Response.json({ access_token: "new", expires_in: 3600 });
      }
      assert.equal(
        (init?.headers as Record<string, string>).Authorization,
        "Bearer new",
      );
      return Response.json({ emailAddress: "owner@example.com" });
    },
  );
  await client.get("profile");
  await client.get("profile");
  assert.equal(refreshes, 1);
  assert.equal(writes, 1);
  assert.equal(connection.refresh_token, "offline-token");
});
test("rejected access retries once and reports a reconnect error without returning Google error details", async () => {
  let calls = 0;
  const client = new GmailClient(
    {
      id: "a",
      user_id: "u",
      email: "x@example.com",
      access_token: "old",
      refresh_token: "offline",
      token_expires_at: null,
    },
    async () => {},
    {},
    async (url) => {
      if (String(url).includes("oauth2"))
        return Response.json({ access_token: "new" });
      calls++;
      return Response.json(
        { error: "sensitive-provider-response" },
        { status: 401 },
      );
    },
  );
  await assert.rejects(
    client.get("profile"),
    (error: unknown) =>
      error instanceof GmailError &&
      error.status === 401 &&
      !error.message.includes("sensitive"),
  );
  assert.equal(calls, 2);
});
test("OAuth routes require sessions, bind cookies to the user, and reject forged callbacks", async () => {
  const app = express();
  app.use(express.json());
  app.use(
    createGmailRouter({
      env: {
        GOOGLE_CLIENT_ID: "test-client",
        GOOGLE_CLIENT_SECRET: "test-secret",
        BETTER_AUTH_SECRET: "state-secret",
        FRONTEND_URL: "https://inboxiq.debx.co.in",
      },
      sessionUserId: async (req) => req.get("x-test-user") || null,
    }),
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  try {
    assert.equal(
      (await fetch(base + "/api/email-connections/oauth/gmail")).status,
      401,
    );
    assert.equal(
      (
        await fetch(base + "/api/email-connections/oauth/gmail?userId=other", {
          headers: { "x-test-user": "owner" },
        })
      ).status,
      403,
    );
    const response = await fetch(base + "/api/email-connections/oauth/gmail", {
      headers: { "x-test-user": "owner" },
    });
    assert.equal(response.status, 200);
    const url = new URL((await response.json()).authUrl);
    assert.equal(
      url.searchParams.get("redirect_uri"),
      "https://inboxiq.debx.co.in/api/email-connections/callback",
    );
    assert.equal(url.searchParams.get("access_type"), "offline");
    const cookie = response.headers.get("set-cookie")!;
    assert(
      cookie.includes("HttpOnly") &&
        cookie.includes("Secure") &&
        cookie.includes("SameSite=Lax"),
    );
    const rejected = await fetch(
      base + "/api/email-connections/callback?state=forged&code=fake",
      { headers: { "x-test-user": "owner", cookie }, redirect: "manual" },
    );
    assert.equal(rejected.status, 302);
    assert(rejected.headers.get("location")?.includes("error="));
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
