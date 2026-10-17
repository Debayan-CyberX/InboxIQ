import { useState, useEffect, useRef } from "react";
import { ArrowUpRight, Check, CornerDownRight, Mail } from "lucide-react";
const moments = [
  {
    label: "The message",
    headline: "A thousand messages.\nOne worth a closer look.",
    body: "A new project. A familiar name. A question with possibility. The next opportunity begins as a conversation.",
  },
  {
    label: "The context",
    headline: "Read between\nthe subject lines.",
    body: "Bring project intent, relationship history and the next action together. The message becomes part of a bigger picture.",
  },
  {
    label: "The next move",
    headline: "Opportunity,\nwith a way forward.",
    body: "Review the lead. Consider the response. Make the next move yourself. Intelligence keeps you informed; judgment stays yours.",
  },
];
export default function SignalChapter() {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    let frame = 0;
    const scroll = () => {
      if (frame || media.matches) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = root.current?.getBoundingClientRect();
        if (
          !rect ||
          rect.top > innerHeight * 0.75 ||
          rect.bottom < innerHeight * 0.25
        )
          return;
        const position = (innerHeight * 0.75 - rect.top) / (rect.height * 0.75);
        setActive(Math.max(0, Math.min(2, Math.floor(position * 3))));
      });
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", scroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <section
      ref={root}
      className="signal-chapter marketing-container"
      id="signal"
      data-signal-stage={active}
    >
      <div className="signal-intro">
        <span className="chapter-label">02 — FROM MESSAGE TO MEANING</span>
        <h2 className="reveal-line">
          Don't lose
          <br />
          <em>the thread.</em>
        </h2>
        <p>
          Follow one conversation.
          <br />
          Discover what it could become.
        </p>
        <div
          className="signal-tabs"
          role="tablist"
          aria-label="Conversation transformation"
        >
          {moments.map((m, i) => (
            <button
              key={m.label}
              id={`signal-tab-${i}`}
              role="tab"
              aria-selected={active === i}
              aria-controls="signal-panel"
              tabIndex={active === i ? 0 : -1}
              onKeyDown={(e) => {
                const next =
                  e.key === "ArrowRight"
                    ? (i + 1) % 3
                    : e.key === "ArrowLeft"
                      ? (i + 2) % 3
                      : e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? 2
                          : null;
                if (next !== null) {
                  e.preventDefault();
                  setActive(next);
                  document.getElementById(`signal-tab-${next}`)?.focus();
                }
              }}
              onClick={() => setActive(i)}
            >
              <span>0{i + 1}</span>
              {m.label}
              <ArrowUpRight size={13} />
            </button>
          ))}
        </div>
      </div>
      <div
        className="signal-stage"
        id="signal-panel"
        role="tabpanel"
        aria-labelledby={`signal-tab-${active}`}
      >
        <div className="signal-map" aria-hidden="true">
          <span>CONTEXT ENGINE / I.Q.</span>
          <svg viewBox="0 0 600 410">
            <defs>
              <linearGradient id="signal-path">
                <stop stopColor="#343d40" />
                <stop offset=".7" stopColor="#d8e1de" />
                <stop offset="1" stopColor="#a4bdb0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3, 4].map((n) => (
              <path
                key={n}
                d={`M0 ${45 + n * 80} C220 ${45 + n * 80}, 200 205, 360 205 S520 205,600 205`}
                stroke="url(#signal-path)"
                fill="none"
                strokeWidth={n === 2 ? 1.5 : 0.65}
                opacity={n === 2 ? 1 : 0.3}
              />
            ))}
            <circle
              cx="360"
              cy="205"
              r="50"
              fill="#111516"
              stroke="#71817b"
              strokeWidth=".7"
            />
            <rect
              x="348"
              y="197"
              width="24"
              height="16"
              rx="2"
              stroke="#dde3df"
              fill="none"
            />
            <path d="m348 198 12 9 12-9" stroke="#dde3df" />
          </svg>
          <span className="map-end">ONE CONNECTED OPPORTUNITY ↗</span>
        </div>
        <div className={`signal-letter stage-${active}`}>
          <div className="signal-letter-top">
            <span className="signal-monogram">MP</span>
            <div>
              <strong>Maya Patel</strong>
              <span>Product lead · Northline</span>
            </div>
            <Mail size={15} />
          </div>
          <div className="signal-letter-body">
            <small>A NEW PRODUCT, A BIGGER LAUNCH</small>
            <p>
              We're looking for a partner to bring
              <br />
              our next chapter to life.
            </p>
            <span>Could we talk about scope and timing?</span>
          </div>
          <div className="signal-qualification">
            <span>
              <Check size={12} />
              Project inquiry
            </span>
            <span>
              Context connected
              <CornerDownRight size={12} />
            </span>
          </div>
          <div className="signal-next">
            <div>
              <small>NEXT MOVE</small>
              <strong>Review a suggested response</strong>
            </div>
            <ArrowUpRight size={18} />
          </div>
        </div>
        <div className="signal-copy" key={active}>
          <span>0{active + 1} / 03</span>
          <h3>{moments[active].headline}</h3>
          <p>{moments[active].body}</p>
        </div>
        <small className="signal-disclaimer">
          Illustrative conversation. No customer data or email sends.
        </small>
      </div>
    </section>
  );
}
