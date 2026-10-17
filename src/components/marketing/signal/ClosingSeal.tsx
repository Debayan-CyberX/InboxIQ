import { useEffect, useRef, useState } from "react";

export default function ClosingSeal({ motion }: { motion: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [assembled, setAssembled] = useState(!motion);
  useEffect(() => {
    if (!motion) {
      setAssembled(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAssembled(true);
          observer.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, [motion]);
  return (
    <div
      ref={root}
      className="signal-closing-seal"
      data-assembled={assembled}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 150" fill="none">
        <defs>
          <linearGradient
            id="signal-seal-silver"
            x1="20"
            y1="20"
            x2="180"
            y2="140"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#f3f7ff" />
            <stop offset=".3" stopColor="#526b8c" />
            <stop offset=".55" stopColor="#d3e3f8" />
            <stop offset="1" stopColor="#899fbf" />
          </linearGradient>
        </defs>
        <g className="signal-seal-back">
          <rect
            x="15"
            y="25"
            width="170"
            height="106"
            rx="9"
            fill="url(#signal-seal-silver)"
            stroke="#d6e8ff"
            strokeOpacity=".55"
          />
        </g>
        <path
          className="signal-seal-fold"
          d="m19 125 81-57 81 57"
          fill="url(#signal-seal-silver)"
          stroke="#d8eaff"
          strokeOpacity=".65"
        />
        <path
          className="signal-seal-flap"
          d="M21 28h158L106 91c-4 4-8 4-12 0Z"
          fill="url(#signal-seal-silver)"
          stroke="#edf5ff"
          strokeOpacity=".7"
        />
      </svg>
    </div>
  );
}
