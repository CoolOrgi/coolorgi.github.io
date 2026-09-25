"use client";

/**
 * Global Lenis smooth-scroll, driven by GSAP's ticker.
 *
 * Why not let Lenis run its own requestAnimationFrame loop?
 * If Lenis and GSAP each own a rAF loop, ScrollTrigger reads the scroll position
 * one frame late and scrubbed/pinned animations visibly jitter. So Lenis gets
 * `autoRaf: false` and is advanced from inside gsap.ticker, and ScrollTrigger is
 * told to update on every Lenis scroll event. One clock, zero drift.
 *
 * The instance is created directly in an effect (not via <ReactLenis>) because it
 * must exist before we wire it to the ticker — the React wrapper creates it
 * asynchronously, which races with this setup.
 */
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    // People who ask their OS for reduced motion get native scrolling, no inertia.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: false,
      // lerp < 0.1 = heavier, more "expensive" momentum. 0.08 is the sweet spot
      // before it starts feeling laggy on trackpads.
      lerp: 0.08,
      // Touch keeps native scrolling — hijacking it feels wrong on phones.
      syncTouch: false,
      // Makes <a href="#work"> links glide instead of jumping.
      anchors: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    // gsap.ticker hands us seconds; Lenis wants milliseconds.
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);

    // GSAP's lag smoothing would fight Lenis' own interpolation after a tab switch.
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
