// Adapted from React Bits AnimatedContent, Copyright (c) 2026 David Haz.
// MIT + Commons Clause; full terms are in THIRD_PARTY_NOTICES.md.
import { useEffect, useRef, type ReactNode } from "react";

export default function Reveal({
  children,
  enabled,
  className = "",
}: {
  children: ReactNode;
  enabled: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let revert: (() => void) | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled || !ref.current) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          gsap.fromTo(
            ref.current,
            { y: 28, opacity: 0.3 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: "power3.out",
              clearProps: "transform,opacity",
              scrollTrigger: {
                trigger: ref.current,
                start: "top 94%",
                once: true,
              },
            },
          );
        }, ref);
        revert = () => ctx.revert();
      })
      .catch(() => {
        /* Visible HTML is the default. */
      });
    return () => {
      cancelled = true;
      revert?.();
    };
  }, [enabled]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
