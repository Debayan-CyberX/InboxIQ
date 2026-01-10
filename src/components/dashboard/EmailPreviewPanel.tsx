import { useState, useEffect, useCallback } from "react";
import { X, Sparkles, Send, Edit3, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmailPreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSend?: (editedContent?: { subject?: string; body?: string }) => void | Promise<void>;
  onRegenerate?: (tone?: string) => void | Promise<void>;
  email: {
    to: string;
    subject: string;
    draft: string;
    reason: string;
    company: string;
    leadId?: string;
  } | null;
}

const tones = [
  { id: "professional", label: "Professional" },
  { id: "short", label: "Short" },
  { id: "confident", label: "Confident" },
  { id: "polite", label: "Polite" },
  { id: "sales", label: "Sales-focused" },
];

const EmailPreviewPanel = ({
  isOpen,
  onClose,
  onSend,
  onRegenerate,
  email,
}: EmailPreviewPanelProps) => {
  const [selectedTone, setSelectedTone] = useState("professional");
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(email?.draft || "");
  const [subjectContent, setSubjectContent] = useState(email?.subject || "");
  const [isSending, setIsSending] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (email?.draft) {
      setDraftContent(email.draft);
    }
    if (email?.subject) {
      setSubjectContent(email.subject);
    }
  }, [email?.draft, email?.subject]);

  const handleSend = async () => {
    if (!onSend) return;

    try {
      setIsSending(true);
      // Pass edited content if it was modified
      const editedContent = 
        (subjectContent !== email?.subject || draftContent !== email?.draft)
          ? { subject: subjectContent, body: draftContent }
          : undefined;
      await onSend(editedContent);
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleRegenerate = useCallback(async (toneOverride?: string) => {
    if (!onRegenerate) return;

    try {
      setIsRegenerating(true);
      await onRegenerate(toneOverride || selectedTone);
      // Content will be updated via useEffect when email prop changes
    } catch (err) {
      console.error("Regenerate failed:", err);
    } finally {
      setIsRegenerating(false);
    }
  }, [onRegenerate, selectedTone]);

  if (!isOpen || !email) return null;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="
          fixed inset-y-0 right-0 z-50
          w-full sm:w-[420px] lg:w-[480px]
          bg-card border-l border-border shadow-xl
          flex flex-col animate-slide-in
          max-w-full
        "
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="font-semibold text-foreground">
              AI-Generated Draft
            </h3>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Reason */}
          <div className="p-4 bg-accent/5 border-b border-border">
            <p className="text-sm text-foreground/80 break-words">
              <span className="font-medium text-accent">Why this email:</span>{" "}
              {email.reason}
            </p>
          </div>

          <div className="p-4 space-y-4">
            {/* To */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">
                To
              </label>
              <p className="mt-1 text-sm font-medium break-all">
                {email.to}
              </p>
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Subject
              </label>
              <input
                value={subjectContent}
                onChange={(e) => setSubjectContent(e.target.value)}
                readOnly={!isEditing}
                className="
                  mt-1 w-full h-9 px-3 rounded-lg border
                  border-border bg-background text-sm
                  focus:outline-none focus:ring-2 focus:ring-ring
                "
              />
            </div>

            {/* Tone */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Tone
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {tones.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => {
                      setSelectedTone(tone.id);
                      // Trigger regeneration with new tone
                      if (onRegenerate && email) {
                        handleRegenerate(tone.id);
                      }
                    }}
                    disabled={isRegenerating}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      selectedTone === tone.id
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                      isRegenerating && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Draft */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Message
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit3 className="w-3 h-3" />
                  {isEditing ? "Done" : "Edit"}
                </Button>
              </div>

              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                readOnly={!isEditing}
                className={cn(
                  "w-full h-64 p-4 rounded-lg text-sm leading-relaxed resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-ring",
                  isEditing
                    ? "bg-background border border-border"
                    : "bg-muted/30 border border-transparent"
                )}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border bg-muted/30 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            {onRegenerate && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleRegenerate()}
                disabled={isSending || isRegenerating}
              >
                <RotateCcw className={cn("w-4 h-4", isRegenerating && "animate-spin")} />
                {isRegenerating ? "Regenerating…" : "Regenerate"}
              </Button>
            )}

            <Button
              variant="accent"
              className="flex-1 gap-2"
              onClick={handleSend}
              disabled={isSending || isRegenerating || !onSend}
            >
              <Send className="w-4 h-4" />
              {isSending ? "Sending…" : "Send Email"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3">
            You're always in control. Nothing sends without approval.
          </p>
        </div>
      </div>
    </>
  );
};

export default EmailPreviewPanel;
