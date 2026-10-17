import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  FileText,
  LockKeyhole,
  Mail,
  Menu,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import VisualBoundary from "@/components/workspace/VisualBoundary";
import SignalDemo from "@/components/marketing/signal/SignalDemo";
import StoryMessage from "@/components/marketing/signal/StoryMessage";
import ClosingSeal from "@/components/marketing/signal/ClosingSeal";
import Reveal from "@/components/marketing/signal/Reveal";
import { useSignalPreferences } from "@/components/marketing/signal/use-signal-preferences";
import { useSignalStory } from "@/components/marketing/signal/use-signal-story";
import envelopePoster from "@/assets/signal-envelope.svg";
import "./landing.css";

const Sculpture = lazy(
  () => import("@/components/marketing/signal/SignalSculpture"),
);
const Atmosphere = lazy(
  () => import("@/components/marketing/signal/SignalAtmosphere"),
);
const Glass = lazy(() => import("@/components/marketing/signal/SignalGlass"));
const Signature = lazy(
  () => import("@/components/marketing/signal/ChromeSignature"),
);
const chapters = [
  {
    label: "The signal",
    title: "You already have\nthe message.",
    text: "Let's see what it could become.",
  },
  {
    label: "Received",
    title: "A conversation\narrives.",
    text: "A familiar name. A new project. A question with possibility.",
  },
  {
    label: "Understood",
    title: "The possibility,\nbrought into focus.",
    text: "Project intent and timing stay connected to the words that matter.",
  },
  {
    label: "Prepared",
    title: "A response.\nStill your voice.",
    text: "Start with a suggestion. Consider the details. Make it your own.",
  },
  {
    label: "Connected",
    title: "The message.\nThe next move.",
    text: "Your conversations, relationships, and next actions in one considered workspace.",
  },
];

