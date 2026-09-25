"use client";

/**
 * The hover image for Selected Works — one fixed, full-screen, click-through
 * WebGL layer holding a single textured plane that trails the cursor.
 *
 * Shader, in three parts:
 *   1. Reveal mask — a circle with a noisy edge grows from the centre as
 *      `uReveal` goes 0 → 1 (and shrinks back on leave). The image inside
 *      starts zoomed-in and settles to 1:1, so it feels like it's surfacing.
 *   2. Crossfade — moving between rows blends the old texture into the new
 *      one (uTexA → uTexB) instead of cutting.
 *   3. Velocity — how fast the cursor moves bends the image sideways and
 *      splits RGB channels, then everything relaxes when you stop.
 *
 * All animation is damped per-frame from `store`, which Work.tsx writes to
 * on hover. Nothing here goes through React state.
 */
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { RefObject } from "react";

export type RevealStore = {
  /** Index of the hovered project, or -1 */
  index: number;
};

const vertexShader = /* glsl */ `
  uniform vec2 uVelocity;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;
    // Bend the plane like a sheet dragged through air: the middle lags behind.
    float bend = sin(uv.y * 3.14159) * -uVelocity.x * 0.35;
    p.x += bend * 40.0;
    p.y += sin(uv.x * 3.14159) * uVelocity.y * 14.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uMix;
  uniform float uReveal;
  uniform float uTime;
  uniform vec2  uVelocity;
  varying vec2  vUv;

  // Value noise — soft, cheap, good enough for an organic edge.
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  vec3 sampleMix(vec2 uv) {
    return mix(texture2D(uTexA, uv).rgb, texture2D(uTexB, uv).rgb, uMix);
  }

  void main() {
    // 1. Zoom settles from 1.25x to 1x as it reveals.
    vec2 uv = (vUv - 0.5) / mix(1.25, 1.0, uReveal) + 0.5;

    // 3. RGB split along the direction of travel.
    vec2 shift = uVelocity * 0.012;
    vec3 col;
    col.r = sampleMix(uv + shift).r;
    col.g = sampleMix(uv).g;
    col.b = sampleMix(uv - shift).b;

    // 1. Noisy circular mask. The plane is 16:10, so correct the distance.
    vec2 d = (vUv - 0.5) * vec2(1.6, 1.0);
    float n = noise(vUv * 5.0 + uTime * 0.4);
    float radius = uReveal * 1.05;
    float mask = 1.0 - smoothstep(radius - 0.12, radius, length(d) + (n - 0.5) * 0.18);
    mask *= step(0.001, uReveal);

    gl_FragColor = vec4(col, mask);
    #include <colorspace_fragment>
  }
`;

function RevealPlane({ images, store }: { images: string[]; store: RefObject<RevealStore> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const textures = useTexture(images);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTexA: { value: null as THREE.Texture | null },
      uTexB: { value: null as THREE.Texture | null },
      uMix: { value: 1 },
      uReveal: { value: 0 },
      uTime: { value: 0 },
      uVelocity: { value: new THREE.Vector2() },
    }),
    [],
  );

  // Pointer tracking in px, relative to the viewport centre (the ortho camera's origin).
  const pointer = useRef({ x: 0, y: 0, px: 0, py: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX - window.innerWidth / 2;
      pointer.current.y = -(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const shown = useRef(-1);

  useFrame((state, delta) => {
    const m = material.current;
    const plane = mesh.current;
    if (!m || !plane) return;
    const u = m.uniforms;
    const target = store.current?.index ?? -1;
    const damp = THREE.MathUtils.damp;

    u.uTime.value = state.clock.elapsedTime;

    // Texture routing: fresh reveal → show directly; switching rows → crossfade.
    if (target !== -1 && target !== shown.current) {
      const next = textures[target];
      if (u.uReveal.value < 0.05 || shown.current === -1) {
        u.uTexA.value = next;
        u.uTexB.value = next;
        u.uMix.value = 1;
      } else {
        u.uTexA.value = u.uMix.value > 0.5 ? u.uTexB.value : u.uTexA.value;
        u.uTexB.value = next;
        u.uMix.value = 0;
      }
      shown.current = target;
    }
    u.uMix.value = damp(u.uMix.value, 1, 6, delta);
    u.uReveal.value = damp(u.uReveal.value, target === -1 ? 0 : 1, target === -1 ? 7 : 4, delta);

    // Follow the cursor with weight, and measure how fast we're moving.
    const p = pointer.current;
    const prevX = plane.position.x;
    const prevY = plane.position.y;
    plane.position.x = damp(prevX, p.x, 7, delta);
    plane.position.y = damp(prevY, p.y, 7, delta);
    const vx = (plane.position.x - prevX) / Math.max(delta, 1e-3) / 1000;
    const vy = (plane.position.y - prevY) / Math.max(delta, 1e-3) / 1000;
    u.uVelocity.value.x = damp(u.uVelocity.value.x, THREE.MathUtils.clamp(vx, -3, 3), 8, delta);
    u.uVelocity.value.y = damp(u.uVelocity.value.y, THREE.MathUtils.clamp(vy, -3, 3), 8, delta);
    plane.rotation.z = damp(plane.rotation.z, -u.uVelocity.value.x * 0.08, 8, delta);
  });

  // ~30vw wide, 16:10, clamped for very small/large screens.
  const w = THREE.MathUtils.clamp(size.width * 0.3, 320, 560);
  const h = w / 1.6;

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[w, h, 32, 32]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export default function WorkReveal({
  images,
  store,
  active,
}: {
  images: string[];
  store: RefObject<RevealStore>;
  /** false while Selected Works is off-screen → no frames rendered */
  active: boolean;
}) {
  return (
    <Canvas
      orthographic
      // 1 world unit = 1 CSS pixel, origin at the viewport centre.
      camera={{ zoom: 1, position: [0, 0, 100] }}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true }}
      frameloop={active ? "always" : "never"}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}
    >
      <Suspense fallback={null}>
        <RevealPlane images={images} store={store} />
      </Suspense>
    </Canvas>
  );
}
