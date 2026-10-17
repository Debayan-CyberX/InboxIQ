import { useEffect, useRef, type MutableRefObject } from "react";
import { createSurface } from "@/lib/visuals/webgl";
import fragment from "@/lib/visuals/liquid-glass.frag.glsl?raw";

export default function SignalGlass({
  source,
  active,
}: {
  source: MutableRefObject<HTMLCanvasElement | null>;
  active: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !active) return;
    const target = ref.current,
      surface = createSurface(target, fragment);
    if (!surface) return;
    const { gl, uniform, draw } = surface;
    const fallback = document.createElement("canvas");
    fallback.width = 800;
    fallback.height = 500;
    const context = fallback.getContext("2d")!;
    const gradient = context.createLinearGradient(0, 500, 800, 0);
    gradient.addColorStop(0, "#080b10");
    gradient.addColorStop(0.6, "#60728f");
    gradient.addColorStop(0.7, "#c5d7ec");
    gradient.addColorStop(1, "#101722");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 800, 500);
    const render = () => {
      if (!target.parentElement) return;
      const box = target.parentElement.getBoundingClientRect();
      const width = Math.round(box.width),
        height = Math.round(box.height);
      if (target.width !== width || target.height !== height) {
        target.width = width;
        target.height = height;
      }
      if (!target.width || !target.height) return;
      try {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          source.current?.width ? source.current : fallback,
        );
      } catch {
        return;
      }
      gl.uniform1i(uniform("u_image"), 0);
      gl.uniform2f(uniform("u_resolution"), target.width, target.height);
      gl.uniform2f(uniform("u_viewport"), innerWidth, innerHeight);
      gl.uniform2f(uniform("u_position"), box.left, box.top);
      gl.uniform1f(uniform("u_light"), 0);
      draw();
    };
    render();
    const timer = setInterval(render, 1000 / 20);
    return () => {
      clearInterval(timer);
      surface.dispose();
    };
  }, [source, active]);
  return <canvas ref={ref} className="signal-nav-optics" aria-hidden="true" />;
}