export default function Landing() {
  const { data } = useSession();
  const preferences = useSignalPreferences();
  const journey = useRef<HTMLElement>(null),
    progress = useRef(0),
    pointer = useRef({ x: 0, y: 0 });
  const backdrop = useRef<HTMLCanvasElement | null>(null);
  const [step, setStep] = useState(0),
    [menu, setMenu] = useState(false),
    [inView, setInView] = useState(true);
  const { seek, failed } = useSignalStory(
    journey,
    preferences.enhanced,
    progress,
    setStep,
  );
  const enhanced = preferences.enhanced && !failed;
  const active =
    preferences.motion && preferences.desktop && preferences.visible && inView;
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    if (journey.current) observer.observe(journey.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const hero =
      journey.current?.querySelector<HTMLElement>(".signal-hero-copy");
    const frame = journey.current?.querySelector<HTMLElement>(
      ".signal-story-frame",
    );
    if (hero) hero.inert = enhanced && step > 0;
    if (frame) frame.inert = enhanced && step === 0;
  }, [enhanced, step]);
  useEffect(() => {
    if (!menu) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        document
          .querySelector<HTMLButtonElement>(".signal-menu-button")
          ?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menu]);
  if (data?.session) return <Navigate to="/dashboard" replace />;
  const chapter = chapters[step];
  return (
    <div
      className="signal-site"
      data-enhanced={enhanced}
      data-motion={preferences.motion ? "on" : "off"}
    >
      <a className="signal-skip" href="#main">
        Skip to content
      </a>
      <header className="signal-header">
        <div className="signal-header-inner">
          <Link className="signal-brand" to="/" aria-label="InboxIQ home">
            <span className="signal-brand-mark">
              <Mail size={21} strokeWidth={1.35} />
            </span>
            <span>
              Inbox<span>IQ</span>
            </span>
            <small>THE SIGNAL</small>
          </Link>
          <nav className="signal-nav" aria-label="Main navigation">
            {preferences.gpu && preferences.desktop && (
              <VisualBoundary>
                <Suspense fallback={null}>
                  <Glass source={backdrop} active={active} />
                </Suspense>
              </VisualBoundary>
            )}
            <a href="#demo">Product</a>
            <a href="#story">The workflow</a>
            <a href="#approach">Our approach</a>
          </nav>
          <div className="signal-header-actions">
            <Link to="/sign-in">Log in</Link>
            <Link className="signal-button signal-button-small" to="/sign-up">
              Get started <ArrowUpRight size={13} />
            </Link>
            <button
              className="signal-menu-button"
              aria-label={menu ? "Close navigation" : "Open navigation"}
              aria-expanded={menu}
              aria-controls="signal-mobile-nav"
              onClick={() => setMenu((value) => !value)}
            >
              {menu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menu && (
          <nav
            className="signal-mobile-nav"
            id="signal-mobile-nav"
            aria-label="Mobile navigation"
          >
            <a href="#demo" onClick={() => setMenu(false)}>
              Explore the product <ArrowUpRight size={15} />
            </a>
            <a href="#story" onClick={() => setMenu(false)}>
              Follow the workflow <ArrowUpRight size={15} />
            </a>
            <a href="#approach" onClick={() => setMenu(false)}>
              Our approach <ArrowUpRight size={15} />
            </a>
            <Link to="/sign-in">
              Log in <ArrowUpRight size={15} />
            </Link>
          </nav>
        )}
      </header>
      <main id="main">
        <section
          ref={journey}
          className="signal-journey"
          id="story"
          data-step={step}
          aria-label="From email to opportunity"
          onPointerMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            pointer.current.x = (event.clientX / box.width) * 2 - 1;
            pointer.current.y = -((event.clientY / innerHeight) * 2 - 1);
          }}
          onPointerLeave={() => {
            pointer.current.x = 0;
            pointer.current.y = 0;
          }}
        >
          <div className="signal-sticky">
            <div className="signal-rays" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            {active && preferences.gpu && (
              <VisualBoundary>
                <Suspense fallback={null}>
                  <Atmosphere source={backdrop} />
                </Suspense>
              </VisualBoundary>
            )}
            <div className="signal-visuals" aria-hidden="true">
              <img
                src={envelopePoster}
                alt=""
                className="signal-envelope-poster"
                width="1000"
                height="760"
                {...{ fetchpriority: "high" }}
              />
              {active && preferences.gpu && step < 3 && (
                <VisualBoundary>
                  <Suspense fallback={null}>
                    <Sculpture
                      progress={progress}
                      pointer={pointer}
                      active={active}
                    />
                  </Suspense>
                </VisualBoundary>
              )}
              <span className="signal-art-caption">
                FIG. 01 / A CONVERSATION TAKES SHAPE
              </span>
            </div>
            <div
              className="signal-hero-copy"
              aria-hidden={enhanced && step > 0}
            >
              <span className="signal-eyebrow">
                <i /> INTELLIGENCE, IN THE LOOP.
              </span>
              <h1>
                Your next
                <br />
                opportunity
                <br />
                <span>is already in</span>
                <br />
                <em>your inbox.</em>
              </h1>
              <p>
                Find promising conversations, draft thoughtful replies,
                <br className="signal-desktop-break" /> and keep every follow-up
                in sight.
              </p>
              <div className="signal-hero-actions">
                <Link className="signal-button" to="/sign-up">
                  <Mail size={15} /> Connect your Gmail{" "}
                  <ArrowUpRight size={16} />
                </Link>
                <a className="signal-text-link" href="#demo">
                  Explore the demo <ArrowRight size={15} />
                </a>
              </div>
              <span className="signal-hero-note">
                Start with a workspace. Connect Gmail when you're ready.
              </span>
            </div>
            <div className="signal-stage-copy">
              <span className="signal-eyebrow">
                {String(Math.max(step, 1)).padStart(2, "0")} /{" "}
                {chapter.label.toUpperCase()}
              </span>
              <h2>{chapter.title}</h2>
              <p>{chapter.text}</p>
              <a className="signal-text-link" href="#demo">
                Try it for yourself <ArrowUpRight size={14} />
              </a>
            </div>
            <div
              className="signal-story-stops"
              role="group"
              aria-label="Explore the conversation journey"
            >
              {chapters.slice(1).map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => seek(i + 1)}
                  aria-pressed={step === i + 1}
                >
                  <span>0{i + 1}</span>
                  {item.label}
                  <i />
                </button>
              ))}
            </div>
            <StoryMessage step={step} />
            <div className="signal-hero-baseline">
              <span>
                CONVERSATION <ArrowRight size={11} /> CONTEXT{" "}
                <ArrowRight size={11} /> OPPORTUNITY
              </span>
              <button onClick={() => seek(1)}>
                Scroll to unfold <ArrowDown size={13} />
              </button>
            </div>
          </div>
        </section>
        <div className="signal-content-wrap">
          <Reveal enabled={preferences.motion}>
            <SignalDemo />
          </Reveal>
        </div>
        <section
          className="signal-editorial"
          aria-labelledby="signal-editorial-title"
        >
          <div className="signal-content-wrap">
            <Reveal enabled={preferences.motion}>
              <div className="signal-editorial-top">
                <span className="signal-eyebrow">THE INBOX, RECONSIDERED.</span>
                <span>INBOXIQ / 002</span>
              </div>
              <h2 id="signal-editorial-title">
                Less noise.
                <br />
                <span>
                  More <em>possibility.</em>
                </span>
              </h2>
              <div className="signal-editorial-bottom">
                <span className="signal-editorial-arrow">↳</span>
                <h3>
                  The right conversation.
                  <br />A little more clarity.
                </h3>
                <p>
                  A project inquiry. A question before the call. A proposal
                  waiting for a response. InboxIQ brings the context and next
                  step together, so a promising conversation stays a
                  conversation.
                </p>
              </div>
              <div className="signal-editorial-thread">
                <span>
                  <Mail size={15} /> “Could we talk scope and timelines?”
                </span>
                <i />
                <span>
                  <Sparkles size={15} /> Project inquiry
                </span>
                <i />
                <span>
                  <FileText size={15} /> A reply, ready for review
                </span>
              </div>
            </Reveal>
          </div>
        </section>
        <section
          className="signal-followthrough signal-content-wrap"
          aria-labelledby="signal-followthrough-title"
        >
          <Reveal
            enabled={preferences.motion}
            className="signal-followthrough-grid"
          >
            <div>
              <span className="signal-eyebrow">
                A LITTLE LESS TO KEEP IN YOUR HEAD.
              </span>
              <h2 id="signal-followthrough-title">
                Keep the thread.
                <br />
                <em>Find your next move.</em>
              </h2>
              <p>
                The email, the relationship, the reply. Connected, so you can
                pick up where the conversation left off.
              </p>
              <a className="signal-text-link" href="#demo">
                Explore the workflow <ArrowRight size={15} />
              </a>
            </div>
            <div className="signal-next-card">
              <div className="signal-next-card-top">
                <span className="signal-eyebrow">
                  <Clock3 size={13} /> UP NEXT
                </span>
                <span>Sample workspace</span>
              </div>
              <div className="signal-next-identity">
                <span className="signal-avatar">MP</span>
                <div>
                  <h3>Review the reply to Maya</h3>
                  <p>Northline / New product launch</p>
                </div>
                <ArrowUpRight size={18} />
              </div>
              <div className="signal-next-thread">
                <span>
                  <i /> The conversation
                  <small>A design partner. A launch next quarter.</small>
                </span>
                <span>
                  <i /> The context
                  <small>Scope and timing, ready to discuss.</small>
                </span>
                <span>
                  <i /> Your next step
                  <small>Review a response. Choose what happens next.</small>
                </span>
              </div>
              <div className="signal-next-card-footer">
                <span>
                  <Check size={12} /> Suggested by software. Considered by you.
                </span>
                <a href="#demo" aria-label="Review the sample response">
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </Reveal>
        </section>
        <section
          className="signal-approach signal-content-wrap"
          id="approach"
          aria-labelledby="signal-approach-title"
        >
          <Reveal enabled={preferences.motion}>
            <div className="signal-approach-heading">
              <span className="signal-eyebrow">
                GOOD SOFTWARE MAKES ITS BOUNDARIES CLEAR.
              </span>
              <h2 id="signal-approach-title">
                Intelligence helps.
                <br />
                <span>Judgment stays yours.</span>
              </h2>
            </div>
            <div className="signal-principles">
              <article>
                <LockKeyhole size={20} />
                <h3>A connection you choose.</h3>
                <p>
                  Connect Gmail through Google's authorization flow. Manage the
                  connection from your workspace.
                </p>
              </article>
              <article>
                <ShieldCheck size={20} />
                <h3>A reply you approve.</h3>
                <p>
                  Review the recipient, edit the draft, and explicitly confirm
                  when you're ready to send.
                </p>
              </article>
              <article>
                <FileText size={20} />
                <h3>The context stays close.</h3>
                <p>
                  Keep the original conversation beside the suggested response.
                  Decide with the details in view.
                </p>
              </article>
            </div>
          </Reveal>
        </section>
        <section
          className="signal-finale"
          aria-labelledby="signal-finale-title"
        >
          <div className="signal-content-wrap">
            <Reveal enabled={preferences.motion}>
              <ClosingSeal motion={preferences.motion} />
              <span className="signal-eyebrow">
                EVERY GOOD NEXT STEP STARTS SOMEWHERE.
              </span>
              <div className="signal-finale-heading">
                <h2 id="signal-finale-title">
                  One conversation.
                  <br />
                  <em>A clearer next move.</em>
                </h2>
                <div>
                  <Link to="/sign-up" className="signal-button">
                    <Mail size={15} /> Connect your Gmail{" "}
                    <ArrowUpRight size={17} />
                  </Link>
                  <p>Create your workspace. Make the next move yours.</p>
                </div>
              </div>
            </Reveal>
            <VisualBoundary
              fallback={
                <div className="signal-signature-fallback">InboxIQ</div>
              }
            >
              <Suspense
                fallback={
                  <div className="signal-signature-fallback">InboxIQ</div>
                }
              >
                <Signature
                  animate={
                    preferences.motion &&
                    preferences.visible &&
                    preferences.desktop
                  }
                  gpu={preferences.gpu && preferences.desktop}
                />
              </Suspense>
            </VisualBoundary>
          </div>
        </section>
      </main>
      <footer className="signal-footer signal-content-wrap">
        <Link className="signal-brand" to="/" aria-label="InboxIQ home">
          <Mail size={17} />
          <span>InboxIQ</span>
        </Link>
        <span>Intelligence, in the loop.</span>
        <nav aria-label="Footer navigation">
          <a href="#demo">Product</a>
          <a href="#approach">Our approach</a>
          <Link to="/sign-in">
            Log in <ArrowUpRight size={11} />
          </Link>
        </nav>
        <button
          className="signal-motion-toggle"
          onClick={preferences.toggle}
          aria-label={
            preferences.paused
              ? "Resume landing motion"
              : "Pause landing motion"
          }
          aria-pressed={preferences.paused}
        >
          {preferences.paused ? <Play size={12} /> : <Pause size={12} />}
          <span>{preferences.motion ? "Motion on" : "Motion off"}</span>
        </button>
        <span>© {new Date().getFullYear()} InboxIQ</span>
      </footer>
    </div>
  );
}
