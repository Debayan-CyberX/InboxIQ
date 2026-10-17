import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  Clock3,
  FileText,
  Inbox,
  LayoutDashboard,
  MoreHorizontal,
  Orbit,
  Search,
  Sparkles,
} from "lucide-react";
import { scenarios, type DemoTone } from "./sample-data";

export default function SignalDemo() {
  const [index, setIndex] = useState(0),
    [tone, setTone] = useState<DemoTone>("professional");
  const [reply, setReply] = useState<string>(scenarios[0].replies.professional);
  const [drafting, setDrafting] = useState(false),
    [reviewed, setReviewed] = useState(false),
    [saved, setSaved] = useState(false),
    [map, setMap] = useState(false);
  const sample = scenarios[index];
  const select = (next: number) => {
    setIndex(next);
    setTone("professional");
    setReply(scenarios[next].replies.professional);
    setDrafting(false);
    setReviewed(false);
    setSaved(false);
  };
  const changeTone = (next: DemoTone) => {
    setTone(next);
    setReply(sample.replies[next]);
    setReviewed(false);
    setSaved(false);
  };
  return (
    <div
      className="signal-demo"
      id="demo"
      aria-label="Interactive sample workspace"
    >
      <div className="signal-demo-intro">
        <div>
          <span className="signal-eyebrow">YOUR TURN / NO ACCOUNT NEEDED</span>
          <h2>
            Take the next step.
            <br />
            <span>See how it feels.</span>
          </h2>
        </div>
        <p>
          Choose a conversation. Explore its context.
          <br />
          Make the reply your own.
        </p>
      </div>
      <div
        className="signal-scenario-tabs"
        role="group"
        aria-label="Choose a demo scenario"
      >
        {scenarios.map((item, i) => (
          <button
            key={item.id}
            aria-pressed={index === i}
            onClick={() => select(i)}
          >
            <span>0{i + 1}</span>
            {item.label}
            <ArrowUpRight size={13} />
          </button>
        ))}
      </div>
      <div className="signal-demo-window">
        <div className="signal-window-bar">
          <span className="signal-window-dots">
            <i />
            <i />
            <i />
          </span>
          <span>inboxiq / your workspace</span>
          <span className="signal-sample-badge">Interactive demo</span>
        </div>
        <div className="signal-demo-body">
          <aside className="signal-demo-nav">
            <span className="signal-mini-brand">InboxIQ</span>
            <span className="signal-demo-person">
              <span className="signal-avatar">JT</span>
              <span>
                Jordan's workspace<small>Personal workspace</small>
              </span>
            </span>
            <span className="signal-eyebrow">WORKSPACE</span>
            <button
              aria-label="Demo inbox"
              aria-pressed={!map}
              onClick={() => setMap(false)}
            >
              <Inbox size={15} />
              <span>Inbox</span>
              <small>3</small>
            </button>
            <button
              aria-label="Demo relationships"
              aria-pressed={map}
              onClick={() => setMap(true)}
            >
              <Orbit size={15} />
              <span>Relationships</span>
            </button>
            <span className="signal-demo-nav-bottom">
              <Sparkles size={14} />
              <span>Intelligence, in the loop.</span>
            </span>
          </aside>
          {map ? (
            <div className="signal-demo-map">
              <div className="signal-demo-map-heading">
                <span className="signal-eyebrow">
                  YOUR RELATIONSHIPS, IN ORBIT
                </span>
                <h3>Every connection has a next step.</h3>
                <p>Select a connection to read the conversation.</p>
              </div>
              <div className="signal-demo-orbit">
                <svg viewBox="0 0 600 330" aria-hidden="true">
                  <ellipse cx="300" cy="165" rx="240" ry="110" />
                  <ellipse cx="300" cy="165" rx="180" ry="75" />
                  {[
                    [475, 100],
                    [140, 130],
                    [330, 275],
                  ].map(([x, y]) => (
                    <path key={x} d={`M300 165L${x} ${y}`} />
                  ))}
                </svg>
                <span className="signal-demo-core" aria-hidden="true" />
                <span className="signal-demo-core-label">INBOXIQ</span>
                {scenarios.map((item, i) => (
                  <button
                    key={item.id}
                    style={{
                      left: `${[79, 23, 55][i]}%`,
                      top: `${[30, 39, 82][i]}%`,
                    }}
                    aria-label={`Explore sample relationship with ${item.name}`}
                    aria-pressed={index === i}
                    onClick={() => {
                      select(i);
                      setMap(false);
                    }}
                  >
                    <i />
                    <strong>{item.name.split(" ")[0]}</strong>
                    <small>{item.company}</small>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="signal-demo-list">
                <div>
                  <span>
                    Inbox <small>3</small>
                  </span>
                  <Search size={13} />
                </div>
                {scenarios.map((item, i) => (
                  <button
                    key={item.id}
                    aria-label={`Read sample email from ${item.name}`}
                    aria-pressed={i === index}
                    onClick={() => select(i)}
                  >
                    <span>
                      <strong>{item.name}</strong>
                      <time>{i ? "1d" : "Now"}</time>
                    </span>
                    <span>{item.subject}</span>
                    <small>{item.message}</small>
                  </button>
                ))}
                <span className="signal-demo-list-note">
                  <i /> All conversations up to date
                </span>
              </div>
              <div className="signal-demo-reader" data-lenis-prevent>
                <div className="signal-demo-reader-tools">
                  <span>
                    <Inbox size={12} />{" "}
                    {drafting ? "Suggested reply" : "Conversation"}
                  </span>
                  <MoreHorizontal size={16} />
                </div>
                <div className="signal-demo-reader-content">
                  <span className="signal-eyebrow">
                    {sample.company.toUpperCase()} /{" "}
                    {sample.signal.toUpperCase()}
                  </span>
                  <h3>{sample.subject}</h3>
                  <div className="signal-sender">
                    <span className="signal-avatar">{sample.initials}</span>
                    <div>
                      <strong>{sample.name}</strong>
                      <small>
                        {sample.email} <span>to you</span>
                      </small>
                    </div>
                    <time>{sample.time}</time>
                  </div>
                  <div className="signal-message-body">
                    <p>Hi Jordan,</p>
                    <p>{sample.message}</p>
                    <p>{sample.name.split(" ")[0]}</p>
                  </div>
                  <div className="signal-demo-insight">
                    <Sparkles size={14} />
                    <div>
                      <strong>{sample.signal}</strong>
                      <p>{sample.context}</p>
                    </div>
                  </div>
                  {drafting ? (
                    <div className="signal-demo-reply">
                      <div>
                        <span>
                          <FileText size={13} /> Suggested reply
                        </span>
                        <label>
                          Tone
                          <select
                            aria-label="Sample reply tone"
                            value={tone}
                            onChange={(event) =>
                              changeTone(event.target.value as DemoTone)
                            }
                          >
                            <option value="professional">Professional</option>
                            <option value="warm">Warm</option>
                            <option value="concise">Concise</option>
                          </select>
                        </label>
                      </div>
                      <textarea
                        aria-label="Edit sample reply"
                        value={reply}
                        onChange={(event) => {
                          setReply(event.target.value);
                          setReviewed(false);
                          setSaved(false);
                        }}
                        rows={8}
                      />
                      <div className="signal-demo-reply-actions">
                        <button
                          disabled={!reply.trim()}
                          onClick={() => setSaved(true)}
                        >
                          {saved ? <Check size={12} /> : <FileText size={12} />}
                          {saved ? "Edit saved in demo" : "Save sample edit"}
                        </button>
                        <button
                          disabled={!reply.trim()}
                          onClick={() => setReviewed(true)}
                        >
                          {reviewed ? (
                            <CheckCheck size={12} />
                          ) : (
                            <Check size={12} />
                          )}
                          {reviewed ? "Reviewed" : "Mark reviewed"}
                        </button>
                      </div>
                      <p role="status">
                        {reviewed
                          ? "Reviewed in this demo. No email has been sent."
                          : saved
                            ? "Your edit is saved until you switch conversations or leave this demo."
                            : "Illustrative draft. Edit it freely; no email is sent."}
                      </p>
                    </div>
                  ) : (
                    <button
                      className="signal-demo-draft-button"
                      onClick={() => setDrafting(true)}
                    >
                      <Sparkles size={14} /> Explore a suggested reply{" "}
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
                <div className="signal-demo-reader-footer">
                  <span>
                    <Check size={12} /> Your words. Your approval.
                  </span>
                  <span>Sample conversation</span>
                </div>
              </div>
            </>
          )}
          <aside className="signal-demo-context">
            <span className="signal-eyebrow">RELATIONSHIP CONTEXT</span>
            <div className="signal-demo-contact">
              <span className="signal-avatar">{sample.initials}</span>
              <div>
                <h4>{sample.name}</h4>
                <p>{sample.company}</p>
              </div>
            </div>
            <dl>
              <div>
                <dt>Intent</dt>
                <dd>{sample.intent}</dd>
              </div>
              <div>
                <dt>Timing</dt>
                <dd>{sample.timeline}</dd>
              </div>
            </dl>
            <div className="signal-demo-next">
              <span className="signal-eyebrow">
                <Clock3 size={11} /> NEXT STEP
              </span>
              <h4>{sample.next}</h4>
              <p>{sample.nextDetail}</p>
              <button
                onClick={() => {
                  setMap(false);
                  setDrafting(true);
                }}
              >
                Review a response <ArrowRight size={12} />
              </button>
            </div>
            <button
              className="signal-demo-map-link"
              onClick={() => setMap(!map)}
            >
              {map ? <Inbox size={13} /> : <LayoutDashboard size={13} />}
              {map ? "Back to inbox" : "Explore relationships"}
              <ArrowUpRight size={12} />
            </button>
          </aside>
        </div>
      </div>
      <p className="signal-demo-disclaimer">
        <span>
          <i /> A working demonstration, with fictional sample data.
        </span>
        <span>
          Sample replies are prewritten. Edits stay in this demo. No emails are
          sent.
        </span>
      </p>
    </div>
  );
}
