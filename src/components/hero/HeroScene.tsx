"use client";

/**
 * The WebGL layer behind the hero headline.
 *
 * A faceted icosahedron "shard" with a custom iridescent shader, wrapped in a
 * slowly counter-rotating wireframe shell and a few drifting dust particles.
 *
 * It reacts to three inputs:
 *   - time     → idle rotation + the iridescence slowly shifting hue
 *   - pointer  → the whole group leans toward the cursor (damped, never snappy)
 *   - scroll   → `scrollProgress` (0 at top of hero, 1 once it has scrolled
 *                away) spins the shard faster and pushes it back into the fog
 *
 * Loaded with next/dynamic + ssr:false from Hero.tsx, so none of three.js ends
 * up in the server render or blocks first paint.
 */
import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/* Shader                                                              */
/* ------------------------------------------------------------------ */

const vertexShader = /* glsl */ `
  varying vec3 vViewPos;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3  uTint;
  varying vec3  vViewPos;

  // Inigo Quilez cosine palette — a cheap, smooth way to get a full
  // thin-film / oil-slick rainbow out of a single float.
  vec3 palette(float t) {
    return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.12, 0.24)));
  }

  // A fake photo-studio environment: black room, one wide softbox up-left,
  // a thin rim strip to the right. Chrome is ~100% reflection, so what makes
  // it read as "metal" is high contrast between what each facet reflects.
  vec3 studio(vec3 r) {
    float softbox = smoothstep(0.72, 0.97, dot(r, normalize(vec3(-0.6, 0.7, 0.4))));
    float rim     = smoothstep(0.93, 0.99, dot(r, normalize(vec3(0.9, 0.1, 0.3))));
    float floorGlow = smoothstep(0.0, -0.8, r.y) * 0.06;
    return vec3(softbox * 1.1 + rim * 0.9 + floorGlow);
  }

  void main() {
    // Flat, per-face normal from screen-space derivatives. This is what gives
    // the crisp cut-crystal facets without needing a flat-shaded geometry.
    vec3 n = normalize(cross(dFdx(vViewPos), dFdy(vViewPos)));
    vec3 v = normalize(-vViewPos);

    // Fresnel: grazing facets reflect more and pick up the iridescent film.
    float fres = pow(1.0 - abs(dot(n, v)), 1.6);

    // Mirror reflection of the studio. (View space ≈ world space here — the
    // camera never rotates — so the softbox stays put while the shard turns.)
    vec3 r = reflect(-v, n);
    vec3 env = studio(r);

    // Iridescent thin-film: hue depends on angle + face orientation and drifts
    // slowly over time, so each facet catches a slightly different colour.
    float hue  = fres * 1.2 + dot(n, vec3(0.3, 0.6, 0.2)) * 0.5 + uTime * 0.03;
    vec3  film = palette(hue);
    // Pull the rainbow back toward the icy accent — chrome with an oil-slick
    // sheen, not a unicorn.
    film = mix(uTint, film, 0.6);

    vec3 base = vec3(0.004, 0.005, 0.007);         // near-black polished body
    vec3 col  = base
              + env * mix(vec3(0.9), film, 0.45)    // tinted reflections
              + film * film * fres * 0.35;           // saturated iridescent sheen

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/* ------------------------------------------------------------------ */
/* Scene contents                                                      */
/* ------------------------------------------------------------------ */

function Shard({ scrollProgress }: { scrollProgress: RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const shard = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.LineSegments>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  // Uniforms are created once; each frame we write to .value through the
  // material ref instead of re-creating objects (which would cause GC stutter).
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTint: { value: new THREE.Color("#b8d4e8") },
    }),
    [],
  );

  // Wireframe shell: EdgesGeometry gives clean facet edges without the
  // diagonal triangle seams a plain `wireframe: true` would show.
  const shellGeometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.15, 1)),
    [],
  );

  // On wide screens the shard sits to the right of the headline; on narrow
  // screens it moves up and behind the text instead.
  const isWide = viewport.aspect > 1;
  const baseX = isWide ? viewport.width * 0.24 : 0;
  const baseY = isWide ? 0.35 : viewport.height * 0.17;
  const scale = isWide ? 0.78 : 0.5;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const p = scrollProgress.current ?? 0;
    if (material.current) material.current.uniforms.uTime.value = t;

    if (shard.current) {
      // Idle spin + extra spin while scrolling away.
      shard.current.rotation.x += delta * (0.08 + p * 0.6);
      shard.current.rotation.y += delta * (0.12 + p * 0.9);
    }
    if (shell.current) {
      shell.current.rotation.y -= delta * 0.05;
      shell.current.rotation.z += delta * 0.03;
    }

    if (group.current) {
      // Lean toward the pointer. `damp` is frame-rate independent, so it feels
      // identical on 60Hz and 144Hz screens.
      const { pointer } = state;
      const g = group.current;
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, pointer.x * 0.35, 2.5, delta);
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -pointer.y * 0.25, 2.5, delta);

      // Scroll: drift up and back into the fog as the hero leaves the screen.
      g.position.x = THREE.MathUtils.damp(g.position.x, baseX + pointer.x * 0.15, 3, delta);
      g.position.y = THREE.MathUtils.damp(g.position.y, baseY + p * 1.2, 4, delta);
      g.position.z = THREE.MathUtils.damp(g.position.z, -p * 3, 4, delta);
    }
  });

  return (
    <group ref={group} scale={scale}>
      <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.6}>
        <mesh ref={shard}>
          <icosahedronGeometry args={[1.35, 0]} />
          <shaderMaterial
            ref={material}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={uniforms}
          />
        </mesh>
        <lineSegments ref={shell} geometry={shellGeometry}>
          <lineBasicMaterial color="#b8d4e8" transparent opacity={0.09} />
        </lineSegments>
      </Float>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Canvas                                                              */
/* ------------------------------------------------------------------ */

type HeroSceneProps = {
  /** 0 → 1 as the hero scrolls out of view; written by a ScrollTrigger in Hero.tsx */
  scrollProgress: RefObject<number>;
  /** Element that receives pointer events (the whole hero, since text sits on top of the canvas) */
  eventSource: RefObject<HTMLElement | null>;
  /** false once the hero is off-screen → stop rendering entirely to save battery/GPU */
  active: boolean;
  reducedMotion: boolean;
};

export default function HeroScene({
  scrollProgress,
  eventSource,
  active,
  reducedMotion,
}: HeroSceneProps) {
  return (
    <Canvas
      // Cap pixel ratio: 3x retina phones would otherwise render 9x the pixels.
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      // Text is layered over the canvas, so listen for the pointer on the hero
      // itself rather than on the canvas element.
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
      // Off-screen → no frames at all. Reduced motion → render once, then still.
      frameloop={!active ? "never" : reducedMotion ? "demand" : "always"}
    >
      {/* Fog matches the page colour, so things pushed back dissolve into the void. */}
      <fog attach="fog" args={["#050505", 5, 11]} />

      <Shard scrollProgress={scrollProgress} />

      {!reducedMotion && (
        <Sparkles count={60} scale={[10, 6, 4]} size={1.4} speed={0.18} opacity={0.35} color="#b8d4e8" />
      )}
    </Canvas>
  );
}
