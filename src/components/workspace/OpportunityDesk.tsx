import { lazy, Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight, Orbit, Focus, Mail } from "lucide-react";
import type { Email, EmailThread, Lead } from "@/types/database";
import type { ActionQueueTask } from "@/lib/api/action-queue";
import {
  buildOpportunities,
  filterOpportunities,
  opportunityPosition,
  type OpportunityFilter,
} from "@/lib/opportunity-map";
import { ContactAvatar, StatusLabel } from "@/components/WorkspaceUI";
import EmailThreadDetailPanel from "@/components/dashboard/EmailThreadDetailPanel";
import VisualBoundary from "./VisualBoundary";
import { useElementVisible, useVisualSystem } from "./visual-context";

const OpportunityScene = lazy(() => import("./OpportunityScene"));
export default function OpportunityDesk({
  leads,
  threads,
  drafts,
  tasks,
}: {
  leads: Lead[];
  threads: EmailThread[];
  drafts: Email[];
  tasks: ActionQueueTask[];
}) {
  const [filter, setFilter] = useState<OpportunityFilter>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const labels = useRef(new Map<string, HTMLButtonElement>());
  const visible = useElementVisible(root);
  const [mapLimit, setMapLimit] = useState(4);
  useEffect(() => {
    if (!root.current) return;
    const observer = new ResizeObserver(([entry]) => setMapLimit(entry.contentRect.width >= 1000 ? 6 : 4));
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  const { gpu, compact, motion } = useVisualSystem();
  const opportunities = useMemo(
    () => buildOpportunities(leads, threads, drafts, tasks),
    [leads, threads, drafts, tasks],
  );
  const filtered = useMemo(
    () => filterOpportunities(opportunities, filter),
    [opportunities, filter],
  );
  const current =
    filtered.find((item) => item.lead.id === selected) || filtered[0];
  const displayed = useMemo(() => {
    const limit = mapLimit;
    const limited = filtered.slice(0, limit);
    if (current && !limited.includes(current))
      return [...limited.slice(0, limit - 1), current];
    return limited;
  }, [filtered, current, mapLimit]);
  const select = (id: string) => {
    setSelected(id);
    setThreadId(null);
    setReading(true);
  };
  const conversation =
    current?.threads.find((thread) => thread.id === threadId) ||
    current?.threads[0];
  const threeD = gpu && !compact;
  return (
    <section
      ref={root}
      className="silver-opportunity-desk"
      data-workspace-focus={reading ? "reading" : undefined}
      aria-label="Relationship map"
    >
      <div className="silver-map-heading">
        <div>
          <span className="silver-eyebrow">
            <Orbit size={13} /> YOUR RELATIONSHIPS, IN ORBIT
          </span>
          <h2>Every connection has a next step.</h2>
          <p>Explore the people behind your pipeline.</p>
        </div>
        <div
          className="silver-map-filters"
          aria-label="Filter relationship map"
        >
          {(
            [
              { id: "all", label: "All" },
              { id: "attention", label: "Needs attention" },
              { id: "drafts", label: "Drafts ready" },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              aria-pressed={filter === option.id}
              onClick={() => {
                setFilter(option.id);
                setSelected(null);
                setReading(false);
                setThreadId(null);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {opportunities.length === 0 ? (
        <div className="silver-map-empty">
          <Orbit size={28} />
          <h3>Your relationship map starts with a conversation.</h3>
          <p>Qualified leads will appear here after your inbox is analyzed.</p>
          <Link to="/inbox">
            Open inbox <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <>
          <div className="silver-map-toolbar">
            <label>
              <Focus size={13} />
              <select
                aria-label="Choose a relationship"
                value={current?.lead.id || ""}
                onChange={(event) => select(event.target.value)}
              >
                {!filtered.length && (
                  <option value="">No matching relationships</option>
                )}
                {filtered.map((item) => (
                  <option key={item.lead.id} value={item.lead.id}>
                    {item.lead.contact_name} · {item.lead.company}
                  </option>
                ))}
              </select>
            </label>
            <span>
              {displayed.length < filtered.length
                ? `${displayed.length} of ${filtered.length} on the map`
                : `${filtered.length} relationship${filtered.length === 1 ? "" : "s"}`}
            </span>
          </div>
          {!filtered.length ? (
            <div className="silver-map-empty">
              <Mail size={24} />
              <h3>
                {filter === "drafts"
                  ? "No drafts waiting for review."
                  : "Nothing needs attention right now."}
              </h3>
              <p>Switch to All to explore your relationships.</p>
            </div>
          ) : (
            <div className="silver-map-layout">
              <div className="silver-map-stage" data-three-d={threeD}>
                <div className="silver-map-guide" aria-hidden="true" />
                <div className="silver-map-core-label" aria-hidden="true">
                  INBOXIQ<span>CONNECTED INTELLIGENCE</span>
                </div>
                {threeD && visible && (
                  <VisualBoundary>
                    <Suspense fallback={null}>
                      <OpportunityScene
                        items={displayed}
                        selected={current.lead.id}
                        onSelect={select}
                        labels={labels}
                        animate={motion && visible}
                      />
                    </Suspense>
                  </VisualBoundary>
                )}
                <div className="silver-map-labels">
                  {displayed.map((item, index) => {
                    const p = opportunityPosition(index, displayed.length);
                    return (
                      <button
                        key={item.lead.id}
                        ref={(element) => {
                          if (element)
                            labels.current.set(item.lead.id, element);
                          else labels.current.delete(item.lead.id);
                        }}
                        style={{
                          left: `${50 + p[0] * 10}%`,
                          top: `${50 - p[1] * 18}%`,
                        }}
                        aria-label={`Explore ${item.lead.contact_name}, ${item.lead.company}`}
                        aria-pressed={item.lead.id === current.lead.id}
                        title={item.lead.contact_name}
                        onClick={() => select(item.lead.id)}
                      >
                        <i aria-hidden="true" />
                        <span>
                          {item.lead.contact_name.split(" ")[0]}
                          <small>
                            {item.needsAttention
                              ? "Needs attention"
                              : item.threads.length
                                ? `${item.threads.length} conversation${item.threads.length === 1 ? "" : "s"}`
                                : "Relationship"}
                          </small>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="silver-map-caption">
                  <span className="silver-live-dot" />
                  {threeD
                    ? "Drag to explore · Select a connection"
                    : "Select a connection to explore"}
                </div>
              </div>
              <aside
                className="silver-map-detail"
                aria-label="Selected relationship"
              >
                {reading && conversation ? (
                  <div className="silver-map-reading">
                    <EmailThreadDetailPanel
                      key={conversation.id}
                      embedded
                      thread={conversation}
                      onClose={() => setReading(false)}
                      onArchived={() => setReading(false)}
                    />
                    <Link
                      className="silver-open-inbox"
                      to={`/inbox?thread=${conversation.id}`}
                    >
                      Open full conversation <ArrowUpRight size={12} />
                    </Link>
                  </div>
                ) : (
                  current && (
                    <>
                      <div className="silver-map-contact">
                        <ContactAvatar name={current.lead.contact_name} />
                        <div>
                          <h3>{current.lead.contact_name}</h3>
                          <p>{current.lead.company}</p>
                        </div>
                        <StatusLabel status={current.lead.status} />
                      </div>
                      <p className="silver-map-context">
                        {current.lead.last_message ||
                          "Open a conversation to see the latest context."}
                      </p>
                      <div className="silver-map-counts">
                        <span>
                          <strong>{current.threads.length}</strong>Conversations
                        </span>
                        <span>
                          <strong>{current.drafts.length}</strong>Drafts ready
                        </span>
                      </div>
                      <div className="silver-map-next">
                        <span className="silver-eyebrow">NEXT STEP</span>
                        <h4>
                          {current.tasks[0]?.title ||
                            (current.drafts.length
                              ? "Review your response"
                              : current.needsAttention
                                ? "Check in on this relationship"
                                : "Continue the conversation")}
                        </h4>
                        <p>
                          {current.tasks[0]?.description ||
                            (current.lead.days_since_contact >= 5
                              ? `${current.lead.days_since_contact} days since your last contact.`
                              : "Your latest context is one click away.")}
                        </p>
                        {current.drafts[0] ? (
                          <Link to={`/drafts?draft=${current.drafts[0].id}`}>
                            Review draft <ArrowRight size={12} />
                          </Link>
                        ) : conversation ? (
                          <button onClick={() => setReading(true)}>
                            Read conversation <ArrowRight size={12} />
                          </button>
                        ) : (
                          <Link to={`/leads?lead=${current.lead.id}`}>
                            View lead <ArrowRight size={12} />
                          </Link>
                        )}
                      </div>
                      {current.threads.length > 0 && (
                        <div className="silver-map-conversations">
                          {current.threads.slice(0, 2).map((thread) => (
                            <button
                              key={thread.id}
                              onClick={() => {
                                setThreadId(thread.id);
                                setReading(true);
                              }}
                            >
                              <Mail size={12} />
                              <span>{thread.subject}</span>
                              <ArrowUpRight size={12} />
                            </button>
                          ))}
                        </div>
                      )}
                      <Link
                        className="silver-map-lead-link"
                        to={`/leads?lead=${current.lead.id}`}
                      >
                        View relationship <ArrowUpRight size={12} />
                      </Link>
                    </>
                  )
                )}
              </aside>
            </div>
          )}
        </>
      )}
    </section>
  );
}
