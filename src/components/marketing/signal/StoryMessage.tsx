import {
  ArrowUpRight,
  Check,
  FileText,
  Inbox,
  MoreHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import { scenarios } from "./sample-data";

export default function StoryMessage({ step }: { step: number }) {
  const sample = scenarios[0];
  return (
    <div
      className="signal-story-frame"
      data-stage={step}
      aria-label="Illustrative email to opportunity journey"
    >
      <div className="signal-window-bar">
        <span className="signal-window-dots">
          <i />
          <i />
          <i />
        </span>
        <span>inboxiq / {step === 4 ? "workspace" : "conversation"}</span>
        <span>Sample workspace</span>
      </div>
      <div className="signal-story-body">
        <aside className="signal-story-sidebar" aria-hidden={step !== 4}>
          <span className="signal-mini-brand">InboxIQ</span>
          <span>
            <Inbox size={14} /> Inbox
          </span>
          <span>
            <Users size={14} /> Leads
          </span>
          <span>
            <FileText size={14} /> Drafts
          </span>
          <small>JT / Personal workspace</small>
        </aside>
        <div className="signal-story-email">
          <div className="signal-message-top">
            <span>INCOMING CONVERSATION</span>
            <MoreHorizontal size={17} />
          </div>
          <h3>{sample.subject}</h3>
          <div className="signal-sender">
            <span className="signal-avatar">MP</span>
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
            <p>
              We're launching a <mark>new product next quarter</mark> and
              looking for a <mark>design partner.</mark> I liked what you did
              with the last project.
            </p>
            <p>Could we find a time to talk through scope and timelines?</p>
            <p>Maya</p>
          </div>
          <div className="signal-story-context">
            <Sparkles size={14} />
            <div>
              <strong>Project inquiry</strong>
              <p>
                Clear intent. A specific timeline. A conversation worth
                continuing.
              </p>
            </div>
            <span>Lead identified</span>
          </div>
        </div>
        <div className="signal-story-draft" aria-hidden={step < 3}>
          <span className="signal-eyebrow">
            <Sparkles size={12} /> SUGGESTED REPLY
          </span>
          <h4>A thoughtful next move.</h4>
          <p>Hi Maya,</p>
          <p>
            I'd be happy to discuss the product launch and learn more about the
            scope and timeline.
          </p>
          <p>Would Tuesday at 10 work for a short call?</p>
          <p>
            Best,
            <br />
            Jordan
          </p>
          <div>
            <Check size={13} /> Review and edit before sending
          </div>
          <a href="#demo">
            Try the editable demo <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
      <div className="signal-story-footer">
        <span>
          <i />{" "}
          {step >= 3
            ? "A response, ready for your judgment."
            : step >= 2
              ? "The message and its context, connected."
              : "Every opportunity starts somewhere."}
        </span>
        <span>{String(Math.max(step, 1)).padStart(2, "0")} / 04</span>
      </div>
    </div>
  );
}
