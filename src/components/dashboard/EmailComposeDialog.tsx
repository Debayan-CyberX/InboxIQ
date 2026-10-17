import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Send, FileText, Sparkles, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmAction } from "@/components/WorkspaceUI";
import { useUserId } from "@/hooks/useUserId";
import { useConnections } from "@/hooks/use-workspace-data";
import { emailsApi } from "@/lib/api";
import type { Email } from "@/types/database";
import { emailText, emailHtml, errorMessage } from "@/lib/format";
import { toast } from "sonner";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "reply" | "forward" | "new";
  originalEmail?: Email | null;
  threadId?: string | null;
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
  onSent?: () => void;
}
export default function EmailComposeDialog({
  isOpen,
  onClose,
  mode,
  originalEmail,
  threadId,
  defaultTo,
  defaultSubject,
  defaultBody,
  onSent,
}: Props) {
  const id = useUserId();
  const { data: connections = [] } = useConnections();
  const mailboxes = connections.filter(
    (connection) => connection.provider === "gmail" && connection.is_active,
  );
  const [from, setFrom] = useState("");
  const client = useQueryClient();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [tone, setTone] = useState("professional");
  const [instructions, setInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [previous, setPrevious] = useState<{
    subject: string;
    body: string;
    to: string;
    from: string;
  } | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    setGenerating(false);
    setPrevious(null);
    setInstructions("");
    setTone("professional");
  }, [isOpen, originalEmail?.id]);
  async function draftWithAI() {
    if (!threadId || !originalEmail || generating) return;
    const request = ++generation.current;
    setGenerating(true);
    try {
      const reply = await emailsApi.draftReply(
        threadId,
        originalEmail.id,
        tone,
        instructions,
        draftId,
      );
      if (request !== generation.current) return;
      setPrevious({ subject, body, to, from });
      setSubject(reply.subject);
      setBody(reply.body);
      setTo(reply.to);
      setFrom(reply.from);
      setDraftId(reply.id);
      await client.invalidateQueries({ queryKey: ["drafts"] });
      toast.success(
        "AI reply saved as a draft. Review and edit it before sending.",
      );
    } catch (error) {
      if (request === generation.current) toast.error(errorMessage(error));
    } finally {
      if (request === generation.current) setGenerating(false);
    }
  }
  useEffect(() => {
    if (!isOpen) return;
    setDraftId(null);
    setTo(
      mode === "reply" && originalEmail
        ? originalEmail.direction === "outbound"
          ? originalEmail.to_email
          : originalEmail.from_email
        : defaultTo || "",
    );
    setSubject(
      originalEmail && mode !== "new"
        ? `${mode === "reply" ? "Re:" : "Fwd:"} ${originalEmail.subject.replace(/^(Re:|Fwd:)\s*/i, "")}`
        : defaultSubject || "",
    );
    setBody(
      originalEmail && mode !== "new"
        ? `\n\n--- Original message ---\nFrom: ${originalEmail.from_email}\n\n${emailText(originalEmail.body_text, originalEmail.body_html)}`
        : defaultBody || "",
    );
  }, [isOpen, mode, originalEmail, defaultTo, defaultSubject, defaultBody]);
  useEffect(() => {
    if (!isOpen || from) return;
    const preferred =
      originalEmail?.direction === "outbound"
        ? originalEmail.from_email
        : originalEmail?.to_email;
    const matching = mailboxes.find((connection) =>
      preferred?.toLowerCase().includes(connection.email.toLowerCase()),
    );
    if (matching) setFrom(matching.email);
  }, [isOpen, from, originalEmail, mailboxes]);
  const sender = from || mailboxes[0]?.email || "";
  const valid = !!(
    id &&
    sender &&
    to.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) &&
    subject.trim() &&
    body.trim()
  );
  async function save() {
    if (!id || !valid)
      throw new Error("Enter a valid recipient, subject, and message.");
    const fields = {
      thread_id: threadId || null,
      lead_id: originalEmail?.lead_id || null,
      direction: "outbound" as const,
      from_email: sender,
      to_email: to.trim(),
      cc_emails: null,
      bcc_emails: null,
      subject: subject.trim(),
      body_text: body,
      body_html: emailHtml(body),
      status: "draft" as const,
      is_ai_draft: false,
      tone: mode === "reply" ? (tone as Email["tone"]) : null,
      ai_reason: null,
      ai_category: null,
      ai_confidence: null,
      external_email_id: null,
      sent_at: null,
      received_at: null,
      scheduled_for: null,
    };
    const saved = draftId
      ? await emailsApi.update(draftId, id, fields)
      : await emailsApi.create(fields, id);
    setDraftId(saved.id);
    await client.invalidateQueries({ queryKey: ["drafts"] });
    return saved.id;
  }
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !saving) {
          generation.current++;
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[650px] max-h-[90dvh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {mode === "reply"
              ? "Reply to conversation"
              : mode === "forward"
                ? "Forward message"
                : "Compose email"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Review your recipient and message before sending.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-3">
          {mode === "reply" && originalEmail && threadId && (
            <div className="rounded-md border p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} />
                <span className="text-xs font-medium">
                  Draft a reply with AI
                </span>
              </div>
              <label className="form-field">
                <span>Reply instructions (optional)</span>
                <textarea
                  className="form-input"
                  rows={2}
                  maxLength={1000}
                  value={instructions}
                  disabled={generating}
                  onChange={(event) => setInstructions(event.target.value)}
                  placeholder="E.g. thank them and ask for more details about the timeline"
                />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="AI reply tone"
                  className="form-input !w-auto"
                  value={tone}
                  disabled={generating}
                  onChange={(event) => setTone(event.target.value)}
                >
                  <option value="professional">Professional</option>
                  <option value="short">Concise</option>
                  <option value="polite">Polite</option>
                  <option value="confident">Confident</option>
                  <option value="sales-focused">Sales-focused</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={generating || saving}
                  onClick={() => {
                    void draftWithAI();
                  }}
                >
                  <Sparkles size={13} />
                  {generating ? "Drafting reply..." : "Draft with AI"}
                </Button>
                {previous && (
                  <button
                    className="section-link"
                    disabled={generating}
                    onClick={() => {
                      setSubject(previous.subject);
                      setBody(previous.body);
                      setTo(previous.to);
                      setFrom(previous.from);
                      setPrevious(null);
                    }}
                  >
                    <Undo2 size={12} />
                    Undo AI changes
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Uses this email and its conversation context. The result is
                saved as a draft; nothing is sent automatically.
              </p>
            </div>
          )}
          <label className="form-field">
            <span>From</span>
            <select
              className="form-input"
              value={sender}
              disabled={generating || saving}
              onChange={(event) => setFrom(event.target.value)}
            >
              <option value="" disabled>
                Select a connected Gmail account
              </option>
              {mailboxes.map((connection) => (
                <option key={connection.id} value={connection.email}>
                  {connection.email}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>To</span>
            <input
              className="form-input"
              type="email"
              value={to}
              disabled={generating || saving}
              onChange={(e) => setTo(e.target.value)}
              placeholder="name@company.com"
            />
          </label>
          <label className="form-field">
            <span>Subject</span>
            <input
              className="form-input"
              value={subject}
              disabled={generating || saving}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Message</span>
            <textarea
              rows={10}
              className="form-input resize-y leading-relaxed"
              value={body}
              disabled={generating || saving}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
        </div>
        <div className="flex justify-between gap-3 border-t pt-4 mt-2">
          <Button
            variant="outline"
            disabled={!valid || saving || generating}
            onClick={async () => {
              setSaving(true);
              try {
                await save();
                toast.success("Draft saved");
                onClose();
              } catch (e) {
                toast.error(errorMessage(e));
              } finally {
                setSaving(false);
              }
            }}
          >
            <FileText size={13} />
            {saving ? "Saving..." : "Save draft"}
          </Button>
          <ConfirmAction
            title="Send this email?"
            description={`Send ?${subject}? to ${to}? This action sends the message through your configured email service.`}
            confirmLabel="Send email"
            onConfirm={async () => {
              if (!id) return;
              setSaving(true);
              try {
                const emailId = await save();
                await emailsApi.sendEmail(emailId, id, {
                  to,
                  subject,
                  body: emailHtml(body),
                });
                await client.invalidateQueries({ queryKey: ["drafts"] });
                await client.invalidateQueries({ queryKey: ["threads"] });
                toast.success("Email sent");
                onSent?.();
                onClose();
              } finally {
                setSaving(false);
              }
            }}
          >
            <Button disabled={!valid || saving || generating}>
              <Send size={13} />
              Review and send
            </Button>
          </ConfirmAction>
        </div>
      </DialogContent>
    </Dialog>
  );
}
