import { useEffect, useState } from "react";

export function useSignalPreferences() {
  const [paused, setPaused] = useState(
    () => localStorage.getItem("inboxiq:landing-motion") === "off",
  );
  const [state, setState] = useState({
    reduced: true,
    desktop: false,
    visible: true,
    gpu: false,
  });
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = matchMedia("(min-width: 901px)");
    let gpu = false;
    try {
      const gl = document.createElement("canvas").getContext("webgl2");
      gpu = !!gl;
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      /* The poster remains available without WebGL. */
    }
    const update = () =>
      setState({
        reduced:
          reduced.matches ||
          document.documentElement.dataset.motion === "reduce",
        desktop: desktop.matches,
        visible: !document.hidden,
        gpu,
      });
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    });
    reduced.addEventListener("change", update);
    desktop.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", update);
      desktop.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const motion = !paused && !state.reduced;
  return {
    ...state,
    paused,
    motion,
    enhanced: motion && state.desktop,
    toggle: () =>
      setPaused((value) => {
        localStorage.setItem("inboxiq:landing-motion", value ? "on" : "off");
        return !value;
      }),
  };
}
