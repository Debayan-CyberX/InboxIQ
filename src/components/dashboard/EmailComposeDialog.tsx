import { useState, useEffect } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { emailsApi } from "@/lib/api";
import { useUserId } from "@/hooks/useUserId";
import type { Email } from "@/types/database";

interface EmailComposeDialogProps {
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

const EmailComposeDialog = ({
  isOpen,
  onClose,
  mode,
  originalEmail,
  threadId,
  defaultTo,
  defaultSubject,
  defaultBody,
  onSent,
}: EmailComposeDialogProps) => {
  const userId = useUserId();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "reply" && originalEmail) {
        // Reply: set to original sender, add Re: prefix if not present
        setTo(originalEmail.from_email);
        const replySubject = originalEmail.subject.startsWith("Re:") 
          ? originalEmail.subject 
          : `Re: ${originalEmail.subject}`;
        setSubject(replySubject);
        
        // Add quoted original message
        const originalBody = originalEmail.body_text || originalEmail.body_html || "";
        const quotedBody = `\n\n--- Original Message ---\nFrom: ${originalEmail.from_email}\nDate: ${new Date(originalEmail.received_at || originalEmail.created_at).toLocaleString()}\n\n${originalBody.replace(/<[^>]*>/g, '')}`;
        setBody(quotedBody);
      } else if (mode === "forward" && originalEmail) {
        // Forward: keep original subject, add Fwd: prefix if not present
        const forwardSubject = originalEmail.subject.startsWith("Fwd:") 
          ? originalEmail.subject 
          : `Fwd: ${originalEmail.subject}`;
        setSubject(forwardSubject);
        setTo("");
        
        // Add forwarded message
        const originalBody = originalEmail.body_text || originalEmail.body_html || "";
        const forwardedBody = `\n\n--- Forwarded Message ---\nFrom: ${originalEmail.from_email}\nDate: ${new Date(originalEmail.received_at || originalEmail.created_at).toLocaleString()}\nTo: ${originalEmail.to_email}\nSubject: ${originalEmail.subject}\n\n${originalBody.replace(/<[^>]*>/g, '')}`;
        setBody(forwardedBody);
      } else {
        // New email: use defaults or empty
        setTo(defaultTo || "");
        setSubject(defaultSubject || "");
        setBody(defaultBody || "");
      }
    }
  }, [isOpen, mode, originalEmail, defaultTo, defaultSubject, defaultBody]);

  const handleSend = async () => {
    if (!userId) {
      toast.error("You must be logged in to send emails");
      return;
    }

    if (!to.trim()) {
      toast.error("Please enter a recipient email address");
      return;
    }

    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!body.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      setIsSending(true);

      // Create email draft first
      const emailDraft = await emailsApi.create(
        {
          thread_id: threadId || null,
          lead_id: originalEmail?.lead_id || null,
          direction: "outgoing",
          from_email: "", // Will be set by backend
          to_email: to.trim(),
          cc_emails: null,
          bcc_emails: null,
          subject: subject.trim(),
          body_text: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
          body_html: body,
          status: "draft",
          is_ai_draft: false,
          tone: null,
          ai_reason: null,
          external_email_id: null,
          sent_at: null,
          received_at: null,
          scheduled_for: null,
        },
        userId
      );

      // Send the email
      await emailsApi.sendEmail(emailDraft.id, userId, {
        to: to.trim(),
        subject: subject.trim(),
        body: body,
      });

      toast.success("Email sent successfully");
      
      if (onSent) {
        onSent();
      }
      
      // Reset form and close
      setTo("");
      setSubject("");
      setBody("");
      onClose();
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === "reply" ? "Reply" : mode === "forward" ? "Forward" : "Compose Email"}
          </DialogTitle>
          <DialogDescription>
            {mode === "reply" 
              ? "Send a reply to this email" 
              : mode === "forward" 
              ? "Forward this email to someone else"
              : "Write a new email"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* To */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              To
            </label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isSending || mode === "reply"}
            />
          </div>

          {/* Subject */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isSending}
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={12}
              className="w-full p-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              disabled={isSending}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={handleClose} disabled={isSending}>
            Cancel
          </Button>
          <Button 
            variant="accent" 
            onClick={handleSend} 
            disabled={isSending || !to.trim() || !subject.trim() || !body.trim()}
            className="gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailComposeDialog;

