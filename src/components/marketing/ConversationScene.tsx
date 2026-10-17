import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  PMREMGenerator,
  Vector3,
  MathUtils,
  ACESFilmicToneMapping,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// A bespoke folded ribbon, not a downloaded model. Its closed route represents
// the context preserved between a message, a relationship and a next action.
function pathwayGeometry() {
  const vertices: number[] = [],
    indices: number[] = [];
  const segments = 192,
    sides = 12;
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const center = new Vector3(
      2.1 * Math.cos(t),
      1.16 * Math.sin(t),
      0.25 * Math.sin(t * 2),
    );
    const tangent = new Vector3(
      -2.1 * Math.sin(t),
      1.16 * Math.cos(t),
      0.5 * Math.cos(t * 2),
    ).normalize();
    const normal = new Vector3(Math.cos(t), Math.sin(t), 0)
      .normalize()
      .applyAxisAngle(tangent, 0.5 * Math.sin(t * 2));
    const binormal = new Vector3().crossVectors(tangent, normal).normalize();
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      const x =
        Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.45) * 0.27;
      const y =
        Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.45) * 0.065;
      const v = center
        .clone()
        .addScaledVector(normal, x)
        .addScaledVector(binormal, y);
      vertices.push(v.x, v.y, v.z);
      if (i < segments && j < sides) {
        const k = i * (sides + 1) + j;
        indices.push(
          k,
          k + 1,
          k + sides + 1,
          k + 1,
          k + sides + 2,
          k + sides + 1,
        );
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
function Studio() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const generator = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const texture = generator.fromScene(room, 0.04);
    scene.environment = texture.texture;
    return () => {
      scene.environment = null;
      texture.dispose();
      room.dispose();
      generator.dispose();
    };
  }, [gl, scene]);
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[2, 6, 3]} intensity={4} />
      <directionalLight position={[-4, -2, 4]} intensity={2} color="#c6d9dd" />
      <spotLight
        position={[1, 4, -3]}
        intensity={45}
        angle={0.6}
        penumbra={1}
      />
    </>
  );
}
function Sculpture({
  progress,
  pointer,
}: {
  progress: React.MutableRefObject<number>;
  pointer: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const group = useRef<Group>(null);
  const message = useRef<Mesh>(null);
  const geometry = useMemo(pathwayGeometry, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((state, delta) => {
    if (!group.current) return;
    const p = progress.current;
    group.current.rotation.x = MathUtils.damp(
      group.current.rotation.x,
      -0.42 + pointer.current.y * 0.13 + p * 0.35,
      3,
      delta,
    );
    group.current.rotation.y = MathUtils.damp(
      group.current.rotation.y,
      -0.52 + pointer.current.x * 0.22 + p * 0.6,
      3,
      delta,
    );
    group.current.rotation.z = MathUtils.damp(
      group.current.rotation.z,
      -0.35 - p * 0.25,
      3,
      delta,
    );
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.035;
    if (message.current) {
      const t = state.clock.elapsedTime * 0.22;
      message.current.position.set(
        2.1 * Math.cos(t),
        1.16 * Math.sin(t),
        0.25 * Math.sin(t * 2),
      );
      message.current.rotation.z = t + Math.PI / 2;
    }
  });
  return (
    <group ref={group} scale={1.12}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color="#c7ccce"
          metalness={1}
          roughness={0.21}
          clearcoat={1}
          clearcoatRoughness={0.12}
        />
      </mesh>
      <mesh geometry={geometry} rotation={[0.9, 0.45, 0.45]} scale={0.83}>
        <meshPhysicalMaterial
          color="#afb8ba"
          metalness={0.94}
          roughness={0.16}
          clearcoat={1}
        />
      </mesh>
      <mesh geometry={geometry} rotation={[-0.75, -0.3, -0.55]} scale={0.61}>
        <meshPhysicalMaterial
          color="#8aada8"
          metalness={0.45}
          roughness={0.12}
          transmission={0.45}
          thickness={0.3}
          ior={1.45}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh ref={message}>
        <boxGeometry args={[0.15, 0.11, 0.14]} />
        <meshStandardMaterial
          color="#bed9c6"
          metalness={0.45}
          roughness={0.25}
          emissive="#405b4c"
          emissiveIntensity={0.2}
        />
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
  progress: React.MutableRefObject<number>;
  pointer: React.MutableRefObject<{ x: number; y: number }>;
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
        gl.toneMappingExposure = 1.05;
        gl.domElement.addEventListener("webglcontextlost", onUnavailable, {
          once: true,
        });
        onReady();
      }}
      fallback={null}
      aria-hidden="true"
    >
      <Studio />
      <Sculpture progress={progress} pointer={pointer} />
    </Canvas>
  );
}
