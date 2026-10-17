import { useEffect, useRef, useState } from "react";
import { createSurface } from "@/lib/visuals/webgl";
import fragment from "@/lib/visuals/liquid-logo.frag.glsl?raw";
import { useElementVisible, useVisualSystem } from "./visual-context";

export default function LiquidMark() {
  const root = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { gpu, motion, compact } = useVisualSystem();
  const visible = useElementVisible(root);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const complete = () => setPulse(Date.now());
    window.addEventListener("emailSyncCompleted", complete);
    return () => window.removeEventListener("emailSyncCompleted", complete);
  }, []);
  useEffect(() => {
    if (!gpu || visible === false || compact || !canvas.current) return;
    const surface = createSurface(canvas.current, fragment);
    if (!surface) return;
    const { gl, uniform, draw } = surface;
    const mask = document.createElement("canvas");
    mask.width = mask.height = 128;
    const context = mask.getContext("2d")!;
    context.fillStyle = "white";
    context.beginPath();
    context.roundRect(12, 25, 104, 78, 15);
    context.fill();
    context.globalCompositeOperation = "destination-out";
    context.strokeStyle = "white";
    context.lineWidth = 7;
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(20, 38);
    context.lineTo(64, 70);
    context.lineTo(108, 38);
    context.stroke();
    canvas.current.width = canvas.current.height = 96;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
    gl.uniform1i(uniform("u_logoTexture"), 0);
    gl.uniform2f(uniform("u_resolution"), 96, 96);
    const values: Record<string, number> = {
      u_speed: 0.35,
      u_iterations: 6,
      u_scale: 0.8,
      u_dotFactor: 0.5,
      u_vOffset: 0.4,
      u_intensityFactor: 0.035,
      u_expFactor: 3,
      u_colorShift: 0,
      u_dotMultiplier: 1.5,
      u_noiseIntensity: 0.8,
      u_logoOpacity: 1,
      u_logoScale: 1,
      u_logoAspectRatio: 1,
      u_logoInteractStrength: 0.9,
    };
    Object.entries(values).forEach(([name, value]) =>
      gl.uniform1f(uniform(name), value),
    );
    gl.uniform3f(uniform("u_colorFactors"), 1, 1, 1);
    gl.uniform1i(uniform("u_logoBlendMode"), 0);
    let frame = 0;
    const start = performance.now();
    const render = (now: number) => {
      gl.uniform1f(uniform("u_time"), (now - start) / 1000 + 8);
      draw();
      if (motion && pulse && now - start < 2600)
        frame = requestAnimationFrame(render);
    };
    render(start);
    const element = root.current;
    element?.setAttribute("data-rendered", "true");
    return () => {
      cancelAnimationFrame(frame);
      surface.dispose();
      element?.removeAttribute("data-rendered");
    };
  }, [gpu, visible, motion, compact, pulse]);
  return (
    <span
      ref={root}
      className="silver-liquid-mark"
      aria-hidden="true"
      onPointerEnter={() => setPulse(Date.now())}
    >
      <svg viewBox="0 0 28 28" fill="none">
        <rect x="3" y="5" width="22" height="18" rx="4" fill="currentColor" />
        <path
          d="m5 8 9 7 9-7"
          stroke="var(--silver-mark-cutout, #0e1219)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      <canvas ref={canvas} />
    </span>
  );
}
