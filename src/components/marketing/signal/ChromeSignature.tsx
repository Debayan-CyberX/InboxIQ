import { useEffect, useRef, useState } from "react";
import { createSurface } from "@/lib/visuals/webgl";
import fragment from "@/lib/visuals/liquid-logo.frag.glsl?raw";

export default function ChromeSignature({
  animate,
  gpu,
}: {
  animate: boolean;
  gpu: boolean;
}) {
  const root = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false),
    [ready, setReady] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!gpu || !canvas.current || visible === false) return;
    const surface = createSurface(canvas.current, fragment);
    if (!surface) return;
    const target = canvas.current;
    target.width = 1200;
    target.height = 280;
    const mask = document.createElement("canvas");
    mask.width = 1200;
    mask.height = 280;
    const context = mask.getContext("2d")!;
    context.fillStyle = "white";
    context.font = "700 238px Inter, Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("InboxIQ", 600, 147, 1130);
    const { gl, uniform, draw } = surface;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
    gl.uniform1i(uniform("u_logoTexture"), 0);
    gl.uniform2f(uniform("u_resolution"), 1200, 280);
    const values = {
      u_speed: 0.28,
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
      u_logoAspectRatio: 1200 / 280,
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
      if (animate) frame = requestAnimationFrame(render);
    };
    render(start);
    setReady(true);
    return () => {
      cancelAnimationFrame(frame);
      surface.dispose();
      setReady(false);
    };
  }, [animate, gpu, visible]);
  return (
    <div
      ref={root}
      className="signal-chrome-signature"
      data-rendered={ready}
      aria-label="InboxIQ"
    >
      <span aria-hidden="true">InboxIQ</span>
      <canvas ref={canvas} aria-hidden="true" />
    </div>
  );
}
