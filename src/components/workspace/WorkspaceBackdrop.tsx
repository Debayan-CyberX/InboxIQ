import { lazy, Suspense } from "react";
import VisualBoundary from "./VisualBoundary";
import { useVisualSystem } from "./visual-context";

const MovingSilver = lazy(() => import("./MovingSilver"));
export default function WorkspaceBackdrop() {
  const { ambient, gpu } = useVisualSystem();
  return (
    <div
      className="silver-atmosphere"
      aria-hidden="true"
      data-animated={ambient && gpu}
    >
      {ambient && gpu && (
        <VisualBoundary>
          <Suspense fallback={null}>
            <MovingSilver />
          </Suspense>
        </VisualBoundary>
      )}
    </div>
  );
}
