import { useEffect, useRef, type MutableRefObject } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

export default function SignalAtmosphere({
  source,
}: {
  source: MutableRefObject<HTMLCanvasElement | null>;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => {
      source.current = root.current?.querySelector("canvas") || null;
    };
    const observer = new MutationObserver(update);
    if (root.current)
      observer.observe(root.current, { subtree: true, childList: true });
    update();
    return () => {
      observer.disconnect();
      source.current = null;
    };
  }, [source]);
  return (
    <div className="signal-atmosphere" ref={root}>
      <ShaderGradientCanvas
        pixelDensity={0.6}
        fov={45}
        powerPreference="low-power"
        preserveDrawingBuffer
        lazyLoad={false}
        pointerEvents="none"
      >
        <ShaderGradient
          type="waterPlane"
          animate="on"
          color1="#080b10"
          color2="#6c809d"
          color3="#e0eaf8"
          uSpeed={0.11}
          uStrength={2.1}
          uDensity={1.4}
          uFrequency={2.4}
          uAmplitude={1.6}
          cDistance={4.8}
          cPolarAngle={80}
          cAzimuthAngle={195}
          rotationZ={32}
          brightness={0.72}
          reflection={0}
          grain="off"
          lightType="3d"
          enableTransition={false}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
