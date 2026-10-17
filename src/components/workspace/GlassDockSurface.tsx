import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { createSurface } from "@/lib/visuals/webgl";
import fragment from "@/lib/visuals/liquid-glass.frag.glsl?raw";
import poster from "@/assets/workspace-backdrop.svg";
import { useVisualSystem } from "./visual-context";

export default function GlassDockSurface() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { backdrop, ambient, gpu, compact, visible } = useVisualSystem();
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (!gpu || compact || visible === false || !canvas.current) return;
    const target = canvas.current;
    const surface = createSurface(target, fragment);
    if (!surface) return;
    const { gl, uniform, draw } = surface;
    const fallback = document.createElement("canvas");
    fallback.width = 960;
    fallback.height = 600;
    const ctx = fallback.getContext("2d")!;
    ctx.fillStyle = "#0c111a";
    ctx.fillRect(0, 0, 960, 600);
    const image = new Image();
    let disposed = false;
    const render = () => {
      if (disposed || !target.parentElement) return;
      const rect = target.parentElement.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width)),
        height = Math.max(1, Math.round(rect.height));
      if (target.width !== width || target.height !== height) {
        target.width = width;
        target.height = height;
      }
      const source = backdrop.current?.width ? backdrop.current : fallback;
      try {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          source,
        );
      } catch {
        return;
      }
      gl.uniform1i(uniform("u_image"), 0);
      gl.uniform2f(uniform("u_resolution"), width, height);
      gl.uniform2f(uniform("u_viewport"), innerWidth, innerHeight);
      gl.uniform2f(uniform("u_position"), rect.left, rect.top);
      gl.uniform1f(uniform("u_light"), resolvedTheme === "light" ? 1 : 0);
      draw();
    };
    image.onload = () => {
      if (!disposed) {
        ctx.drawImage(image, 0, 0, 960, 600);
        render();
      }
    };
    image.src = poster;
    const observer = new ResizeObserver(render);
    observer.observe(target.parentElement!);
    render();
    const interval = ambient
      ? window.setInterval(render, 1000 / 30)
      : undefined;
    return () => {
      disposed = true;
      image.onload = null;
      observer.disconnect();
      if (interval) clearInterval(interval);
      surface.dispose();
    };
  }, [backdrop, ambient, gpu, compact, visible, resolvedTheme]);
  return (
    <canvas className="silver-dock-optics" ref={canvas} aria-hidden="true" />
  );
}
