import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ACESFilmicToneMapping,
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PMREMGenerator,
  Scene,
  Vector3,
} from "three";

type Pointer = MutableRefObject<{ x: number; y: number; hover: number }>;
const liquidVertex = `
uniform float uTime;
uniform vec3 uPointer;
uniform float uHover;
vec3 liquidShape(vec3 p) {
 vec3 n=normalize(p);
 float t=uTime;
 float swell=sin(n.x*3.1+n.y*1.7+t*.66)*sin(n.z*2.7-n.y*1.8-t*.43);
 float fold=sin(n.y*4.2+n.z*2.4+t*.52)*.025;
 float current=sin(n.x*5.1-n.z*3.2-t*.74)*sin(n.y*3.6+t*.38)*.025;
 float distanceToPointer=distance(n,uPointer);
 float pull=exp(-distanceToPointer*distanceToPointer*5.5)*uHover;
 vec3 displaced=p*(1.+swell*.1+fold+current+pull*.22);
 displaced.x+=sin(n.y*3.+t*.5)*.09;
 displaced.y+=sin(n.z*2.8-t*.4)*.07;
 return displaced;
}
vec3 liquidNormal(vec3 p) {
 vec3 n=normalize(p);
 vec3 tangent=normalize(cross(abs(n.y)>.9?vec3(1.,0.,0.):vec3(0.,1.,0.),n));
 vec3 bitangent=normalize(cross(n,tangent));
 vec3 center=liquidShape(p);
 return normalize(cross(liquidShape(p+tangent*.008)-center,liquidShape(p+bitangent*.008)-center));
}
`;
function Studio() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const studio = new Scene();
    studio.background = new Color("#030405");
    const geometry = new BoxGeometry(1, 1, 1);
    const materials: MeshBasicMaterial[] = [];
    const panel = (
      position: [number, number, number],
      scale: [number, number, number],
      brightness: number,
      color: string,
      rotation = 0,
    ) => {
      const material = new MeshBasicMaterial({
        color: new Color(color).multiplyScalar(brightness),
        side: DoubleSide,
      });
      materials.push(material);
      const mesh = new Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      mesh.rotation.z = rotation;
      studio.add(mesh);
    };
    panel([0, 4, 1], [9, 0.04, 0.45], 5, "#eff3f6", -0.18);
    panel([-4, 0.3, 1], [0.045, 7, 0.45], 3, "#c8d4df", -0.15);
    panel([3.8, 1, -1], [0.04, 5, 0.5], 2, "#e1e8ee", 0.4);
    panel([0.8, 1, 5], [5, 0.09, 0.05], 4, "#ffffff", -0.6);
    panel([0, -3, -2], [7, 0.04, 0.45], 1.8, "#a5b6c4", 0.2);
    panel([-2, 0, 4], [3, 4, 0.05], 0.14, "#8099b1");
    const generator = new PMREMGenerator(gl),
      texture = generator.fromScene(studio, 0.035);
    scene.environment = texture.texture;
    return () => {
      scene.environment = null;
      texture.dispose();
      generator.dispose();
      geometry.dispose();
      materials.forEach((m) => m.dispose());
    };
  }, [gl, scene]);
  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[1, 5, 3]} intensity={1.5} />
      <directionalLight
        position={[-3, -1, 1]}
        intensity={0.4}
        color="#a3b3c5"
      />
    </>
  );
}
function LiquidOrb({
  progress,
  pointer,
}: {
  progress: MutableRefObject<number>;
  pointer: Pointer;
}) {
  const group = useRef<Group>(null);
  const { size, scene } = useThree();
  const target = useMemo(() => new Vector3(), []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new Vector3(0, 0, 1) },
      uHover: { value: 0 },
    }),
    [],
  );
  const material = useMemo(() => {
    const surface = new MeshPhysicalMaterial({
      color: "#929da6",
      metalness: 1,
      roughness: 0.085,
      clearcoat: 1,
      clearcoatRoughness: 0.07,
      iridescence: 0.24,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [180, 340],
      envMapIntensity: 1.15,
    });
    surface.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = liquidVertex + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <beginnormal_vertex>",
        "#include <beginnormal_vertex>\nobjectNormal=liquidNormal(position);",
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\ntransformed=liquidShape(position);",
      );
    };
    surface.customProgramCacheKey = () => "inboxiq-liquid-orb-v1";
    return surface;
  }, [uniforms]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((state, delta) => {
    // Accumulate active time so an offscreen pause resumes without a shape jump.
    uniforms.uTime.value += Math.min(delta, 0.05);
    uniforms.uHover.value = MathUtils.damp(
      uniforms.uHover.value,
      pointer.current.hover,
      4,
      delta,
    );
    target
      .set(pointer.current.x * 0.8, -pointer.current.y * 0.8, 1)
      .normalize();
    scene.environmentRotation.y = Math.sin(uniforms.uTime.value * 0.16) * 0.18;
    uniforms.uPointer.value.lerp(target, 1 - Math.exp(-5 * delta));
    if (group.current) {
      group.current.rotation.y = MathUtils.damp(
        group.current.rotation.y,
        pointer.current.x * 0.12 + progress.current * 0.25,
        2,
        delta,
      );
      group.current.rotation.x = MathUtils.damp(
        group.current.rotation.x,
        pointer.current.y * 0.1,
        2,
        delta,
      );
      group.current.position.y = Math.sin(uniforms.uTime.value * 0.35) * 0.07;
    }
  });
  return (
    <group ref={group} scale={size.width < 700 ? 1 : 0.9}>
      <mesh material={material}>
        <sphereGeometry args={[1.92, 112, 80]} />
      </mesh>
    </group>
  );
}
export default function ConversationScene({
  progress,
  pointer,
  onReady,
  onUnavailable,
  active,
}: {
  progress: MutableRefObject<number>;
  pointer: Pointer;
  active: boolean;
  onReady: () => void;
  onUnavailable: () => void;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0, 7.9], fov: 35 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
        gl.domElement.addEventListener("webglcontextlost", onUnavailable, {
          once: true,
        });
        onReady();
      }}
      fallback={null}
      aria-hidden="true"
    >
      <Studio />
      <LiquidOrb progress={progress} pointer={pointer} />
    </Canvas>
  );
}
