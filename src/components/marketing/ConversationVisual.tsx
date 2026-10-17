import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
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
          <stop offset=".2" stopColor="#8c9aa8" />
          <stop offset=".65" stopColor="#4d5b6a" />
          <stop offset=".88" stopColor="#8494a5" />
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
          <stop offset=".16" stopColor="#00ecff" />
          <stop offset=".22" stopColor="#4300ff" />
          <stop offset=".3" stopColor="#8b9ba8" />
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
    video = useRef<HTMLVideoElement>(null);
  const [enabled, setEnabled] = useState(false),
    [visible, setVisible] = useState(true),
    [pageVisible, setPageVisible] = useState(!document.hidden),
    [ready, setReady] = useState(false),
    [paused, setPaused] = useState(false),
    [blocked, setBlocked] = useState(false),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setEnabled(
        !media.matches &&
          !(navigator as Navigator & { connection?: { saveData?: boolean } })
            .connection?.saveData,
      );
    const timer = setTimeout(update, 300);
    media.addEventListener("change", update);
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    if (root.current) observer.observe(root.current);
    return () => {
      clearTimeout(timer);
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (enabled && visible && pageVisible && !paused && !failed) {
      element
        .play()
        .then(() => setBlocked(false))
        .catch(() => setBlocked(true));
    } else element.pause();
  }, [enabled, visible, pageVisible, paused, failed]);
  function toggle() {
    if (!enabled || blocked) {
      setEnabled(true);
      setPaused(false);
      video.current
        ?.play()
        .then(() => setBlocked(false))
        .catch(() => setBlocked(true));
    } else setPaused((v) => !v);
  }
  return (
    <div
      ref={root}
      className={`conversation-visual reference-orb ${ready && !failed ? "is-rendered" : ""}`}
      role="group"
      aria-label="Flowing reflective orb animation"
      onPointerMove={(e) => {
        if (!enabled) return;
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty(
          "--orb-x",
          `${((e.clientX - r.left) / r.width - 0.5) * 8}px`,
        );
        e.currentTarget.style.setProperty(
          "--orb-y",
          `${((e.clientY - r.top) / r.height - 0.5) * 8}px`,
        );
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty("--orb-x", "0px");
        e.currentTarget.style.setProperty("--orb-y", "0px");
      }}
    >
      <img
        className="reference-orb-poster"
        src="/media/liquid-orb-poster.webp"
        alt=""
        width="1200"
        height="674"
        fetchPriority="high"
      />
      <video
        ref={video}
        className="reference-orb-video"
        src={enabled && !failed ? "/media/liquid-orb.mp4" : undefined}
        poster="/media/liquid-orb-poster.webp"
        muted
        loop
        playsInline
        preload={enabled ? "auto" : "none"}
        onLoadedData={() => setReady(true)}
        onError={() => setFailed(true)}
        aria-hidden="true"
      />
      <span className="sculpture-caption">
        <span>FIG. 01 / LIQUID INTELLIGENCE</span>
        {!failed && (
          <button
            type="button"
            onClick={toggle}
            aria-label={
              paused || !enabled || blocked
                ? "Play orb animation"
                : "Pause orb animation"
            }
          >
            {paused || !enabled || blocked ? (
              <Play size={10} />
            ) : (
              <Pause size={10} />
            )}
            <span>{paused || !enabled || blocked ? "Play" : "Pause"}</span>
          </button>
        )}
      </span>
    </div>
  );
}
