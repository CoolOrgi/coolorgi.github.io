"use client";

/**
 * Terminal-style preloader.
 *
 * Covers the page until three things are true — fonts are loaded, the window
 * has loaded, and the hero's WebGL canvas has drawn its first frame — so the
 * visitor never sees a blank canvas or a font swap. The counter eases toward
 * 90% on its own, then snaps to 100% once everything is actually ready.
 *
 * Exit: the counter rises out of its mask, then the whole panel wipes upward.
 * `markIntroDone()` fires partway through the wipe so the hero headline starts
 * rising while the panel is still leaving — the two motions overlap into one.
 */
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { markIntroDone, sceneReady } from "@/lib/intro";

/** Never hold the page hostage: if WebGL is slow or broken, lift anyway. */
const MAX_WAIT_MS = 4500;
/** Too fast feels like a glitch; this keeps the counter readable. */
const MIN_SHOW_MS = 1300;

export function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const progress = { value: 0 };

      const render = () => {
        const v = Math.round(progress.value);
        if (count.current) count.current.textContent = String(v).padStart(3, "0");
        if (bar.current) bar.current.style.transform = `scaleX(${progress.value / 100})`;
      };

      // Phase 1: crawl toward 90% while we wait.
      const crawl = gsap.to(progress, {
        value: 90,
        duration: reduced ? 0.3 : 2.4,
        ease: "power2.out",
        onUpdate: render,
      });

      const windowLoaded = new Promise<void>((resolve) => {
        if (document.readyState === "complete") resolve();
        else window.addEventListener("load", () => resolve(), { once: true });
      });
      const minShow = new Promise((r) => setTimeout(r, reduced ? 200 : MIN_SHOW_MS));
      const ready = Promise.all([document.fonts.ready, windowLoaded, sceneReady, minShow]);
      const timeout = new Promise((r) => setTimeout(r, MAX_WAIT_MS));

      let cancelled = false;
      Promise.race([ready, timeout]).then(() => {
        if (cancelled) return;
        crawl.kill();

        // Phase 2: finish the count, then leave.
        const tl = gsap.timeline();
        tl.to(progress, { value: 100, duration: 0.45, ease: "power3.inOut", onUpdate: render })
          .to("[data-loader-line]", {
            yPercent: -110,
            duration: 0.7,
            ease: "expo.in",
            stagger: 0.04,
          })
          .to(
            root.current,
            {
              clipPath: "inset(0% 0% 100% 0%)",
              duration: reduced ? 0.2 : 1.1,
              ease: "expo.inOut",
            },
            "-=0.15",
          )
          // Hand over to the hero ~40% into the wipe.
          .add(markIntroDone, "<0.45")
          .set(root.current, { display: "none" });
      });

      return () => {
        cancelled = true;
      };
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      data-loader
      aria-hidden
      className="fixed inset-0 z-[80] flex flex-col justify-between bg-void-raised px-gutter pt-6 pb-8 [clip-path:inset(0%_0%_0%_0%)]"
    >
      <div className="type-meta grid grid-cols-2 text-ash md:grid-cols-4">
        <span className="overflow-hidden">
          <span data-loader-line className="block text-bone">Orgi®</span>
        </span>
        <span className="hidden overflow-hidden md:block">
          <span data-loader-line className="block">Portfolio — 2026</span>
        </span>
        <span className="hidden overflow-hidden md:block">
          <span data-loader-line className="block">Initialising WebGL</span>
        </span>
        <span className="overflow-hidden text-right">
          <span data-loader-line className="block">
            <span className="animate-pulse text-ice">●</span> Loading
          </span>
        </span>
      </div>

      <div>
        <div className="flex items-end justify-between gap-6">
          <span className="overflow-hidden">
            <span
              data-loader-line
              className="type-display block tabular-nums text-bone"
            >
              <span ref={count}>000</span>
              <span className="text-ash">%</span>
            </span>
          </span>
          <span className="overflow-hidden pb-3">
            <span data-loader-line className="type-meta block text-ash">
              &gt; orgi.is-a.dev<span className="animate-pulse">_</span>
            </span>
          </span>
        </div>
        <div className="mt-6 h-px w-full bg-hairline">
          <div ref={bar} className="h-px origin-left scale-x-0 bg-ice" />
        </div>
      </div>
    </div>
  );
}
