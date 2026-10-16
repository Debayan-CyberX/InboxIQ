import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Inbox,
  LayoutDashboard,
  Users,
  Send,
  BarChart3,
  Search,
  Sparkles,
  Plus,
  Circle,
  Menu,
  X,
  ShieldCheck,
  Workflow,
  WandSparkles,
  Command,
} from "lucide-react";
import Brand from "@/components/Brand";
import { useSession } from "@/lib/auth-client";
import "./landing.css";
const examples = [
  {
    initials: "AM",
    name: "Alex Morgan",
    company: "Forma Studio",
    subject: "Re: A new chapter for Forma",
    preview:
      "This looks great. Could we find a time to talk through the details?",
    tag: "High intent",
    time: "12m",
    color: "peach",
  },
  {
    initials: "JL",
    name: "Jamie Lee",
    company: "Northstar",
    subject: "A quick follow-up on our conversation",
    preview: "Thanks for sending this over. Let me share it with the team.",
    tag: "Follow up",
    time: "48m",
    color: "purple",
  },
  {
    initials: "SC",
    name: "Sam Chen",
    company: "Layers",
    subject: "Partnership possibilities",
    preview: "I think there could be a really interesting opportunity here.",
    tag: "Opportunity",
    time: "2h",
    color: "green",
  },
];
function ProductPreview() {
  const [view, setView] = useState("Overview");
  return (
    <div className="lp-product" id="product-preview">
      <div className="lp-product-bar">
        <span className="flex gap-1.5">
          <i />
          <i />
          <i />
        </span>
        <span>InboxIQ / Your workspace</span>
        <span className="lp-demo-badge">Interactive product preview</span>
      </div>
      <div className="lp-product-body">
        <aside className="lp-demo-sidebar">
          <Brand />
          <div className="lp-demo-workspace">
            <span className="iq-workspace-icon">S</span>
            <span>
              Studio workspace<small>Personal workspace</small>
            </span>
          </div>
          <div className="iq-nav-label">Workspace</div>
          {[
            { name: "Overview", icon: LayoutDashboard },
            { name: "Inbox", icon: Inbox },
            { name: "Pipeline", icon: Users },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setView(item.name)}
              className={`lp-demo-nav ${view === item.name ? "active" : ""}`}
            >
              <item.icon size={14} />
              {item.name}
            </button>
          ))}
          <div className="lp-demo-nav muted">
            <Send size={14} />
            Drafts
          </div>
          <div className="lp-demo-nav muted">
            <BarChart3 size={14} />
            Analytics
          </div>
          <div className="lp-demo-assistant">
            <Sparkles size={16} />
            <p>
              Good relationships.
              <br />
              Great possibilities.
            </p>
          </div>
        </aside>
        <div className="lp-demo-main">
          <div className="lp-demo-top">
            <span className="flex gap-2 items-center">
              <Search size={12} />
              Search your workspace
            </span>
            <span className="lp-demo-avatar">S</span>
          </div>
          <div className="lp-demo-content">
            <div className="lp-demo-title">
              <div>
                <span className="iq-eyebrow">YOUR WORKSPACE, IN FOCUS</span>
                <h3>
                  {view === "Overview"
                    ? "A little clarity. A lot of possibility."
                    : view === "Inbox"
                      ? "Conversations worth your attention."
                      : "Your next opportunity starts here."}
                </h3>
                <p>
                  {view === "Overview"
                    ? "Here's where your relationships stand today."
                    : view === "Inbox"
                      ? "The right conversations, brought to the surface."
                      : "Every relationship. A clear next step."}
                </p>
              </div>
              <span className="lp-demo-live">
                <span className="iq-dot" />
                Demo data
              </span>
            </div>
            {view === "Overview" && (
              <>
                <div className="lp-demo-stats">
                  {[
                    {
                      label: "Active conversations",
                      value: "24",
                      foot: "Across your workspace",
                    },
                    {
                      label: "Ready for a follow-up",
                      value: "08",
                      foot: "A good time to reconnect",
                    },
                    {
                      label: "Drafts to review",
                      value: "03",
                      foot: "Your voice. A head start.",
                    },
                  ].map((s, i) => (
                    <div key={s.label}>
                      <span>{s.label}</span>
                      <strong>
                        {s.value}
                        <span className={`lp-mini-chart c${i}`}>
                          <i />
                          <i />
                          <i />
                          <i />
                          <i />
                          <i />
                          <i />
                        </span>
                      </strong>
                      <small>{s.foot}</small>
                    </div>
                  ))}
                </div>
                <div className="lp-demo-insight">
                  <Sparkles size={17} />
                  <div>
                    <span>A little context goes a long way</span>
                    <p>
                      Alex is ready to talk details. Your next big opportunity
                      might be one reply away.
                    </p>
                  </div>
                  <ArrowUpRight size={16} />
                </div>
              </>
            )}
            {view === "Pipeline" ? (
              <div className="lp-demo-kanban">
                {["New connections", "In conversation", "Ready to move"].map(
                  (stage, i) => (
                    <div key={stage}>
                      <span className="lp-stage">
                        {stage}
                        <Circle size={7} />
                      </span>
                      <div className="lp-kanban-card">
                        <span className={`lp-person ${examples[i].color}`}>
                          {examples[i].initials}
                        </span>
                        <h4>{examples[i].company}</h4>
                        <p>{examples[i].name}</p>
                        <span className="lp-email-tag">{examples[i].tag}</span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="lp-demo-conversations">
                <div className="lp-table-heading">
                  <span>Priority conversations</span>
                  <span>
                    Latest activity <ChevronDown size={10} />
                  </span>
                </div>
                {examples.map((item) => (
                  <div className="lp-email-row" key={item.name}>
                    <span className={`lp-person ${item.color}`}>
                      {item.initials}
                    </span>
                    <div className="lp-email-name">
                      {item.name}
                      <small>{item.company}</small>
                    </div>
                    <div className="lp-email-message">
                      <span>{item.subject}</span>
                      <small>{item.preview}</small>
                    </div>
                    <span className={`lp-email-tag ${item.color}`}>
                      {item.tag}
                    </span>
                    <time>{item.time}</time>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
const faqs = [
  {
    q: "What is InboxIQ?",
    a: "InboxIQ brings your email conversations, lead pipeline, drafts, and relationship activity into a single workspace, so you can decide what deserves your attention next.",
  },
  {
    q: "Does InboxIQ send emails automatically?",
    a: "You stay in control. Review and edit your drafts before sending them, and choose which relationships to follow up on.",
  },
  {
    q: "Can I connect my existing email?",
    a: "Your workspace includes email connection settings for supported providers. Provider availability depends on the integrations configured for your workspace.",
  },
  {
    q: "What can I explore when I sign up?",
    a: "Create your workspace, explore your dashboard and lead pipeline, and configure your preferences. Email and AI features become available when the corresponding integrations are configured.",
  },
];
export default function Landing() {
  const { data } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  if (data?.session) return <Navigate to="/dashboard" replace />;
  return (
    <div className="lp-site">
      <a href="#main" className="lp-skip">
        Skip to content
      </a>
      <header className="lp-header">
        <Link to="/" aria-label="InboxIQ home">
          <Brand />
        </Link>
        <nav
          className={menuOpen ? "lp-nav open" : "lp-nav"}
          aria-label="Main navigation"
        >
          <a href="#product" onClick={() => setMenuOpen(false)}>
            Product
          </a>
          <a href="#workflow" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="#why-inboxiq" onClick={() => setMenuOpen(false)}>
            Why InboxIQ
          </a>
          <a href="#questions" onClick={() => setMenuOpen(false)}>
            FAQs
          </a>
        </nav>
        <div className="lp-header-actions">
          <Link to="/sign-in" className="lp-sign-in">
            Log in <ArrowUpRight size={13} />
          </Link>
          <Link to="/sign-up" className="iq-button">
            Get started <ArrowRight size={14} />
          </Link>
          <button
            className="lp-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      <main id="main">
        <section className="lp-hero">
          <div className="lp-hero-glow" aria-hidden="true" />
          <div className="lp-announcement">
            <span className="iq-dot" />A more intentional way to work
            <ArrowUpRight size={12} />
          </div>
          <h1>
            Your inbox is full.
            <br />
            Your next move should
            <br />
            be <span>clear.</span>
          </h1>
          <p className="lp-hero-description">
            Turn everyday conversations into meaningful opportunities.
            <br className="hidden sm:block" /> One calm workspace for your
            inbox, relationships, and next steps.
          </p>
          <div className="lp-hero-actions">
            <Link to="/sign-up" className="iq-button">
              Find your focus <ArrowRight size={15} />
            </Link>
            <a href="#product-preview" className="iq-button secondary">
              <LayoutDashboard size={14} />
              Explore the workspace
            </a>
          </div>
          <div className="lp-hero-note">
            <span>
              <Check size={12} />
              Your voice, always
            </span>
            <span>
              <Check size={12} />
              You decide what gets sent
            </span>
          </div>
          <ProductPreview />
        </section>
        <section className="lp-principles">
          <span>
            A little less busywork.
            <br />
            <strong>A lot more momentum.</strong>
          </span>
          <div>
            <Inbox size={18} />
            <p>A focused inbox</p>
          </div>
          <div>
            <Users size={18} />
            <p>Stronger relationships</p>
          </div>
          <div>
            <Sparkles size={18} />
            <p>Thoughtful next steps</p>
          </div>
        </section>
        <section className="lp-section" id="product">
          <div className="lp-section-intro">
            <div>
              <span className="iq-eyebrow">
                <span className="iq-dot" />
                LESS NOISE. MORE SIGNAL.
              </span>
              <h2>
                Everything you need.
                <br />
                <span>Room to think.</span>
              </h2>
            </div>
            <p>
              Important conversations shouldn't get lost between tabs. Bring the
              context and the next step together.
            </p>
          </div>
          <div className="lp-features">
            <article className="lp-feature lp-feature-wide">
              <div className="lp-feature-copy">
                <span className="lp-feature-icon">
                  <Inbox size={20} />
                </span>
                <h3>An inbox with perspective.</h3>
                <p>
                  See your conversations in context. Find the messages that need
                  attention, and pick up right where you left off.
                </p>
                <Link to="/sign-up">
                  Get a clearer picture <ArrowUpRight size={14} />
                </Link>
              </div>
              <div className="lp-focus-visual">
                <div className="lp-focus-label">
                  <span className="iq-dot" />
                  PRIORITY VIEW<span>Illustrative example</span>
                </div>
                {examples.slice(0, 2).map((e, i) => (
                  <div key={e.name} className="lp-focus-message">
                    <span className={`lp-person ${e.color}`}>{e.initials}</span>
                    <div>
                      <strong>{e.name}</strong>
                      <small>{e.subject}</small>
                    </div>
                    <span className="lp-focus-status">
                      {i === 0 ? "Ready to reply" : "Follow up"}
                    </span>
                  </div>
                ))}
                <div className="lp-focus-context">
                  <Sparkles size={14} />
                  <span>The context you need. Without the digging.</span>
                </div>
              </div>
            </article>
            <article className="lp-feature">
              <span className="lp-feature-icon">
                <Workflow size={20} />
              </span>
              <h3>Relationships, not rows.</h3>
              <p>
                Keep every lead, conversation, and follow-up connected. A
                pipeline that makes your next step easy to see.
              </p>
              <div className="lp-pipeline-visual">
                {["Connect", "Nurture", "Move forward"].map((t, i) => (
                  <div key={t}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <i />
                    <small>{t}</small>
                  </div>
                ))}
              </div>
            </article>
            <article className="lp-feature">
              <span className="lp-feature-icon">
                <WandSparkles size={20} />
              </span>
              <h3>A head start. In your voice.</h3>
              <p>
                Build on AI-assisted drafts, bring your own perspective, and
                review every word before it goes out.
              </p>
              <div className="lp-draft-visual">
                <div>
                  <Sparkles size={12} />
                  DRAFT WORKSPACE
                </div>
                <p>Hi Alex,</p>
                <p>
                  Really enjoyed our conversation. I'd love to explore what we
                  could build together
                  <span className="lp-caret" />.
                </p>
                <span>
                  <Check size={11} />
                  Reviewed by you
                </span>
              </div>
            </article>
          </div>
        </section>
        <section className="lp-section lp-workflow" id="workflow">
          <div>
            <span className="iq-eyebrow">
              <span className="iq-dot" />A BETTER DAILY RHYTHM
            </span>
            <h2>
              From catching up
              <br />
              to <span>moving forward.</span>
            </h2>
            <p>
              Less time deciding where to start.
              <br />
              More time doing the work that matters.
            </p>
            <Link to="/sign-up" className="iq-button secondary">
              Make room for better work <ArrowRight size={14} />
            </Link>
          </div>
          <div className="lp-steps">
            {[
              {
                title: "Bring your conversations together",
                text: "Connect your email and give your relationships a home in one focused workspace.",
              },
              {
                title: "See what deserves your attention",
                text: "Explore your pipeline, review activity, and find the follow-ups that matter.",
              },
              {
                title: "Make your next move",
                text: "Review a draft, reconnect with a lead, and keep the conversation moving.",
              },
            ].map((step, i) => (
              <article key={step.title}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="lp-manifesto" id="why-inboxiq">
          <span className="iq-eyebrow">
            <span className="iq-dot" />
            BUILT FOR THE HUMAN SIDE OF WORK
          </span>
          <h2>
            Behind every email,
            <br />
            there's <span>a possibility.</span>
          </h2>
          <p>
            A new client. A meaningful partnership. A conversation worth
            continuing.
            <br />
            InboxIQ gives those possibilities the attention they deserve.
          </p>
          <div>
            <span>
              <ShieldCheck size={16} />
              You stay in control
            </span>
            <span>
              <Command size={16} />
              One connected workspace
            </span>
            <span>
              <Sparkles size={16} />
              Space for your best work
            </span>
          </div>
        </section>
        <section className="lp-section lp-faq" id="questions">
          <div>
            <span className="iq-eyebrow">
              <span className="iq-dot" />A FEW THINGS TO KNOW
            </span>
            <h2>Clarity starts here.</h2>
            <p>A closer look at your next workspace.</p>
          </div>
          <div>
            {faqs.map((faq) => (
              <details key={faq.q}>
                <summary>
                  {faq.q}
                  <Plus size={16} />
                </summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="lp-final-cta">
          <span className="iq-eyebrow">
            YOUR NEXT CHAPTER STARTS WITH A CONVERSATION
          </span>
          <h2>
            Less catching up.
            <br />
            <span>More possibility.</span>
          </h2>
          <Link to="/sign-up" className="iq-button">
            Step into your workspace <ArrowRight size={15} />
          </Link>
          <p>Your relationships deserve a little more room.</p>
        </section>
      </main>
      <footer className="lp-footer">
        <Link to="/">
          <Brand />
        </Link>
        <span>Make every conversation count.</span>
        <div>
          <a href="#product">Product</a>
          <Link to="/sign-in">Log in</Link>
          <span>? {new Date().getFullYear()} InboxIQ</span>
        </div>
      </footer>
    </div>
  );
}
