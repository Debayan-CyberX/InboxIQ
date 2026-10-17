import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
  type MutableRefObject,
} from "react";
import type Lenis from "lenis";

export const storyStops = [0, 0.32, 0.51, 0.72, 0.94];
export function useSignalStory(
  root: RefObject<HTMLElement>,
  enabled: boolean,
  progress: MutableRefObject<number>,
  setStep: (step: number) => void,
) {
  const [failed, setFailed] = useState(false);
  const scroller = useRef<Lenis | null>(null);
  useEffect(() => {
    setFailed(false);
    if (!enabled) {
      progress.current = 0;
      setStep(4);
      return;
    }
    setStep(0);
    const element = root.current;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    void Promise.all([
      import("lenis"),
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ])
      .then(([{ default: Lenis }, { gsap }, { ScrollTrigger }]) => {
        if (cancelled || !root.current) return;
        gsap.registerPlugin(ScrollTrigger);
        const lenis = new Lenis({
          lerp: 0.085,
          smoothWheel: true,
          syncTouch: false,
          anchors: { offset: -100 },
          prevent: (node) => !!node.closest("[data-lenis-prevent]"),
        });
        scroller.current = lenis;
        const tick = (time: number) => lenis.raf(time * 1000);
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.lagSmoothing(0);
        gsap.ticker.add(tick);
        let previous = -1;
        const ctx = gsap.context(() => {
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.55,
              onUpdate: (self) => {
                progress.current = self.progress;
                const step =
                  self.progress < 0.22
                    ? 0
                    : self.progress < 0.42
                      ? 1
                      : self.progress < 0.62
                        ? 2
                        : self.progress < 0.84
                          ? 3
                          : 4;
                if (step !== previous) {
                  setStep(step);
                  previous = step;
                }
              },
            },
          });
          timeline
            .to(
              ".signal-hero-copy",
              { opacity: 0, y: -55, duration: 0.17 },
              0.04,
            )
            .fromTo(
              ".signal-stage-copy",
              { opacity: 0, y: 24 },
              { opacity: 1, y: 0, duration: 0.1 },
              0.24,
            )
            .fromTo(
              ".signal-story-frame",
              { opacity: 0, y: 70, scale: 0.72, rotationY: -8 },
              { opacity: 1, y: 0, scale: 1, rotationY: 0, duration: 0.2 },
              0.23,
            )
            .fromTo(
              ".signal-story-frame",
              { "--signal-frame-glow": 0 },
              { "--signal-frame-glow": 1, duration: 0.16 },
              0.44,
            )
            .to({}, { duration: 0.15 }, 0.85);
        }, root);
        ScrollTrigger.refresh();
        dispose = () => {
          ctx.revert();
          gsap.ticker.remove(tick);
          gsap.ticker.lagSmoothing(500, 33);
          lenis.destroy();
          scroller.current = null;
        };
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setStep(4);
        root.current?.setAttribute("data-story-fallback", "true");
      });
    return () => {
      cancelled = true;
      dispose?.();
      element?.removeAttribute("data-story-fallback");
    };
  }, [enabled, progress, root, setStep]);
  const seek = useCallback(
    (step: number) => {
      if (!enabled || failed || !root.current) {
        setStep(step || 1);
        return;
      }
      const top = root.current.getBoundingClientRect().top + window.scrollY;
      const target =
        top + (root.current.offsetHeight - innerHeight) * storyStops[step];
      if (scroller.current)
        scroller.current.scrollTo(target, { duration: 1.1 });
      else window.scrollTo({ top: target, behavior: "smooth" });
    },
    [enabled, failed, root, setStep],
  );
  return { seek, failed };
}
