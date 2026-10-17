import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Send, FileText } from "lucide-react";
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
      tone: null,
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
        if (!open && !saving) onClose();
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
          <label className="form-field">
            <span>From</span>
            <select
              className="form-input"
              value={sender}
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
              onChange={(e) => setTo(e.target.value)}
              placeholder="name@company.com"
            />
          </label>
          <label className="form-field">
            <span>Subject</span>
            <input
              className="form-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Message</span>
            <textarea
              rows={10}
              className="form-input resize-y leading-relaxed"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
        </div>
        <div className="flex justify-between gap-3 border-t pt-4 mt-2">
          <Button
            variant="outline"
            disabled={!valid || saving}
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
            <Button disabled={!valid || saving}>
              <Send size={13} />
              Review and send
            </Button>
          </ConfirmAction>
        </div>
      </DialogContent>
    </Dialog>
  );
}
