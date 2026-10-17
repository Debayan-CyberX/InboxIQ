import { useEffect, type RefObject } from "react";
export function useLandingMotion(root: RefObject<HTMLElement>) {
  useEffect(() => {
    let dispose: (() => void) | undefined,
      cancelled = false;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const timer = setTimeout(async () => {
      const modules: [typeof import("gsap"), typeof import("gsap/ScrollTrigger")] | null = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]).catch(() => null);
      if (!modules || media.matches) return;
      const [{ gsap }, { ScrollTrigger }] = modules;
      if (cancelled || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>(".reveal-line").forEach((el) =>
          gsap.fromTo(
            el,
            { y: 40, opacity: 0.25 },
            {
              y: 0,
              opacity: 1,
              duration: 0.95,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 92%",
                toggleActions: "play none none reverse",
              },
            },
          ),
        );
        gsap.fromTo(
          ".product-reveal .signal-demo-window",
          {
            y: 70,
            rotateX: 5,
            scale: 0.96,
            clipPath: "inset(8% 0 0 0 round 12px)",
          },
          {
            y: 0,
            rotateX: 0,
            scale: 1,
            clipPath: "inset(0% 0 0 0 round 12px)",
            ease: "none",
            scrollTrigger: {
              trigger: ".product-reveal",
              start: "top 85%",
              end: "top 18%",
              scrub: 0.8,
            },
          },
        );
        gsap.fromTo(
          ".signal-map svg",
          { x: -35, opacity: 0.35 },
          {
            x: 0,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".signal-chapter",
              start: "top 85%",
              end: "top 10%",
              scrub: 1,
            },
          },
        );
        gsap.utils
          .toArray<HTMLElement>(".marketing-story-panels article")
          .forEach((el) =>
            gsap.fromTo(
              el,
              { y: 35 },
              {
                y: -15,
                ease: "none",
                scrollTrigger: {
                  trigger: el,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 1,
                },
              },
            ),
          );
      }, root);
      dispose = () => ctx.revert();
    }, 650);
    const onPreference = () => {
      if (media.matches) dispose?.();
    };
    media.addEventListener("change", onPreference);
    return () => {
      media.removeEventListener("change", onPreference);
      cancelled = true;
      clearTimeout(timer);
      dispose?.();
    };
  }, [root]);
}
