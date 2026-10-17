import { useEffect, useRef, useState } from "react";
import ConversationVisual from "@/components/marketing/ConversationVisual";
import SignalChapter from "@/components/marketing/SignalChapter";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Inbox,
  FileText,
  Users,
  Search,
  Send,
  CheckCheck,
  Clock,
  Menu,
  X,
  CornerDownRight,
  Lock,
  ShieldCheck,
  PanelLeft,
} from "lucide-react";
import Brand from "@/components/Brand";
import { useSession } from "@/lib/auth-client";
import "./landing.css";
const steps = [
  {
    name: "Received",
    label: "A conversation arrives",
    detail: "A message worth a closer look.",
    icon: Inbox,
  },
  {
    name: "Classified",
    label: "The signal, surfaced",
    detail: "A project inquiry, with context attached.",
    icon: Users,
  },
  {
    name: "Reviewed",
    label: "A reply that sounds like you",
    detail: "Edit the suggestion. Make it your own.",
    icon: FileText,
  },
  {
    name: "Followed up",
    label: "Keep the next step in sight",
    detail: "A reviewable follow-up, connected to the conversation.",
    icon: Clock,
  },
  {
    name: "Converted",
    label: "A conversation becomes an opportunity",
    detail: "An illustrative outcome, built one thoughtful reply at a time.",
    icon: CheckCheck,
  },
];
function DemoWorkspace({
  stage,
  setStage,
  compact = false,
}: {
  stage: number;
  setStage: (stage: number) => void;
  compact?: boolean;
}) {
  const [edited, setEdited] = useState(false);
  const [reply, setReply] = useState(
    "Hi Maya, thanks for the detail. The new product launch sounds like a great fit. Would Tuesday at 10 work for a short call?",
  );
  return (
    <div className={`story-workspace ${compact ? "compact" : ""}`}>
      <div className="story-chrome">
        <div className="flex gap-1.5">
          <i />
          <i />
          <i />
        </div>
        <span>inboxiq / workspace</span>
        <span>Sample workspace</span>
      </div>
      <div className="story-body">
        <aside className="story-sidebar">
          <Brand />
          <div className="story-nav active">
            <Inbox size={13} />
            Inbox<span>3</span>
          </div>
          <div className="story-nav">
            <Users size={13} />
            Leads
          </div>
          <div className="story-nav">
            <FileText size={13} />
            Drafts
          </div>
          <div className="story-nav footer">
            <span className="story-avatar">JT</span>Jordan's workspace
          </div>
        </aside>
        <div className="story-message-list">
          <div className="story-list-heading">
            Inbox <Search size={12} />
          </div>
          {[
            {
              name: "Maya Patel",
              subject: "A new product, a bigger launch",
              time: "Now",
              body: "We're looking for a partner to help...",
            },
            {
              name: "Oliver Chen",
              subject: "Re: A quick introduction",
              time: "12m",
              body: "Thanks for getting back to me.",
            },
            {
              name: "Elena Ruiz",
              subject: "Picking up where we left off",
              time: "1h",
              body: "A few thoughts ahead of our call.",
            },
          ].map((m, i) => (
            <div
              key={m.name}
              className={`story-message ${i === 0 ? "selected" : ""}`}
            >
              <div>
                <strong>{m.name}</strong>
                <time>{m.time}</time>
              </div>
              <p>{m.subject}</p>
              <small>{m.body}</small>
            </div>
          ))}
        </div>
        <div className="story-reader">
          <div className="story-reader-toolbar">
            <span>{stage > 0 ? "Sales inquiry" : "Conversation"}</span>
            <div>
              <Clock size={12} />
              <span className="story-separator" />
              <ArrowUpRight size={13} />
            </div>
          </div>
          <div className="story-reader-content">
            <div className="story-email-subject">
              A new product,
              <br />a bigger launch.
            </div>
            <div className="story-sender">
              <span className="story-avatar">MP</span>
              <div>
                <strong>Maya Patel</strong>
                <small>
                  maya@example.com <span>to you</span>
                </small>
              </div>
              <span>10:24 AM</span>
            </div>
            <div className="story-email-text">
              <p>Hi Jordan,</p>
              <p>
                We're launching a new product next quarter and looking for a
                design partner. I liked what you did with the last project.
              </p>
              <p>Could we find a time to talk through scope and timelines?</p>
              <p>Maya</p>
            </div>
            {stage > 0 && (
              <div className="story-context">
                <div className="story-context-title">
                  <span className="story-signal" />
                  Project inquiry <span>Lead identified</span>
                </div>
                <p>
                  Clear project intent. A specific timeline. Ready for a
                  conversation.
                </p>
              </div>
            )}
            {stage === 0 && (
              <button className="story-action" onClick={() => setStage(1)}>
                See the opportunity <ArrowRight size={12} />
              </button>
            )}
            {stage === 1 && (
              <button className="story-action" onClick={() => setStage(2)}>
                Review a suggested reply <ArrowRight size={12} />
              </button>
            )}
            {stage === 2 && (
              <div className="story-reply">
                <div className="story-context-title">
                  <FileText size={12} />
                  Suggested reply<span>Not sent</span>
                </div>
                <label
                  htmlFor={compact ? "story-reply-small" : "story-reply"}
                  className="sr-only"
                >
                  Edit sample response
                </label>
                <textarea
                  id={compact ? "story-reply-small" : "story-reply"}
                  value={reply}
                  onChange={(e) => {
                    setReply(e.target.value);
                    setEdited(true);
                  }}
                />
                <div className="flex items-center justify-between">
                  <small>
                    {edited
                      ? "Your edit is saved in this demo"
                      : "Editable. Always reviewed by you."}
                  </small>
                  <button className="story-action" onClick={() => setStage(3)}>
                    Mark reviewed <Check size={11} />
                  </button>
                </div>
              </div>
            )}
            {stage === 3 && (
              <div className="story-followup">
                <Clock size={14} />
                <div>
                  <strong>Next step: confirm the conversation</strong>
                  <p>
                    Follow-up connected to Maya's lead. Nothing sends
                    automatically.
                  </p>
                </div>
                <button
                  onClick={() => setStage(4)}
                  aria-label="Complete sample workflow"
                >
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
            {stage === 4 && (
              <div className="story-followup complete">
                <CheckCheck size={15} />
                <div>
                  <strong>An opportunity, ready to move forward.</strong>
                  <p>From a message to a clear next step.</p>
                </div>
                <button onClick={() => setStage(0)} className="text-[9px]">
                  Replay
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function Lifecycle({ active }: { active: number }) {
  return (
    <div
      className="lifecycle"
      role="img"
      aria-label="Lead lifecycle: received, classified, reviewed, followed up, converted"
    >
      <svg viewBox="0 0 1000 50" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M50 25H950"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
        <path
          d={`M50 25H${50 + active * 225}`}
          stroke="#8fc7b5"
          strokeWidth="1.5"
        />
      </svg>
      {steps.map((s, i) => (
        <div className={i <= active ? "done" : ""} key={s.name}>
          <span>
            {i < active ? <Check size={13} /> : String(i + 1).padStart(2, "0")}
          </span>
          <p>{s.name}</p>
        </div>
      ))}
    </div>
  );
}
export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  useLandingMotion(root);
  const { data } = useSession();
  const [stage, setStage] = useState(0);
  const [nav, setNav] = useState(false);
  const [after, setAfter] = useState(true);
  const [feature, setFeature] = useState(0);
  const panels = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting)
            setFeature(Number((e.target as HTMLElement).dataset.feature));
        });
      },
      { rootMargin: "-25% 0px -35% 0px", threshold: 0 },
    );
    panels.current
      ?.querySelectorAll("[data-feature]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  if (data?.session) return <Navigate to="/dashboard" replace />;
  return (
    <div className="marketing cinematic" ref={root}>
      <a className="marketing-skip" href="#main">
        Skip to content
      </a>
      <header className="marketing-header">
        <div>
          <Link to="/" aria-label="InboxIQ home">
            <Brand />
          </Link>
          <nav className={nav ? "open" : ""} aria-label="Main navigation">
            <a href="#product" onClick={() => setNav(false)}>
              Product
            </a>
            <a href="#workflow" onClick={() => setNav(false)}>
              Workflow
            </a>
            <a href="#principles" onClick={() => setNav(false)}>
              Our approach
            </a>
          </nav>
          <div className="marketing-header-actions">
            <Link to="/sign-in">Log in</Link>
            <Link className="marketing-button small" to="/sign-up">
              Get started
              <ArrowUpRight size={12} />
            </Link>
            <button
              className="marketing-menu"
              onClick={() => setNav(!nav)}
              aria-expanded={nav}
              aria-label={nav ? "Close navigation" : "Open navigation"}
            >
              {nav ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        <section className="cinema-hero" aria-labelledby="hero-title">
          <div className="hero-topline">
            <span>INTELLIGENCE, IN THE LOOP.</span>
            <span>YOUR INBOX. RECONSIDERED.</span>
          </div>
          <div className="silver-atmosphere" aria-hidden="true">
            <div className="silver-source" />
            {[0, 1, 2, 3, 4].map((i) => (
              <span className={`silver-shaft shaft-${i}`} key={i} />
            ))}
          </div>
          <ConversationVisual />
          <div className="hero-type">
            <h1
              id="hero-title"
              aria-label="Every conversation. An opportunity."
            >
              <span className="hero-line">
                <span>Every</span>
              </span>
              <span className="hero-line">
                <span>conversation.</span>
              </span>
              <span className="hero-line hero-last">
                <span>An opportunity.</span>
              </span>
            </h1>
          </div>
          <div className="hero-aside">
            <span className="chapter-label">
              01 &mdash; A CLEARER CONNECTION
            </span>
            <p>
              See the potential in every message. Bring your conversations,
              leads, and next moves into focus.
            </p>
            <Link to="/sign-up" className="cinema-cta">
              Enter your workspace
              <ArrowUpRight size={17} />
            </Link>
            <a href="#signal" className="hero-explore">
              Explore the connection
              <ChevronDown size={13} />
            </a>
          </div>
          <div className="hero-baseline">
            <span>CONVERSATION &rarr; CONTEXT &rarr; OPPORTUNITY</span>
            <span>
              SCROLL TO CONNECT THE DOTS <span className="scroll-line" />
            </span>
          </div>
        </section>
        <section className="editorial-manifesto" id="workflow">
          <div className="editorial-top">
            <span>THE INBOX, RECONSIDERED.</span>
            <span>INBOXIQ / 002</span>
          </div>
          <div className="manifesto-type">
            <span className="reveal-line">Less noise.</span>
            <span className="reveal-line">
              More <em>signal.</em>
            </span>
          </div>
          <div className="manifesto-bottom">
            <span className="editorial-index">&#8627;</span>
            <h2>
              A message is just
              <br />
              the beginning.
            </h2>
            <p>
              Somewhere between the new inquiry and the next reply, an
              opportunity takes shape. InboxIQ keeps the thread intact &mdash;
              so you can spend less time finding the context, and more time
              moving the conversation forward.
            </p>
          </div>
        </section>
        <SignalChapter />
        <section className="product-reveal marketing-container" id="product">
          <div className="product-reveal-head">
            <span className="chapter-label">
              03 &mdash; A WORKSPACE WITH INTENT
            </span>
            <h2 className="reveal-line">
              The big picture.
              <br />
              <span>Down to the detail.</span>
            </h2>
            <p>
              All the context. One considered workspace.
              <br />
              Explore a conversation, from first message to next move.
            </p>
          </div>
          <div className="marketing-demo-layout" id="product">
            <div>
              <DemoWorkspace stage={stage} setStage={setStage} />
              <div className="marketing-demo-caption">
                <span>
                  <span className="marketing-small-dot" />
                  Interactive demonstration
                </span>
                <span>Fictional sample data. No emails are sent.</span>
              </div>
            </div>
            <div className="marketing-stage-list">
              <span className="marketing-eyebrow">A CLEARER NEXT STEP</span>
              {steps.map((s, i) => (
                <button
                  key={s.name}
                  className={stage === i ? "active" : ""}
                  onClick={() => setStage(i)}
                  aria-pressed={stage === i}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h2>{s.label}</h2>
                    {stage === i && <p>{s.detail}</p>}
                  </div>
                  <ArrowUpRight size={12} />
                </button>
              ))}
            </div>
          </div>
        </section>
        <section
          className="marketing-container marketing-before-after"
          id="comparison"
        >
          <div className="marketing-section-head">
            <div>
              <span className="marketing-eyebrow">
                CHANGE THE WORKFLOW, NOT YOUR VOICE
              </span>
              <h2 className="reveal-line">
                The same conversation.
                <br />
                <span>A different way forward.</span>
              </h2>
            </div>
            <div
              className="marketing-toggle"
              role="group"
              aria-label="Compare workflows"
            >
              <button onClick={() => setAfter(false)} aria-pressed={!after}>
                Without context
              </button>
              <button onClick={() => setAfter(true)} aria-pressed={after}>
                With InboxIQ
              </button>
            </div>
          </div>
          <div className={`workflow-comparison ${after ? "organized" : ""}`}>
            <div>
              <span className="marketing-eyebrow">
                {after
                  ? "ONE CONNECTED WORKSPACE"
                  : "SCATTERED ACROSS YOUR DAY"}
              </span>
              <h3>
                {after
                  ? "The message. The meaning. The move."
                  : "A message, somewhere in the noise."}
              </h3>
              <p>
                {after
                  ? "Conversation history and lead context stay together. Review a response, decide what happens next, and pick up without starting over."
                  : "Search through your inbox. Rebuild the context. Open another tab. Remember to follow up. Repeat."}
              </p>
            </div>
            <div
              className="workflow-fragments"
              key={after ? "after" : "before"}
            >
              <div className="workflow-fragment">
                <Inbox size={15} />
                <div>
                  <strong>New project inquiry</strong>
                  <small>Maya / Product launch</small>
                </div>
                {after && <Check size={13} />}
              </div>
              <div className="workflow-connector">
                <CornerDownRight size={14} />
                <span>
                  {after
                    ? "Context stays connected"
                    : "Where did the conversation go?"}
                </span>
              </div>
              <div className="workflow-fragment">
                <Users size={15} />
                <div>
                  <strong>
                    {after ? "Qualified lead" : "Another spreadsheet"}
                  </strong>
                  <small>
                    {after
                      ? "Clear intent. Launch next quarter."
                      : "Copy, paste, fill in the blanks."}
                  </small>
                </div>
                {after && <Check size={13} />}
              </div>
              <div className="workflow-connector">
                <CornerDownRight size={14} />
                <span>
                  {after ? "A reviewable next step" : "Remember to come back"}
                </span>
              </div>
              <div className="workflow-fragment">
                <FileText size={15} />
                <div>
                  <strong>
                    {after
                      ? "A reply, ready for your review"
                      : "A follow-up to remember"}
                  </strong>
                  <small>
                    {after
                      ? "Edited by you. Sent only when you decide."
                      : "Somewhere on a to-do list."}
                  </small>
                </div>
                {after && <Check size={13} />}
              </div>
            </div>
          </div>
        </section>
        <section
          className="marketing-container marketing-story"
          id="principles"
        >
          <div className="marketing-story-index">
            <span className="marketing-eyebrow">DESIGNED FOR THE WORK</span>
            <h2>
              Less friction
              <br />
              to think about.
              <br />
              <span>
                More room
                <br />
                to work.
              </span>
            </h2>
            <div>
              {["See the signal", "Keep the context", "Make the next move"].map(
                (t, i) => (
                  <a
                    key={t}
                    href={`#feature-${i}`}
                    className={feature === i ? "active" : ""}
                  >
                    <span>0{i + 1}</span>
                    {t}
                  </a>
                ),
              )}
            </div>
          </div>
          <div className="marketing-story-panels" ref={panels}>
            <article data-feature="0" id="feature-0">
              <div className="story-feature-fragment">
                <div className="fragment-top">
                  <Inbox size={14} />
                  <span>Inbox / Priority</span>
                  <span>Sample view</span>
                </div>
                {[
                  {
                    name: "Maya Patel",
                    subject: "A new product, a bigger launch",
                    tag: "Project inquiry",
                  },
                  {
                    name: "Oliver Chen",
                    subject: "Re: Picking up our conversation",
                    tag: "Follow-up",
                  },
                  {
                    name: "Elena Ruiz",
                    subject: "A few thoughts before our call",
                    tag: "Conversation",
                  },
                ].map((m, i) => (
                  <div className="fragment-message" key={m.name}>
                    <span className="story-avatar">
                      {m.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                    <div>
                      <strong>{m.name}</strong>
                      <p>{m.subject}</p>
                    </div>
                    <span
                      className={i === 0 ? "fragment-tag" : "fragment-muted"}
                    >
                      {m.tag}
                    </span>
                  </div>
                ))}
              </div>
              <span className="marketing-eyebrow">01 / SEE THE SIGNAL</span>
              <h3>An inbox with a point of view.</h3>
              <p>
                Search, filter, and read your conversations with the details
                that matter close at hand. Classification brings project intent
                and follow-up opportunities into focus.
              </p>
            </article>
            <article data-feature="1" id="feature-1">
              <div className="story-feature-fragment lead-fragment">
                <div className="fragment-top">
                  <Users size={14} />
                  <span>Lead / Maya Patel</span>
                  <span>Sample view</span>
                </div>
                <div className="lead-fragment-person">
                  <span className="story-avatar">MP</span>
                  <div>
                    <strong>Maya Patel</strong>
                    <small>Product lead / Northline</small>
                  </div>
                  <span className="fragment-tag">Qualified</span>
                </div>
                <div className="lead-fragment-details">
                  <span>
                    Conversation<strong>New product launch</strong>
                  </span>
                  <span>
                    Next step<strong>Scope discussion</strong>
                  </span>
                  <span>
                    Context<strong>Launch next quarter</strong>
                  </span>
                </div>
              </div>
              <span className="marketing-eyebrow">02 / KEEP THE CONTEXT</span>
              <h3>The relationship behind the row.</h3>
              <p>
                Move between an email and its lead without piecing the story
                together again. Table and pipeline views make your relationships
                easy to scan, sort, and act on.
              </p>
            </article>
            <article data-feature="2" id="feature-2">
              <div className="story-feature-fragment draft-fragment">
                <div className="fragment-top">
                  <FileText size={14} />
                  <span>Draft / Reply to Maya</span>
                  <span>Sample view</span>
                </div>
                <p>Hi Maya,</p>
                <p>
                  The new product launch sounds like a great fit. I'd love to
                  talk through scope and timing.
                </p>
                <p>Would Tuesday at 10 work for a short call?</p>
                <div className="draft-fragment-footer">
                  <span>
                    <Check size={11} />
                    Reviewed by you
                  </span>
                  <span>
                    Ready when you are
                    <ArrowUpRight size={12} />
                  </span>
                </div>
              </div>
              <span className="marketing-eyebrow">03 / MAKE THE NEXT MOVE</span>
              <h3>
                Suggested by software.
                <br />
                Considered by you.
              </h3>
              <p>
                Start with a draft, edit the detail, and make it sound like you.
                Every send is an explicit decision. The conversation stays
                human.
              </p>
              <Link to="/sign-up" className="marketing-text-link">
                Explore your workspace
                <ArrowRight size={13} />
              </Link>
            </article>
          </div>
        </section>
        <section className="marketing-lifecycle">
          <div className="marketing-container">
            <div className="marketing-section-head">
              <div>
                <span className="marketing-eyebrow">ONE CONTINUOUS THREAD</span>
                <h2>
                  From first contact
                  <br />
                  <span>to what comes next.</span>
                </h2>
              </div>
              <p>
                A considered workflow. Your judgment at every step.
                <br />
                Illustrative journey; outcomes are always yours to build.
              </p>
            </div>
            <Lifecycle active={stage} />
            <div className="lifecycle-controls">
              {steps.map((s, i) => (
                <button
                  key={s.name}
                  onClick={() => setStage(i)}
                  aria-label={`Show ${s.name.toLowerCase()} stage`}
                  aria-pressed={stage === i}
                >
                  <s.icon size={13} />
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </section>
        <section className="marketing-container marketing-trust">
          <div>
            <span className="marketing-eyebrow">
              CONFIDENCE, WITHOUT THE CLAIMS
            </span>
            <h2>
              You're in control
              <br />
              <span>of the conversation.</span>
            </h2>
            <p>
              Good software makes its boundaries clear.
              <br />
              Here's what that means in InboxIQ.
            </p>
          </div>
          <div>
            {[
              {
                icon: Lock,
                title: "Protected sign-in sessions",
                text: "Email and password sign-in uses secure, HTTP-only session cookies in production.",
              },
              {
                icon: CheckCheck,
                title: "A review before every send",
                text: "Drafts are editable. Sending a message is an explicit action, with the recipient and content visible.",
              },
              {
                icon: PanelLeft,
                title: "Connections you manage",
                text: "Connect email through the workspace's supported integrations. Review connection status, sync, or disconnect from settings.",
              },
            ].map((item) => (
              <article key={item.title}>
                <item.icon size={16} />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="marketing-final marketing-container">
          <span className="marketing-eyebrow">
            MAKE ROOM FOR THE WORK THAT MATTERS
          </span>
          <div>
            <h2>
              A better inbox.
              <br />
              <span>A clearer next move.</span>
            </h2>
            <div>
              <p>
                Your conversations already hold the opportunity.
                <br />
                Give them a place to move forward.
              </p>
              <Link to="/sign-up" className="marketing-button">
                Make your next move
                <ArrowUpRight size={14} />
              </Link>
              <Link to="/sign-in" className="marketing-text-link">
                Already have a workspace? Log in
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </section>
        <div className="closing-wordmark" aria-hidden="true">
          InboxIQ<span>&#8599;</span>
        </div>
      </main>
      <footer className="marketing-footer marketing-container">
        <Link to="/">
          <Brand />
        </Link>
        <span>The intelligent sales inbox.</span>
        <div>
          <a href="#product">Product</a>
          <a href="#workflow">Workflow</a>
          <Link to="/sign-in">Log in</Link>
          <span>&copy; {new Date().getFullYear()} InboxIQ</span>
        </div>
      </footer>
    </div>
  );
}
