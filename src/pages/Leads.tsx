import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  List,
  Columns3,
  Users,
  ArrowUpRight,
  RefreshCw,
  Trash2,
  Mail,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  PageHeader,
  EmptyState,
  ContactAvatar,
  StatusLabel,
  ConfirmAction,
} from "@/components/WorkspaceUI";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useLeads } from "@/hooks/use-workspace-data";
import { useUserId } from "@/hooks/useUserId";
import { leadsApi } from "@/lib/api";
import type { Lead, LeadStatus, UpdateLead } from "@/types/database";
import { toast } from "sonner";
import { errorMessage } from "@/lib/format";
import EmailComposeDialog from "@/components/dashboard/EmailComposeDialog";
const stages: LeadStatus[] = ["hot", "warm", "cold"];
export default function Leads() {
  const query = useLeads();
  const id = useUserId();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [sort, setSort] = useState("recent");
  const [view, setView] = useState<"table" | "board">("table");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [compose, setCompose] = useState<Lead | null>(null);
  const [detecting, setDetecting] = useState(false);
  const leads = useMemo(() => query.data || [], [query.data]);
  const lead = leads.find((l) => l.id === params.get("lead"));
  const [attention, setAttention] = useState(params.get("filter") || "all");
  useEffect(() => {
    setAttention(params.get("filter") || "all");
  }, [params]);
  const filtered = useMemo(
    () =>
      leads
        .filter(
          (l) =>
            (stage === "all" || l.status === stage) &&
            (attention === "all" ||
              l.days_since_contact >= (attention === "risk" ? 5 : 3)) &&
            `${l.contact_name} ${l.company} ${l.email}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "company"
            ? a.company.localeCompare(b.company)
            : sort === "name"
              ? a.contact_name.localeCompare(b.contact_name)
              : sort === "days"
                ? (b.days_since_contact || 0) - (a.days_since_contact || 0)
                : sort === "priority"
                  ? stages.indexOf(a.status) - stages.indexOf(b.status)
                  : new Date(b.last_contact_at || b.updated_at).getTime() -
                    new Date(a.last_contact_at || a.updated_at).getTime(),
        ),
    [leads, stage, attention, search, sort],
  );
  async function refresh() {
    await client.invalidateQueries({ queryKey: ["leads"] });
  }
  async function update(leadId: string, updates: UpdateLead) {
    if (!id) return;
    const previous = query.data;
    client.setQueryData(
      ["leads", id],
      leads.map((l) => (l.id === leadId ? { ...l, ...updates } : l)),
    );
    try {
      await leadsApi.update(leadId, id, updates);
      await refresh();
      toast.success("Lead updated");
    } catch (e) {
      client.setQueryData(["leads", id], previous);
      throw e;
    }
  }
  async function remove(ids: string[]) {
    if (!id) return;
    await Promise.all(ids.map((leadId) => leadsApi.delete(leadId, id)));
    setSelected([]);
    setParams({}, { replace: true });
    await refresh();
    toast.success(`${ids.length} lead${ids.length === 1 ? "" : "s"} deleted`);
  }
  async function generate(l: Lead) {
    if (!id) return;
    setBusy(l.id);
    try {
      await leadsApi.generateFollowUp(l.id, id);
      await refresh();
      await client.invalidateQueries({ queryKey: ["drafts"] });
      toast.success("Draft prepared. Review it before sending.");
      navigate(`/drafts?lead=${l.id}`);
    } catch (e) {
      toast.error(errorMessage(e, "Could not prepare a follow-up."));
    } finally {
      setBusy(null);
    }
  }
  function show(l: Lead) {
    setParams({ ...Object.fromEntries(params), lead: l.id }, { replace: true });
  }
  return (
    <DashboardLayout>
      <PageHeader
        title="Leads"
        description="The relationships behind your conversations. Keep the next step in view."
      >
        <button
          className="icon-button"
          onClick={() => query.refetch()}
          aria-label="Refresh leads"
        >
          <RefreshCw
            size={14}
            className={query.isFetching ? "animate-spin" : ""}
          />
        </button>
        <Button
          size="sm"
          variant="outline"
          disabled={detecting}
          onClick={async () => {
            if (!id) return;
            setDetecting(true);
            try {
              const r = await leadsApi.detectLeads(id);
              await refresh();
              toast.success(
                `${r.leadsCreated} leads identified from your conversations`,
              );
            } catch (e) {
              toast.error(errorMessage(e));
            } finally {
              setDetecting(false);
            }
          }}
        >
          {detecting ? (
            <RefreshCw size={13} className="animate-spin" />
          ) : (
            <Users size={13} />
          )}
          Find leads in email
        </Button>
        <Button asChild size="sm">
          <Link to="/inbox">
            Open inbox
            <ArrowUpRight size={12} />
          </Link>
        </Button>
      </PageHeader>
      {query.isPending ? (
        <LoadingState message="Loading leads..." />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <>
          <div className="toolbar">
            <label className="search-field flex-1 max-w-[300px]">
              <Search size={14} />
              <input
                placeholder="Search people or companies..."
                aria-label="Search leads"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="flex gap-2 flex-wrap items-center">
              <select
                className="compact-select"
                aria-label="Lead stage"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              >
                <option value="all">All stages</option>
                <option value="hot">Qualified</option>
                <option value="warm">In conversation</option>
                <option value="cold">New</option>
              </select>
              <select
                className="compact-select"
                aria-label="Lead attention filter"
                value={attention}
                onChange={(e) => setAttention(e.target.value)}
              >
                <option value="all">All relationships</option>
                <option value="due">Follow-up due</option>
                <option value="risk">At risk / 5+ days</option>
              </select>
              <select
                className="compact-select"
                aria-label="Sort leads"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="recent">Latest activity</option>
                <option value="days">Longest since contact</option>
                <option value="company">Company A-Z</option>
                <option value="name">Name A-Z</option>
                <option value="priority">Stage</option>
              </select>
              <div
                className="segmented"
                role="group"
                aria-label="Lead presentation"
              >
                <button
                  onClick={() => setView("table")}
                  aria-pressed={view === "table"}
                  aria-label="Table view"
                >
                  <List size={13} />
                </button>
                <button
                  onClick={() => setView("board")}
                  aria-pressed={view === "board"}
                  aria-label="Board view"
                >
                  <Columns3 size={13} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-muted-foreground mb-4">
            <span>
              {filtered.length} of {leads.length} relationships
            </span>
            {selected.length > 0 && (
              <ConfirmAction
                title={`Delete ${selected.length} selected leads?`}
                description="These leads will be removed from your pipeline. This cannot be undone."
                confirmLabel="Delete leads"
                destructive
                onConfirm={() => remove(selected)}
              >
                <button className="section-link text-destructive">
                  <Trash2 size={11} />
                  Delete {selected.length} selected
                </button>
              </ConfirmAction>
            )}
          </div>
          {filtered.length === 0 ? (
            <div className="border-y">
              <EmptyState
                icon={Users}
                title={
                  leads.length
                    ? "No leads match this view."
                    : "The next opportunity starts in your inbox."
                }
                description={
                  leads.length
                    ? "Try another stage, attention filter, or search."
                    : "Sync your conversations, then use Find leads in email to bring promising inquiries into your pipeline."
                }
              >
                <Button asChild variant="outline" size="sm">
                  <Link to="/inbox">
                    Explore conversations
                    <ArrowRight size={12} />
                  </Link>
                </Button>
              </EmptyState>
            </div>
          ) : view === "table" ? (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-8">
                      <input
                        aria-label="Select all visible leads"
                        type="checkbox"
                        checked={
                          filtered.length > 0 &&
                          filtered.every((l) => selected.includes(l.id))
                        }
                        onChange={(e) =>
                          setSelected(
                            e.target.checked ? filtered.map((l) => l.id) : [],
                          )
                        }
                      />
                    </th>
                    <th>Contact</th>
                    <th>Company</th>
                    <th>Stage</th>
                    <th>Last interaction</th>
                    <th>Next action</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <input
                          aria-label={`Select ${l.contact_name}`}
                          type="checkbox"
                          checked={selected.includes(l.id)}
                          onChange={(e) =>
                            setSelected((s) =>
                              e.target.checked
                                ? [...s, l.id]
                                : s.filter((v) => v !== l.id),
                            )
                          }
                        />
                      </td>
                      <td>
                        <button
                          className="flex items-center gap-10px text-left"
                          onClick={() => show(l)}
                        >
                          <ContactAvatar name={l.contact_name || l.company} />
                          <span className="ml-2.5">
                            <strong className="block text-[12px] font-medium">
                              {l.contact_name || "Unnamed contact"}
                            </strong>
                            <small className="text-[11px] text-muted-foreground">
                              {l.email}
                            </small>
                          </span>
                        </button>
                      </td>
                      <td className="text-[12px]">{l.company || "?"}</td>
                      <td>
                        <StatusLabel status={l.status} />
                      </td>
                      <td>
                        <span className="text-[11px] text-muted-foreground">
                          {l.last_contact_at
                            ? new Date(l.last_contact_at).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" },
                              )
                            : "No recorded contact"}
                        </span>
                        {l.days_since_contact > 0 && (
                          <small className="block text-[11px] text-muted-foreground mt-1">
                            {l.days_since_contact} days ago
                          </small>
                        )}
                      </td>
                      <td>
                        {l.has_ai_draft ? (
                          <Link
                            className="section-link text-primary"
                            to={`/drafts?lead=${l.id}`}
                          >
                            <FileText size={12} />
                            Review draft
                          </Link>
                        ) : (
                          <button
                            className="section-link"
                            disabled={busy === l.id}
                            onClick={() => generate(l)}
                          >
                            {busy === l.id ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <Clock size={12} />
                            )}
                            Prepare follow-up
                          </button>
                        )}
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`Open ${l.contact_name}`}
                          onClick={() => show(l)}
                        >
                          <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="lead-board">
              {stages.map((s) => (
                <section key={s}>
                  <div className="lead-board-heading">
                    <StatusLabel status={s} />
                    <span>{filtered.filter((l) => l.status === s).length}</span>
                  </div>
                  {filtered
                    .filter((l) => l.status === s)
                    .map((l) => (
                      <article key={l.id}>
                        <button
                          className="w-full text-left"
                          onClick={() => show(l)}
                        >
                          <div className="flex gap-2 items-center">
                            <ContactAvatar name={l.contact_name || l.company} />
                            <div>
                              <h3>{l.company || l.contact_name}</h3>
                              <p>{l.contact_name}</p>
                            </div>
                          </div>
                          <p className="line-clamp-2 mt-3">
                            {l.last_message || l.email}
                          </p>
                        </button>
                        <div className="lead-board-footer">
                          <span>{l.days_since_contact}d since contact</span>
                          <select
                            value={l.status}
                            aria-label={`Stage for ${l.contact_name}`}
                            onChange={(e) =>
                              update(l.id, {
                                status: e.target.value as LeadStatus,
                              }).catch((err) => toast.error(errorMessage(err)))
                            }
                          >
                            <option value="cold">New</option>
                            <option value="warm">In conversation</option>
                            <option value="hot">Qualified</option>
                          </select>
                        </div>
                      </article>
                    ))}
                  {!filtered.some((l) => l.status === s) && (
                    <p className="text-[11px] text-muted-foreground px-3 py-8 text-center">
                      No leads in this stage.
                    </p>
                  )}
                </section>
              ))}
            </div>
          )}
        </>
      )}
      <Sheet
        open={!!lead}
        onOpenChange={(open) => {
          if (!open) {
            const next = new URLSearchParams(params);
            next.delete("lead");
            setParams(next, { replace: true });
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-[470px] overflow-auto">
          <SheetHeader className="text-left">
            <SheetTitle className="text-lg">Lead details</SheetTitle>
            <SheetDescription className="text-xs">
              Conversation context and the next decision.
            </SheetDescription>
          </SheetHeader>
          {lead && (
            <LeadDetails
              key={lead.id}
              lead={lead}
              busy={busy === lead.id}
              onSave={(updates) => update(lead.id, updates)}
              onGenerate={() => generate(lead)}
              onCompose={() => setCompose(lead)}
              onDelete={() => remove([lead.id])}
            />
          )}
        </SheetContent>
      </Sheet>
      <EmailComposeDialog
        isOpen={!!compose}
        onClose={() => setCompose(null)}
        mode="new"
        defaultTo={compose?.email}
        defaultSubject={
          compose ? `Following up / ${compose.company}` : undefined
        }
      />
    </DashboardLayout>
  );
}
function LeadDetails({
  lead,
  busy,
  onSave,
  onGenerate,
  onCompose,
  onDelete,
}: {
  lead: Lead;
  busy: boolean;
  onSave: (updates: UpdateLead) => Promise<void>;
  onGenerate: () => void;
  onCompose: () => void;
  onDelete: () => Promise<void>;
}) {
  const [fields, setFields] = useState({
    contact_name: lead.contact_name,
    company: lead.company,
    email: lead.email,
    phone: lead.phone || "",
    website: lead.website || "",
    status: lead.status,
  });
  const [saving, setSaving] = useState(false);
  return (
    <div className="mt-7">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          try {
            await onSave(fields);
          } catch (err) {
            toast.error(errorMessage(err));
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="flex gap-3 items-center mb-6">
          <ContactAvatar name={lead.contact_name} />
          <div>
            <h2 className="text-sm">{lead.contact_name}</h2>
            <p className="text-[12px] text-muted-foreground mt-1">
              {lead.company}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {(
            [
              { key: "contact_name", label: "Contact name", type: "text" },
              { key: "company", label: "Company", type: "text" },
              { key: "email", label: "Email", type: "email" },
              { key: "phone", label: "Phone", type: "tel" },
              { key: "website", label: "Website", type: "text" },
            ] as const
          ).map((f) => (
            <label key={f.key} className="form-field">
              <span>{f.label}</span>
              <input
                className="form-input"
                type={f.type}
                value={fields[f.key]}
                required={f.key === "email" || f.key === "contact_name"}
                onChange={(e) =>
                  setFields((s) => ({ ...s, [f.key]: e.target.value }))
                }
              />
            </label>
          ))}
          <label className="form-field">
            <span>Stage</span>
            <select
              className="form-input"
              value={fields.status}
              onChange={(e) =>
                setFields((s) => ({
                  ...s,
                  status: e.target.value as LeadStatus,
                }))
              }
            >
              <option value="cold">New</option>
              <option value="warm">In conversation</option>
              <option value="hot">Qualified</option>
            </select>
          </label>
        </div>
        <Button className="mt-5" type="submit" size="sm" disabled={saving}>
          {saving ? "Saving..." : "Save lead"}
        </Button>
      </form>
      <section className="settings-section mt-6">
        <h2>Conversation context</h2>
        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed mt-3">
          {lead.last_message || "No message summary is available yet."}
        </p>
        {lead.ai_suggestion && (
          <p className="text-xs leading-relaxed mt-4">{lead.ai_suggestion}</p>
        )}
        <Link to={`/inbox?lead=${lead.id}`} className="section-link mt-5">
          View conversations
          <ArrowUpRight size={12} />
        </Link>
      </section>
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={onCompose}>
          <Mail size={12} />
          Compose email
        </Button>
        <Button size="sm" disabled={busy} onClick={onGenerate}>
          {busy ? "Preparing..." : "Prepare follow-up"}
        </Button>
      </div>
      <div className="border-t mt-8 pt-5">
        <ConfirmAction
          title="Delete this lead?"
          description="This removes the lead from your pipeline. This cannot be undone."
          onConfirm={onDelete}
          confirmLabel="Delete lead"
          destructive
        >
          <Button variant="ghost" size="sm" className="text-destructive">
            <Trash2 size={12} />
            Delete lead
          </Button>
        </ConfirmAction>
      </div>
    </div>
  );
}
