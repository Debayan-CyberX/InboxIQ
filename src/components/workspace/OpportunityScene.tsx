import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Mesh,
  Group,
  Vector3,
  PerspectiveCamera,
  PMREMGenerator,
  MeshPhysicalMaterial,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { opportunityPosition, type Opportunity } from "@/lib/opportunity-map";

type Props = {
  items: Opportunity[];
  selected: string;
  onSelect: (id: string) => void;
  labels: MutableRefObject<Map<string, HTMLButtonElement>>;
  animate: boolean;
};
function Scene({ items, selected, onSelect, labels, animate }: Props) {
  const { gl, scene, camera, invalidate, size } = useThree();
  const core = useRef<Mesh>(null);
  const hover = useRef<Group>(null);
  const positions = useMemo(
    () => items.map((_, index) => opportunityPosition(index, items.length)),
    [items],
  );
  const lines = useMemo(
    () =>
      new Float32Array(positions.flatMap((position) => [0, 0, 0, ...position])),
    [positions],
  );
  const point = useMemo(() => new Vector3(), []);
  const material = useMemo(() => {
    const result = new MeshPhysicalMaterial({
      color: "#d5e3f5",
      metalness: 0.92,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    });
    return result;
  }, []);
  useEffect(() => {
    const environment = new RoomEnvironment();
    const generator = new PMREMGenerator(gl);
    const target = generator.fromScene(environment, 0.05);
    scene.environment = target.texture;
    invalidate();
    return () => {
      scene.environment = null;
      target.dispose();
      generator.dispose();
      environment.dispose();
      material.dispose();
    };
  }, [gl, scene, invalidate, material]);
  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const aspect = size.width / Math.max(size.height, 1);
    camera.position.z = Math.max(10, 4.8 / (Math.tan((camera.fov * Math.PI) / 360) * aspect));
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size, invalidate]);
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.rotateSpeed = 0.45;
    controls.minPolarAngle = Math.PI * 0.3;
    controls.maxPolarAngle = Math.PI * 0.7;
    controls.minAzimuthAngle = -0.4;
    controls.maxAzimuthAngle = 0.4;
    const changed = () => invalidate();
    controls.addEventListener("change", changed);
    return () => {
      controls.removeEventListener("change", changed);
      controls.dispose();
    };
  }, [camera, gl, invalidate]);
  useEffect(() => {
    invalidate();
    if (!animate) return;
    const timer = setInterval(invalidate, 1000 / 30);
    return () => clearInterval(timer);
  }, [animate, invalidate]);
  useFrame(({ clock }) => {
    const t = animate ? clock.elapsedTime : 0;
    if (core.current) {
      core.current.rotation.set(t * 0.08, t * 0.12, 0.2);
      core.current.scale.set(
        1 + 0.06 * Math.sin(t * 0.7),
        1 + 0.045 * Math.cos(t * 0.9),
        1 + 0.05 * Math.sin(t * 0.5),
      );
    }
    if (hover.current) hover.current.rotation.z = t * 0.04;
    items.forEach((item, index) => {
      const label = labels.current.get(item.lead.id);
      if (!label) return;
      point.set(...positions[index]).project(camera);
      label.style.left = `${(point.x * 0.5 + 0.5) * size.width}px`;
      label.style.top = `${(-point.y * 0.5 + 0.5) * size.height + 20}px`;
    });
  });
  return (
    <>
      <ambientLight intensity={1.4} />
      <pointLight position={[3, 4, 6]} intensity={22} color="#edf6ff" />
      <pointLight position={[-4, -1, 3]} intensity={12} color="#a6c7ee" />
      <mesh ref={core} material={material}>
        <sphereGeometry args={[0.69, 48, 48]} />
      </mesh>
      <group ref={hover}>
        <mesh rotation={[Math.PI / 2.5, 0.3, 0]}>
          <torusGeometry args={[0.92, 0.008, 6, 90]} />
          <meshBasicMaterial color="#b6cfea" transparent opacity={0.4} />
        </mesh>
        <mesh rotation={[Math.PI / 2.1, -0.4, 0.3]}>
          <torusGeometry args={[1.04, 0.005, 6, 90]} />
          <meshBasicMaterial color="#b6cfea" transparent opacity={0.18} />
        </mesh>
      </group>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#b1c8e4" transparent opacity={0.22} />
      </lineSegments>
      {items.map((item, index) => (
        <mesh
          key={item.lead.id}
          position={positions[index]}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(item.lead.id);
          }}
        >
          <sphereGeometry
            args={[item.lead.id === selected ? 0.13 : 0.085, 16, 16]}
          />
          <meshStandardMaterial
            color={item.lead.id === selected ? "#eef7ff" : "#a9bfd8"}
            emissive="#b5d6ff"
            emissiveIntensity={item.lead.id === selected ? 0.8 : 0.22}
            metalness={0.55}
            roughness={0.2}
          />
        </mesh>
      ))}
    </>
  );
}
export default function OpportunityScene(props: Props) {
  return (
    <Canvas
      style={{ position: "absolute", inset: 0 }}
      className="silver-map-canvas"
      dpr={[1, 1.25]}
      frameloop="demand"
      camera={{ position: [0, 0, 10], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
