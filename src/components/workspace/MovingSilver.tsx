import { useEffect, useRef } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { useVisualSystem } from "./visual-context";

export default function MovingSilver() {
  const root = useRef<HTMLDivElement>(null);
  const { backdrop } = useVisualSystem();
  useEffect(() => {
    const register = () => {
      backdrop.current = root.current?.querySelector("canvas") || null;
    };
    const observer = new MutationObserver(register);
    if (root.current)
      observer.observe(root.current, { subtree: true, childList: true });
    register();
    const pointer = (event: PointerEvent) => {
      root.current?.style.setProperty(
        "--silver-pointer-x",
        `${(event.clientX / innerWidth - 0.5) * 12}px`,
      );
      root.current?.style.setProperty(
        "--silver-pointer-y",
        `${(event.clientY / innerHeight - 0.5) * 8}px`,
      );
    };
    window.addEventListener("pointermove", pointer, { passive: true });
    return () => {
      observer.disconnect();
      backdrop.current = null;
      window.removeEventListener("pointermove", pointer);
    };
  }, [backdrop]);
  return (
    <div ref={root} className="silver-moving-backdrop">
      <ShaderGradientCanvas
        pixelDensity={0.75}
        fov={45}
        pointerEvents="none"
        preserveDrawingBuffer
        powerPreference="low-power"
        lazyLoad={false}
      >
        <ShaderGradient
          type="waterPlane"
          animate="on"
          color1="#080c14"
          color2="#6d819c"
          color3="#e6f0ff"
          uSpeed={0.13}
          uStrength={2.2}
          uDensity={1.2}
          uFrequency={2.5}
          uAmplitude={1.8}
          cDistance={4.2}
          cPolarAngle={75}
          cAzimuthAngle={190}
          rotationZ={30}
          lightType="3d"
          brightness={0.85}
          reflection={0}
          grain="off"
          enableTransition={false}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
