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
 float angle=atan(n.z,n.x);
 float fold=sin(angle*2.+n.y*3.3+t*.8)*.085*(1.-n.y*n.y);
 float crease=exp(-pow(sin(angle+n.y*2.2+t*.33),2.)*12.)*.065*(1.-n.y*n.y);
 float current=sin(n.x*5.1-n.z*3.2-t*.74)*sin(n.y*3.6+t*.38)*.015;
 float distanceToPointer=distance(n,uPointer);
 float pull=exp(-distanceToPointer*distanceToPointer*5.5)*uHover;
 vec3 displaced=p*(1.+swell*.045+fold+current+pull*.25);
 displaced.x+=sin(n.y*3.+t*.65)*.15;
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
    panel([0, 4, 1], [8, 0.08, 2], 5, "#eff3f6", -0.18);
    panel([-4, 0.3, 1], [0.045, 7, 0.45], 3, "#c8d4df", -0.15);
    panel([3.8, 1, -1], [0.04, 5, 0.5], 2, "#e1e8ee", 0.4);
    panel([0.8, 1, 5], [5, 0.65, 0.05], 4, "#ffffff", -0.6);
    panel([0.546, 0.628, 5.01], [5, 0.13, 0.05], 2.2, "#00f5ff", -0.6);
    panel([0.467, 0.513, 5.02], [5, 0.13, 0.05], 2.1, "#6400ff", -0.6);
    panel([0.41, 0.43, 5.03], [5, 0.035, 0.05], 1.2, "#ffbd45", -0.6);
    panel([0, -3, -2], [7, 0.04, 0.45], 1.8, "#a5b6c4", 0.2);
    panel([-2, 0, 4], [3, 4, 0.05], 0.14, "#8099b1");
    const generator = new PMREMGenerator(gl),
      texture = generator.fromScene(studio, 0.025);
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
      color: "#c9ced4",
      metalness: 1,
      roughness: 0.065,
      clearcoat: 1,
      clearcoatRoughness: 0.045,
      iridescence: 0.25,
      iridescenceIOR: 1.45,
      iridescenceThicknessRange: [260, 440],
      envMapIntensity: 1.15,
    });
    surface.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = liquidVertex + shader.vertexShader;
      shader.fragmentShader = "uniform float uTime;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        `
        float reflectedEnergy=dot(outgoingLight,vec3(.2126,.7152,.0722));
        float spectrumEdge=smoothstep(.04,.16,reflectedEnergy)*(1.-smoothstep(.65,1.3,reflectedEnergy));
        float hue=sin(normal.y*4.+normal.x*2.5+uTime*.3)*.5+.5;
        vec3 spectralTint=mix(vec3(.0,.82,1.),vec3(.045,.0,1.),smoothstep(.22,.8,hue));
        outgoingLight=mix(outgoingLight,spectralTint*1.5,spectrumEdge*.86);
        #include <opaque_fragment>
      `,
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <beginnormal_vertex>",
        "#include <beginnormal_vertex>\nobjectNormal=liquidNormal(position);",
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\ntransformed=liquidShape(position);",
      );
    };
    surface.customProgramCacheKey = () => "inboxiq-liquid-orb-v2";
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
        <sphereGeometry args={[1.92, 160, 112]} />
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
