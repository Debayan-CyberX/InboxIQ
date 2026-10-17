import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  Send,
  RefreshCw,
  Trash2,
  Copy,
  Mail,
  ChevronDown,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  PageHeader,
  EmptyState,
  ConfirmAction,
  ContactAvatar,
} from "@/components/WorkspaceUI";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useDrafts } from "@/hooks/use-workspace-data";
import { useUserId } from "@/hooks/useUserId";
import { useIsMobile } from "@/hooks/use-mobile";
import { emailsApi, leadsApi } from "@/lib/api";
import { emailText, emailHtml, errorMessage } from "@/lib/format";
import type { Email, EmailTone } from "@/types/database";
import { toast } from "sonner";
type Draft = Email & { lead_company?: string; lead_contact_name?: string };
type Edit = { subject: string; body: string };
export default function Drafts() {
  const query = useDrafts();
  const mobile = useIsMobile();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [selected, setSelected] = useState<string | null>(params.get("draft"));
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const drafts: Draft[] = useMemo(() => query.data || [], [query.data]);
  const leadId = params.get("lead");
  const filtered = useMemo(
    () =>
      drafts
        .filter(
          (d) =>
            (!leadId || d.lead_id === leadId) &&
            (filter === "all" ||
              (filter === "assisted" ? d.is_ai_draft : !d.is_ai_draft)) &&
            `${d.subject} ${d.to_email} ${d.lead_company || ""}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "company"
            ? (a.lead_company || a.to_email).localeCompare(
                b.lead_company || b.to_email,
              )
            : new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
        ),
    [drafts, search, filter, sort, leadId],
  );
  const active =
    filtered.find((d) => d.id === selected) ||
    (!mobile ? filtered[0] : null) ||
    null;
  return (
    <DashboardLayout>
      <PageHeader
        title="Drafts"
        description="A considered response. Your words, your approval, your decision."
      >
        <Button asChild size="sm" variant="outline">
          <Link to="/leads">
            Explore leads
            <ArrowRight size={12} />
          </Link>
        </Button>
      </PageHeader>
      {query.isPending ? (
        <LoadingState message="Loading drafts..." />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : drafts.length === 0 ? (
        <div className="border-y">
          <EmptyState
            icon={FileText}
            title="A good reply starts with context."
            description="Prepare a follow-up from a lead, or save a message while composing. Your drafts will be ready to review here."
          >
            <Button asChild variant="outline" size="sm">
              <Link to="/leads">
                Review your pipeline
                <ArrowRight size={12} />
              </Link>
            </Button>
          </EmptyState>
        </div>
      ) : (
        <div className={`draft-workspace ${active ? "has-active" : ""}`}>
          <section className="draft-list-panel" aria-label="Draft list">
            <label className="inbox-list-search">
              <Search size={13} />
              <input
                aria-label="Search drafts"
                placeholder="Search drafts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="inbox-list-controls">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Draft type"
              >
                <option value="all">All drafts</option>
                <option value="assisted">AI-assisted</option>
                <option value="manual">Composed by you</option>
              </select>
              <select
                aria-label="Sort drafts"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="recent">Newest</option>
                <option value="company">Company / recipient</option>
              </select>
            </div>
            <div className="overflow-auto flex-1">
              {filtered.map((d) => (
                <button
                  key={d.id}
                  className={`draft-list-item ${active?.id === d.id ? "active" : ""}`}
                  onClick={() => setSelected(d.id)}
                >
                  <div className="flex gap-2 items-center">
                    <ContactAvatar name={d.lead_contact_name || d.to_email} />
                    <div className="min-w-0">
                      <h2>{d.lead_contact_name || d.to_email}</h2>
                      <span>{d.lead_company || "Draft"}</span>
                    </div>
                  </div>
                  <h3>{edits[d.id]?.subject || d.subject}</h3>
                  <p>
                    {edits[d.id]?.body || emailText(d.body_text, d.body_html)}
                  </p>
                  <div className="flex justify-between items-center mt-3 text-[8px] text-muted-foreground">
                    <span>
                      {d.is_ai_draft
                        ? "AI-assisted / awaiting review"
                        : "Awaiting review"}
                    </span>
                    <span>
                      {new Date(d.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="p-7 text-xs text-muted-foreground">
                  No drafts match this view.
                </p>
              )}
            </div>
            <div className="inbox-list-bottom">
              {filtered.length} draft{filtered.length === 1 ? "" : "s"}
              {leadId && (
                <button
                  className="ml-2 underline"
                  onClick={() => setParams({})}
                >
                  Clear lead filter
                </button>
              )}
            </div>
          </section>
          {active ? (
            <DraftEditor
              key={active.id}
              draft={active}
              initial={edits[active.id]}
              onEdit={(edit) => setEdits((s) => ({ ...s, [active.id]: edit }))}
              onClose={() => setSelected(null)}
            />
          ) : (
            <section className="draft-editor">
              <EmptyState
                icon={FileText}
                title="Choose a draft"
                description="Review the original conversation, edit the response, and decide when to send."
              />
            </section>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
function DraftEditor({
  draft,
  initial,
  onEdit,
  onClose,
}: {
  draft: Draft;
  initial?: Edit;
  onEdit: (edit: Edit) => void;
  onClose: () => void;
}) {
  const id = useUserId();
  const client = useQueryClient();
  const [subject, setSubject] = useState(initial?.subject || draft.subject);
  const [body, setBody] = useState(
    initial?.body || emailText(draft.body_text, draft.body_html),
  );
  const [tone, setTone] = useState<EmailTone>(draft.tone || "professional");
  const [reviewed, setReviewed] = useState(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const original = useQuery({
    queryKey: ["thread", id, draft.thread_id],
    queryFn: () => emailsApi.getThreadEmails(draft.thread_id!, id!),
    enabled: !!(draft.thread_id && id),
  });
  const originalEmail = [...(original.data || [])]
    .filter((e) => e.id !== draft.id && e.direction === "inbound")
    .sort(
      (a, b) =>
        new Date(b.received_at || b.created_at).getTime() -
        new Date(a.received_at || a.created_at).getTime(),
    )[0];
  function change(edit: Edit) {
    setSubject(edit.subject);
    setBody(edit.body);
    setReviewed(false);
    setSaved(false);
    onEdit(edit);
  }
  async function save() {
    if (!id) return;
    setPending(true);
    try {
      await emailsApi.update(draft.id, id, {
        subject,
        body_text: body,
        body_html: emailHtml(body),
        tone,
      });
      setSaved(true);
      await client.invalidateQueries({ queryKey: ["drafts"] });
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="draft-editor" aria-label="Draft review">
      <div className="reader-tools">
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Back to drafts"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="text-[10px] text-muted-foreground flex-1">
          {reviewed ? "Reviewed in this session" : "Awaiting your review"}
        </span>
        <button
          className="icon-button"
          aria-label="Copy draft"
          onClick={() =>
            navigator.clipboard.writeText(body).then(
              () => toast.success("Draft copied"),
              () => toast.error("Clipboard is unavailable"),
            )
          }
        >
          <Copy size={13} />
        </button>
        <ConfirmAction
          title="Delete this draft?"
          description="This permanently removes the saved draft. It does not send an email."
          destructive
          confirmLabel="Delete draft"
          onConfirm={async () => {
            if (!id) return;
            await emailsApi.delete(draft.id, id);
            await client.invalidateQueries({ queryKey: ["drafts"] });
            toast.success("Draft deleted");
            onClose();
          }}
        >
          <button className="icon-button" aria-label="Delete draft">
            <Trash2 size={13} />
          </button>
        </ConfirmAction>
      </div>
      <div className="draft-review-scroll">
        <div className="draft-recipient">
          <span>To</span>
          <strong>{draft.to_email}</strong>
          {draft.lead_id && (
            <Link
              to={`/leads?lead=${draft.lead_id}`}
              className="section-link ml-auto"
            >
              Lead context
              <ArrowRight size={10} />
            </Link>
          )}
        </div>
        <div className="draft-original">
          <details>
            <summary>
              <Mail size={12} />
              <span>Original conversation</span>
              <ChevronDown size={12} />
            </summary>
            {original.isFetching ? (
              <p>Loading the original message...</p>
            ) : original.error ? (
              <p>
                Original message couldn't load.{" "}
                <button
                  onClick={() => original.refetch()}
                  className="text-primary"
                >
                  Retry
                </button>
              </p>
            ) : originalEmail ? (
              <div>
                <strong className="text-[10px] font-medium">
                  {originalEmail.subject}
                </strong>
                <p className="whitespace-pre-wrap">
                  {emailText(originalEmail.body_text, originalEmail.body_html)}
                </p>
              </div>
            ) : (
              <p>
                No original message is linked to this draft. Review the
                recipient and content carefully.
              </p>
            )}
          </details>
        </div>
        {draft.ai_reason && (
          <div className="briefing !mt-5 !mb-5">
            <h2>Why this response</h2>
            <p>{draft.ai_reason}</p>
          </div>
        )}
        <label className="form-field mt-6">
          <span>Subject</span>
          <input
            className="form-input"
            aria-label="Draft subject"
            value={subject}
            onChange={(e) => change({ subject: e.target.value, body })}
          />
        </label>
        <label className="form-field mt-5">
          <span>Proposed response</span>
          <textarea
            className="draft-body form-input"
            aria-label="Draft response"
            value={body}
            onChange={(e) => change({ subject, body: e.target.value })}
          />
        </label>
        <div className="draft-options">
          <span className="text-[9px] text-muted-foreground">
            {body.length} characters{" "}
            {draft.ai_confidence != null &&
              ` / ${Math.round(draft.ai_confidence * 100)}% classification confidence`}
          </span>
          <select
            className="compact-select"
            aria-label="Draft tone"
            value={tone}
            onChange={(e) => {
              setTone(e.target.value as EmailTone);
              setReviewed(false);
              setSaved(false);
            }}
          >
            <option value="professional">Professional</option>
            <option value="short">Concise</option>
            <option value="confident">Confident</option>
            <option value="polite">Polite</option>
            <option value="sales-focused">Sales-focused</option>
          </select>
        </div>
        {draft.lead_id && (
          <ConfirmAction
            title="Generate another response?"
            description="This replaces the current proposed reply. You will be able to edit and review the new version before sending."
            confirmLabel="Generate response"
            onConfirm={async () => {
              if (!id || !draft.lead_id) return;
              const next = await leadsApi.generateFollowUpText(
                draft.lead_id,
                id,
                tone,
              );
              change({ subject: next.subject, body: next.body });
              toast.success("New response ready for review");
            }}
          >
            <button className="section-link mt-5">
              <RefreshCw size={12} />
              Generate another response
            </button>
          </ConfirmAction>
        )}
      </div>
      <div className="draft-review-footer">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            disabled={pending || !subject.trim() || !body.trim()}
            onClick={() =>
              save().then(
                () => toast.success("Draft saved"),
                (e) => toast.error(errorMessage(e)),
              )
            }
          >
            {pending ? "Saving..." : saved ? "Saved" : "Save draft"}
          </Button>
          <Button
            variant={reviewed ? "soft-accent" : "outline"}
            size="sm"
            onClick={() => setReviewed((v) => !v)}
            disabled={!body.trim()}
          >
            {reviewed ? <Check size={12} /> : <FileText size={12} />}{" "}
            {reviewed ? "Reviewed" : "Mark reviewed"}
          </Button>
        </div>
        <ConfirmAction
          title="Send this email?"
          description={`Send ?${subject}? to ${draft.to_email}? Review the recipient and response before confirming. This action sends an email.`}
          confirmLabel="Send email"
          onConfirm={async () => {
            if (!id || !reviewed)
              throw new Error("Review this draft before sending.");
            await save();
            await emailsApi.sendEmail(draft.id, id, {
              to: draft.to_email,
              subject,
              body: emailHtml(body),
            });
            await client.invalidateQueries({ queryKey: ["drafts"] });
            await client.invalidateQueries({ queryKey: ["threads"] });
            toast.success("Email sent");
            onClose();
          }}
        >
          <Button
            size="sm"
            disabled={!reviewed || pending || !subject.trim() || !body.trim()}
          >
            <Send size={12} />
            Send email
          </Button>
        </ConfirmAction>
        <p className="text-[9px] text-muted-foreground w-full mt-1">
          {reviewed
            ? "Reviewed for this session. Sending still requires your confirmation."
            : "Review the draft to enable sending. Nothing is sent automatically."}
        </p>
      </div>
    </section>
  );
}
