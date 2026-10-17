import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
import { Pool } from "pg";
import { createIntelligenceRouter } from "../server/intelligence";
test(
  "conversation → qualified lead → task → reviewed draft → Gmail delivery, with isolation and no duplicate sends",
  { skip: !process.env.GMAIL_TEST_DATABASE_URL },
  async () => {
    const pool = new Pool({
        connectionString: process.env.GMAIL_TEST_DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }),
      owner = randomUUID(),
      outsider = randomUUID(),
      email = `intelligence-test-${randomUUID()}@example.com`;
    let aiCalls = 0,
      sends = 0,
      uncertain = false,
      invalidReply = false;
    const request: typeof fetch = async (url, init) => {
      if (String(url).includes("api.groq.com")) {
        aiCalls++;
        return Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  ...(!invalidReply
                    ? {
                        body: "Thank you for the update. Could you share the next steps?",
                      }
                    : {}),
                  isLead: true,
                  category: "lead",
                  confidence: 0.98,
                  reason: "A personal request for a project proposal.",
                  contactName: "Client",
                  priority: "hot",
                  draftSubject: "Re: Website project",
                  draftBody:
                    "Hi Client, thanks for the project details. Could you share your preferred scope and next step?",
                }),
              },
            },
          ],
        });
      }
      if (String(url).includes("messages/send")) {
        sends++;
        if (uncertain) throw new TypeError("Simulated transport interruption");
        const body = JSON.parse(String(init?.body)),
          raw = Buffer.from(body.raw, "base64url").toString();
        assert(raw.includes("From: owner@gmail.com"));
        assert(raw.includes("To: client@gmail.com"));
        return Response.json({ id: "sent-by-gmail", threadId: "business" });
      }
      return Response.json({ emailAddress: "owner@gmail.com", messages: [] });
    };
    const mapped = {
      query: async (sql: string, values?: unknown[]) =>
        sql.startsWith("SELECT public.get_user_uuid")
          ? { rows: [{ id: values?.[0] === "owner" ? owner : outsider }] }
          : pool.query(sql, values),
      connect: () => pool.connect(),
    } as unknown as Pool;
    const app = express();
    app.use(express.json());
    app.use(
      createIntelligenceRouter({
        pool: mapped,
        env: {
          GROQ_API_KEY: "synthetic-key",
          GOOGLE_CLIENT_ID: "synthetic",
          GOOGLE_CLIENT_SECRET: "synthetic",
        },
        request,
        sessionUserId: async (req) => req.get("x-test-user") || null,
      }),
    );
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((r) => server.once("listening", r));
    const address = server.address();
    assert(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    const call = (
      path: string,
      method = "GET",
      body?: unknown,
      user = "owner",
    ) =>
      fetch(base + path, {
        method,
        headers: { "x-test-user": user, "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    try {
      await pool.query("INSERT INTO public.users(id,email) VALUES($1,$2)", [
        owner,
        email,
      ]);
      const connection = (
        await pool.query(
          "INSERT INTO public.email_connections(user_id,provider,email,access_token,refresh_token,is_active) VALUES($1,'gmail','owner@gmail.com','synthetic-access','synthetic-refresh',true) RETURNING id",
          [owner],
        )
      ).rows[0].id;
      for (const [id, sender, subject, body] of [
        [
          "business",
          "client@gmail.com",
          "Website project",
          "Could you send a proposal for our website project?",
        ],
        [
          "newsletter",
          "newsletter@vendor.com",
          "Weekly offers",
          "Unsubscribe from this weekly newsletter.",
        ],
      ]) {
        const thread = (
          await pool.query(
            "INSERT INTO public.email_threads(user_id,subject,thread_identifier,status) VALUES($1,$2,$3,'active') RETURNING id",
            [owner, subject, `${connection}:${id}`],
          )
        ).rows[0].id;
        await pool.query(
          "INSERT INTO public.emails(user_id,thread_id,direction,from_email,to_email,subject,body_text,status,received_at) VALUES($1,$2,'inbound',$3,'owner@gmail.com',$4,$5,'sent',NOW())",
          [owner, thread, sender, subject, body],
        );
      }
      assert.equal(
        (await fetch(base + "/api/intelligence/status")).status,
        401,
      );
      const analyzed = await call("/api/intelligence/analyze", "POST", {});
      assert.equal(analyzed.status, 200);
      const analysis = await analyzed.json();
      assert.equal(analysis.leadsCreated, 1);
      assert.equal(analysis.pending, 0);
      assert.equal(aiCalls, 1);
      assert.equal(
        (await (await call("/api/intelligence/analyze", "POST", {})).json())
          .threadsUpdated,
        0,
      );
      assert.equal(aiCalls, 1);
      const leads = (
        await pool.query("SELECT id FROM public.leads WHERE user_id=$1", [
          owner,
        ])
      ).rows;
      assert.equal(leads.length, 1);
      const ownLeads = await (await call("/api/leads")).json();
      assert.equal(ownLeads.leads.length, 1);
      assert.equal(
        (await (await call("/api/leads", "GET", undefined, "outsider")).json())
          .leads.length,
        0,
      );

      const drafts = await (await call("/api/drafts")).json();
      assert.equal(drafts.drafts.length, 1);
      const draft = drafts.drafts[0];
      assert.equal(draft.is_ai_draft, true);
      const queue = await (await call("/api/action-queue")).json();
      assert.equal(queue.tasks.length, 1);
      assert.equal(queue.tasks[0].emailId, draft.id);
      assert.equal(
        (await (await call("/api/drafts", "GET", undefined, "outsider")).json())
          .drafts.length,
        0,
      );
      assert.equal(
        (
          await call(
            "/api/emails/send",
            "POST",
            { emailId: draft.id },
            "outsider",
          )
        ).status,
        404,
      );
      assert.equal(
        (
          await call(
            `/api/leads/${leads[0].id}/generate-followup`,
            "POST",
            {},
            "outsider",
          )
        ).status,
        404,
      );
      assert.equal(
        (await call(`/api/emails/${draft.id}`, "PUT", { status: "sent" }))
          .status,
        400,
      );
      assert.equal(
        (
          await call(`/api/emails/${draft.id}`, "PUT", {
            subject: "Header\r\nBcc: unwanted@example.com",
          })
        ).status,
        400,
      );
      const nonLead = (
        await pool.query(
          "SELECT t.id AS thread_id,e.id AS email_id FROM public.email_threads t JOIN public.emails e ON e.thread_id=t.id WHERE t.user_id=$1 AND t.subject='Weekly offers' AND e.status='sent'",
          [owner],
        )
      ).rows[0];
      const replyPath = `/api/email-threads/${nonLead.thread_id}/draft-reply`;
      assert.equal(
        (
          await call(
            replyPath,
            "POST",
            { emailId: nonLead.email_id },
            "outsider",
          )
        ).status,
        404,
      );
      assert.equal(
        (
          await call(replyPath, "POST", {
            emailId: nonLead.email_id,
            tone: "invalid",
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await call(replyPath, "POST", {
            emailId: nonLead.email_id,
            instructions: "x".repeat(1001),
          })
        ).status,
        400,
      );
      const reply = await call(replyPath, "POST", {
        emailId: nonLead.email_id,
        tone: "short",
        instructions: "Thank them and ask for next steps.",
      });
      assert.equal(reply.status, 200);
      const generated = await reply.json();
      assert(generated.id);
      assert.equal(generated.to, "newsletter@vendor.com");
      const row = (
        await pool.query(
          "SELECT is_ai_draft,lead_id FROM public.emails WHERE id=$1",
          [generated.id],
        )
      ).rows[0];
      assert.equal(row.is_ai_draft, true);
      assert.equal(row.lead_id, null);
      assert.equal(
        (
          await pool.query(
            "SELECT count(*)::int AS count FROM public.leads WHERE user_id=$1",
            [owner],
          )
        ).rows[0].count,
        1,
      );
      const regen = await call(replyPath, "POST", {
        emailId: nonLead.email_id,
        draftId: generated.id,
      });
      assert.equal(regen.status, 200);
      assert.equal((await regen.json()).id, generated.id);
      invalidReply = true;
      assert.equal(
        (
          await call(replyPath, "POST", {
            emailId: nonLead.email_id,
            draftId: generated.id,
          })
        ).status,
        502,
      );
      invalidReply = false;
      assert.equal(
        (
          await pool.query("SELECT body_text FROM public.emails WHERE id=$1", [
            generated.id,
          ])
        ).rows[0].body_text,
        generated.body,
      );
      const sent = await call("/api/emails/send", "POST", {
        emailId: draft.id,
      });
      assert.equal(sent.status, 200);
      assert.equal(sends, 1);
      assert.equal(
        (
          await (
            await call("/api/emails/send", "POST", { emailId: draft.id })
          ).json()
        ).alreadySent,
        true,
      );
      assert.equal(sends, 1);
      assert.equal(
        (await (await call("/api/action-queue")).json()).tasks.length,
        0,
      );
      const saved = await call("/api/emails", "POST", {
        to_email: "client@gmail.com",
        from_email: "owner@gmail.com",
        subject: "Another draft",
        body_text: "A synthetic test message.",
        status: "draft",
      });
      assert.equal(saved.status, 200);
      const newId = (await saved.json()).email.id;
      uncertain = true;
      assert.equal(
        (await call("/api/emails/send", "POST", { emailId: newId })).status,
        502,
      );
      assert.equal(
        (await call("/api/emails/send", "POST", { emailId: newId })).status,
        409,
      );
      assert.equal(sends, 2);
      assert.equal(
        (
          await pool.query("SELECT status FROM public.emails WHERE id=$1", [
            newId,
          ])
        ).rows[0].status,
        "failed",
      );
    } finally {
      await new Promise<void>((r, j) => server.close((e) => (e ? j(e) : r())));
      await pool.query("DELETE FROM public.emails WHERE user_id=$1", [owner]);
      await pool.query("DELETE FROM public.email_threads WHERE user_id=$1", [
        owner,
      ]);
      await pool.query("DELETE FROM public.leads WHERE user_id=$1", [owner]);
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
