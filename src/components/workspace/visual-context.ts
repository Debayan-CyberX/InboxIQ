import { createContext, useContext, useEffect, useState, type MutableRefObject } from "react";

type VisualState = {
  motion: boolean;
  ambient: boolean;
  gpu: boolean;
  compact: boolean;
  visible: boolean;
  paused: boolean;
  toggleMotion: () => void;
  backdrop: MutableRefObject<HTMLCanvasElement | null>;
};
export const VisualContext = createContext<VisualState | null>(null);

export function useVisualSystem() {
  const value = useContext(VisualContext);
  if (!value) throw new Error("Workspace visuals must be inside VisualSystem");
  return value;
}
export function useElementVisible(ref: MutableRefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "80px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return visible;
}
