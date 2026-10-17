import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
const Scene = lazy(() => import("./ConversationScene"));
class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function ConversationFallback({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={`conversation-fallback ${className}`}
      viewBox="0 0 900 700"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="orb-body" cx=".36" cy=".23" r=".75">
          <stop stopColor="#8c959e" />
          <stop offset=".2" stopColor="#151b21" />
          <stop offset=".65" stopColor="#030506" />
          <stop offset=".88" stopColor="#11191f" />
          <stop offset="1" stopColor="#a2b1bc" />
        </radialGradient>
        <linearGradient
          id="orb-rim"
          x1="240"
          y1="150"
          x2="650"
          y2="570"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset=".25" stopColor="#8b9ba8" />
          <stop offset=".45" stopColor="#121a20" />
          <stop offset=".8" stopColor="#161e25" />
          <stop offset="1" stopColor="#dce6e9" />
        </linearGradient>
      </defs>
      <path
        d="M452 129C563 107 650 185 674 289C701 393 638 526 533 568C423 613 282 562 236 461C194 367 215 236 304 169C350 134 397 139 452 129Z"
        fill="url(#orb-body)"
        stroke="url(#orb-rim)"
        strokeWidth="3"
      />
      <path
        d="M278 231C353 144 514 135 614 215"
        stroke="#dce5e9"
        strokeOpacity=".65"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M282 451C356 533 508 593 600 520"
        stroke="#7b91a1"
        strokeOpacity=".4"
        strokeWidth="3"
      />
    </svg>
  );
}
export default function ConversationVisual() {
  const root = useRef<HTMLDivElement>(null),
    progress = useRef(0),
    pointer = useRef({ x: 0, y: 0, hover: 0 });
  const [enabled, setEnabled] = useState(false),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [visible, setVisible] = useState(true),
    [pageVisible, setPageVisible] = useState(!document.hidden);
  useEffect(() => {
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setEnabled(
        !media.matches &&
          !(navigator as Navigator & { connection?: { saveData?: boolean } })
            .connection?.saveData,
      );
    const timer = window.setTimeout(update, 500);
    media.addEventListener("change", update);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    if (root.current) observer.observe(root.current);
    const scroll = () => {
      progress.current = Math.min(
        1,
        Math.max(0, window.scrollY / window.innerHeight),
      );
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimeout(timer);
      media.removeEventListener("change", update);
      observer.disconnect();
      window.removeEventListener("scroll", scroll);
    };
  }, []);
  return (
    <div
      ref={root}
      className={`conversation-visual ${ready && !failed && enabled ? "is-rendered" : ""}`}
      role="img"
      aria-label="A reflective liquid-metal orb, continuously flowing and deforming toward your pointer."
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        pointer.current = {
          x: ((e.clientX - r.left) / r.width - 0.5) * 2,
          y: ((e.clientY - r.top) / r.height - 0.5) * 2,
          hover: 1,
        };
      }}
      onPointerLeave={() => {
        pointer.current = { x: 0, y: 0, hover: 0 };
      }}
    >
      <ConversationFallback />
      {enabled && !failed && (
        <SceneBoundary onError={() => setFailed(true)}>
          <Suspense fallback={null}>
            <Scene
              active={visible && pageVisible}
              progress={progress}
              pointer={pointer}
              onReady={() => setReady(true)}
              onUnavailable={() => setFailed(true)}
            />
          </Suspense>
        </SceneBoundary>
      )}
      <span className="sculpture-caption">
        FIG. 01 <span>INTELLIGENCE IN MOTION</span>
      </span>
    </div>
  );
}
