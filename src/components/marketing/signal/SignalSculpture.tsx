import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  CanvasTexture,
  EquirectangularReflectionMapping,
  SRGBColorSpace,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  MathUtils,
  MeshPhysicalMaterial,
  PMREMGenerator,
  Shape,
  Vector2,
  type IUniform,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type Props = {
  progress: MutableRefObject<number>;
  pointer: MutableRefObject<{ x: number; y: number }>;
  active: boolean;
};
function Envelope({ progress, pointer, active }: Props) {
  const { gl, scene, invalidate } = useThree();
  const group = useRef<Group>(null),
    flap = useRef<Group>(null),
    orbit = useRef<Group>(null);
  const clock = useRef(0);
  const uniforms = useMemo(
    () => ({
      uSignalTime: { value: 0 },
      uSignalPointer: { value: new Vector2() },
      uSignalHover: { value: 0 },
    }),
    [],
  );
  const { material, body, triangle, fold } = useMemo(() => {
    const material = new MeshPhysicalMaterial({
      color: "#dce8f5",
      metalness: 0.98,
      roughness: 0.14,
      clearcoat: 1,
      clearcoatRoughness: 0.16,
      side: DoubleSide,
      transparent: true,
    });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms as Record<string, IUniform>);
      shader.vertexShader =
        `uniform float uSignalTime; uniform vec2 uSignalPointer; uniform float uSignalHover;\n${shader.vertexShader}`
          .replace(
            "#include <begin_vertex>",
            `#include <begin_vertex>
        float wave = sin(position.x * 1.65 + uSignalTime * .72) * cos(position.y * 1.4 - uSignalTime * .5);
        float ripple = exp(-length(position.xy - uSignalPointer * vec2(2.6,1.7)) * 1.2) * sin(length(position.xy - uSignalPointer * vec2(2.6,1.7)) * 6. - uSignalTime * 3.);
        transformed.z += wave * .22 + ripple * .19 * uSignalHover;
        transformed.y += sin(position.x * 1.1 + uSignalTime * .5) * .035;
      `,
          )
          .replace(
            "#include <beginnormal_vertex>",
            `#include <beginnormal_vertex>
        objectNormal.x += -.29 * cos(position.x * 1.65 + uSignalTime * .72) * cos(position.y * 1.4 - uSignalTime * .5);
        objectNormal.y += .25 * sin(position.x * 1.65 + uSignalTime * .72) * sin(position.y * 1.4 - uSignalTime * .5);
        objectNormal = normalize(objectNormal);
      `,
          );
    };
    const triangleShape = new Shape();
    triangleShape.moveTo(-2.25, 0);
    triangleShape.lineTo(2.25, 0);
    triangleShape.quadraticCurveTo(2.35, -0.08, 2.22, -0.17);
    triangleShape.lineTo(0.18, -1.63);
    triangleShape.quadraticCurveTo(0, -1.78, -0.18, -1.63);
    triangleShape.lineTo(-2.22, -0.17);
    triangleShape.quadraticCurveTo(-2.35, -0.08, -2.25, 0);
    const foldShape = new Shape();
    foldShape.moveTo(-2.2, -1.42);
    foldShape.lineTo(0, 0.02);
    foldShape.lineTo(2.2, -1.42);
    foldShape.closePath();
    const extrude = {
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.045,
      bevelSegments: 5,
      curveSegments: 20,
    };
    return {
      material,
      body: new RoundedBoxGeometry(4.8, 3.12, 0.15, 10, 0.18),
      triangle: new ExtrudeGeometry(triangleShape, extrude),
      fold: new ExtrudeGeometry(foldShape, extrude),
    };
  }, [uniforms]);
  useEffect(() => {
    const studio = document.createElement("canvas");
    studio.width = 1024;
    studio.height = 512;
    const ctx = studio.getContext("2d")!;
    const background = ctx.createLinearGradient(0, 0, 0, 512);
    background.addColorStop(0, "#26384f");
    background.addColorStop(0.35, "#70849f");
    background.addColorStop(0.6, "#34465d");
    background.addColorStop(1, "#8b9cb3");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 1024, 512);
    ctx.lineCap = "round";
    ctx.shadowColor = "#dceaff";
    ctx.shadowBlur = 18;
    ctx.strokeStyle = "#f5f8ff";
    ctx.lineWidth = 35;
    ctx.beginPath();
    ctx.moveTo(-40, 130);
    ctx.bezierCurveTo(260, 70, 720, 270, 1070, 110);
    ctx.stroke();
    ctx.lineWidth = 64;
    ctx.beginPath();
    ctx.moveTo(-30, 390);
    ctx.bezierCurveTo(370, 250, 720, 430, 1050, 300);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#bcd0ec";
    ctx.fillRect(180, 170, 75, 120);
    ctx.fillStyle = "#dbe9fc";
    ctx.fillRect(770, 170, 48, 160);
    const environment = new CanvasTexture(studio);
    environment.mapping = EquirectangularReflectionMapping;
    environment.colorSpace = SRGBColorSpace;
    const generator = new PMREMGenerator(gl);
    const target = generator.fromEquirectangular(environment);
    scene.environment = target.texture;
    scene.environmentIntensity = 1.05;
    invalidate();
    return () => {
      scene.environment = null;
      target.dispose();
      generator.dispose();
      environment.dispose();
      material.dispose();
      body.dispose();
      triangle.dispose();
      fold.dispose();
    };
  }, [gl, scene, invalidate, material, body, triangle, fold]);
  useEffect(() => {
    invalidate();
    if (!active) return;
    const timer = setInterval(invalidate, 1000 / 30);
    return () => clearInterval(timer);
  }, [active, invalidate]);
  useFrame((_, delta) => {
    if (active) clock.current += Math.min(delta, 0.05);
    const t = clock.current,
      p = progress.current;
    uniforms.uSignalTime.value = t;
    uniforms.uSignalPointer.value.x = MathUtils.damp(
      uniforms.uSignalPointer.value.x,
      pointer.current.x,
      4,
      delta,
    );
    uniforms.uSignalPointer.value.y = MathUtils.damp(
      uniforms.uSignalPointer.value.y,
      pointer.current.y,
      4,
      delta,
    );
    uniforms.uSignalHover.value = MathUtils.damp(
      uniforms.uSignalHover.value,
      pointer.current.x > -0.12 ? 1 : 0,
      3,
      delta,
    );
    material.opacity = 1 - MathUtils.smoothstep(p, 0.3, 0.66);
    if (group.current) {
      group.current.position.set(
        2.75 - MathUtils.smoothstep(p, 0.1, 0.36) * 0.65,
        Math.sin(t * 0.42) * 0.12 + MathUtils.smoothstep(p, 0.2, 0.55) * 0.6,
        0,
      );
      group.current.rotation.set(
        0.12 + Math.sin(t * 0.27) * 0.06 + pointer.current.y * 0.045,
        -0.32 + Math.cos(t * 0.3) * 0.08 + pointer.current.x * 0.12,
        -0.14 + Math.sin(t * 0.25) * 0.04,
      );
      group.current.scale.setScalar(
        1.1 - MathUtils.smoothstep(p, 0.2, 0.6) * 0.3,
      );
      group.current.visible = p < 0.68;
    }
    if (flap.current)
      flap.current.rotation.x = -MathUtils.smoothstep(p, 0.08, 0.3) * 2.35;
    if (orbit.current) orbit.current.rotation.z = -0.3 + t * 0.035;
  });
  return (
    <>
      <ambientLight intensity={1.6} />
      <pointLight position={[0, 5, 7]} intensity={38} color="#f3f7ff" />
      <pointLight position={[6, -2, 3]} intensity={20} color="#a9c9ee" />
      <group ref={group}>
        <mesh geometry={body} material={material} />
        <mesh geometry={fold} material={material} position={[0, 0, 0.14]} />
        <group ref={flap} position={[0, 1.36, 0.65]}>
          <mesh geometry={triangle} material={material} />
        </group>
        <group ref={orbit}>
          <mesh rotation={[0.55, 0.15, 0]} scale={[1.1, 0.66, 1]}>
            <torusGeometry args={[3, 0.013, 6, 160]} />
            <meshPhysicalMaterial
              color="#e1edfc"
              metalness={1}
              roughness={0.2}
              transparent
              opacity={0.55}
            />
          </mesh>
        </group>
      </group>
    </>
  );
}
export default function SignalSculpture(props: Props) {
  return (
    <Canvas
      className="signal-sculpture-canvas"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      camera={{ position: [0, 0, 11.2], fov: 40 }}
      frameloop="demand"
      dpr={[1, 1.3]}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
    >
      <Envelope {...props} />
    </Canvas>
  );
}
