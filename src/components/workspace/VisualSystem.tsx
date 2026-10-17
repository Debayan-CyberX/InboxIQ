import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { VisualContext } from "./visual-context";
import { useLocation } from "react-router-dom";

let supported: boolean | undefined;
function canRenderWebGL() {
  if (supported !== undefined) return supported;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    supported = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    supported = false;
  }
  return supported;
}
export function VisualSystem({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const backdrop = useRef<HTMLCanvasElement | null>(null);
  const [paused, setPaused] = useState(
    () => localStorage.getItem("inboxiq:visual-motion") === "off",
  );
  const [preferences, setPreferences] = useState({
    reduced: true,
    compact: true,
    visible: true,
    gpu: false,
    dialog: false,
    reading: false,
  });
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const compact = matchMedia("(max-width: 767px)");
    const refresh = () => {
      const next = {
        reduced:
          reduced.matches ||
          document.documentElement.dataset.motion === "reduce",
        compact: compact.matches,
        visible: !document.hidden,
        gpu: canRenderWebGL(),
        reading: !!document.querySelector('[data-workspace-focus="reading"]'),
        dialog: !!document.querySelector(
          '[role="dialog"][data-state="open"],dialog[open]',
        ),
      };
      setPreferences((previous) =>
        Object.keys(next).every((key) => next[key] === previous[key])
          ? previous
          : next,
      );
    };
    const root = new MutationObserver(refresh);
    root.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    });
    const dialogs = new MutationObserver(refresh);
    dialogs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-workspace-focus"] });
    reduced.addEventListener("change", refresh);
    compact.addEventListener("change", refresh);
    document.addEventListener("visibilitychange", refresh);
    refresh();
    return () => {
      root.disconnect();
      dialogs.disconnect();
      reduced.removeEventListener("change", refresh);
      compact.removeEventListener("change", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  const value = useMemo(() => {
    const motion = !paused && !preferences.reduced && preferences.visible;
    return {
      motion,
      ambient:
        motion &&
        !preferences.compact &&
        !preferences.dialog &&
        !preferences.reading &&
        !["/inbox", "/drafts"].includes(pathname),
      gpu: preferences.gpu,
      compact: preferences.compact,
      visible: preferences.visible,
      paused,
      toggleMotion: () =>
        setPaused((previous) => {
          localStorage.setItem(
            "inboxiq:visual-motion",
            previous ? "on" : "off",
          );
          return !previous;
        }),
      backdrop,
    };
  }, [paused, preferences, pathname]);
  return (
    <VisualContext.Provider value={value}>{children}</VisualContext.Provider>
  );
}
