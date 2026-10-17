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
        <linearGradient
          id="loop-silver"
          x1="-300"
          y1="-160"
          x2="300"
          y2="160"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#14171a" />
          <stop offset=".18" stopColor="#e2e5e5" />
          <stop offset=".25" stopColor="#737e84" />
          <stop offset=".44" stopColor="#101315" />
          <stop offset=".7" stopColor="#bec7c9" />
          <stop offset=".76" stopColor="#edf0ed" />
          <stop offset="1" stopColor="#202729" />
        </linearGradient>
        <linearGradient id="loop-edge">
          <stop stopColor="#687877" />
          <stop offset=".5" stopColor="#e8eeee" />
          <stop offset="1" stopColor="#242c2f" />
        </linearGradient>
      </defs>
      <g transform="translate(450 355) rotate(-25)">
        <ellipse
          rx="296"
          ry="158"
          stroke="url(#loop-silver)"
          strokeWidth="45"
        />
        <ellipse rx="298" ry="158" stroke="url(#loop-edge)" strokeWidth="1" />
        <g transform="rotate(65)">
          <ellipse
            rx="232"
            ry="120"
            stroke="url(#loop-silver)"
            strokeWidth="36"
          />
          <ellipse
            rx="233"
            ry="119"
            stroke="#c8d2d0"
            strokeOpacity=".4"
            strokeWidth="1"
          />
        </g>
        <g transform="rotate(-55)">
          <ellipse
            rx="158"
            ry="86"
            stroke="url(#loop-silver)"
            strokeWidth="26"
          />
          <ellipse rx="157" ry="86" stroke="#b6d0c4" strokeOpacity=".5" />
        </g>
      </g>
    </svg>
  );
}
export default function ConversationVisual() {
  const root = useRef<HTMLDivElement>(null),
    progress = useRef(0),
    pointer = useRef({ x: 0, y: 0 });
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
      aria-label="Three interlocking metallic pathways: a message, its context, and its next opportunity."
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        pointer.current = {
          x: ((e.clientX - r.left) / r.width - 0.5) * 2,
          y: ((e.clientY - r.top) / r.height - 0.5) * 2,
        };
      }}
      onPointerLeave={() => {
        pointer.current = { x: 0, y: 0 };
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
        FIG. 01 <span>THE CONVERSATION LOOP</span>
      </span>
    </div>
  );
}
