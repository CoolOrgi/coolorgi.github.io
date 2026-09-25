"use client";

/**
 * Hero — full-viewport opener.
 *
 * Layers (bottom → top):
 *   1. <HeroScene>: the R3F canvas (lazy-loaded, client-only)
 *   2. A vignette gradient so the headline always has contrast over the shard
 *   3. Top metadata row, the massive headline, the bottom metadata row
 *
 * Motion:
 *   - Intro: headline lines rise out of a mask (SplitText, mask: "lines"),
 *     metadata wipes in left-to-right like a terminal printing.
 *   - Scroll: a scrubbed ScrollTrigger lifts the headline away and feeds its
 *     progress into the WebGL scene via a ref (no React re-renders per frame).
 */
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";

// three.js is ~600 kB — keep it out of the server render and the first JS chunk.
const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

/** Delay before the intro starts. The Loader will replace this with a "ready" signal. */
const INTRO_DELAY = 0.2;

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);

  // Shared with the WebGL scene. A ref, not state: it changes every scroll frame
  // and re-rendering React 60 times a second for it would be wasteful.
  const scrollProgress = useRef(0);

  const [sceneActive, setSceneActive] = useState(true);
  const reducedMotion = useReducedMotion();

  // Stop the WebGL render loop entirely while the hero is off-screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setSceneActive(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // ---- Full motion ------------------------------------------------------
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // 1. Headline: split into masked lines and rise each one up into view.
        //    autoSplit re-splits on resize / font load (lines change when the
        //    text re-wraps); returning the tween from onSplit lets GSAP carry
        //    its progress over to the re-split lines instead of replaying it.
        gsap.set(headline.current, { visibility: "visible" });
        SplitText.create(headline.current, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 115,
              rotate: 2.5, // slight tilt that settles flat — reads as "physical"
              transformOrigin: "0% 100%",
              duration: 1.6,
              stagger: 0.09,
              ease: "expo.out",
              delay: INTRO_DELAY,
            }),
        });

        // 2. Metadata: wipe in left→right, staggered, like a terminal printing.
        gsap.fromTo(
          "[data-hero-meta]",
          { visibility: "visible", clipPath: "inset(0 100% 0 0)" },
          {
            clipPath: "inset(0 0% 0 0)",
            duration: 1.1,
            ease: "power3.inOut",
            stagger: 0.06,
            delay: INTRO_DELAY + 0.5,
          },
        );

        // 3. Scroll-out: scrubbed to the scrollbar (via Lenis → ScrollTrigger).
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
              scrollProgress.current = self.progress;
            },
          },
        });
        tl.to(headline.current, { yPercent: -35, opacity: 0.15, ease: "none" }, 0).to(
          "[data-hero-fade]",
          { opacity: 0, ease: "none", duration: 0.4 },
          0,
        );
      });

      // ---- Reduced motion: just show everything, no movement ---------------
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([headline.current, "[data-hero-meta]"], { visibility: "visible" });
      });

      // Fonts shift line heights slightly once they load; recompute trigger positions.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="top"
      aria-label="Introduction"
      className="relative isolate flex h-svh min-h-[560px] flex-col justify-between overflow-hidden px-gutter pt-6 pb-8"
    >
      {/* 1. WebGL */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        <HeroScene
          scrollProgress={scrollProgress}
          eventSource={root}
          active={sceneActive}
          reducedMotion={reducedMotion}
        />
      </div>

      {/* 2. Vignette: keeps the lower-left (where the text lives) dark enough to read. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_0%_100%,var(--void)_15%,transparent_65%)]"
      />

      {/* 3a. Top metadata row */}
      <header
        data-hero-fade
        className="type-meta grid grid-cols-2 gap-4 text-ash md:grid-cols-4"
      >
        <span data-reveal data-hero-meta className="text-bone">
          Orgi®
        </span>
        <span data-reveal data-hero-meta className="hidden md:block">
          Creative Developer
        </span>
        <span data-reveal data-hero-meta className="hidden md:block">
          Based in Albania
        </span>
        <span data-reveal data-hero-meta className="text-right">
          <LocalTime />
        </span>
      </header>

      {/* 3b. Headline */}
      <div className="mt-auto">
        <h1
          ref={headline}
          data-reveal
          className="type-display max-w-[14ch] will-change-transform"
        >
          Hi, I&rsquo;m <span className="text-ice">Orgi.</span>
          <br />
          Creative Developer.
        </h1>
      </div>

      {/* 3c. Bottom metadata row */}
      <footer
        data-hero-fade
        className="type-meta mt-10 flex items-end justify-between gap-6 text-ash"
      >
        <p data-reveal data-hero-meta className="max-w-[32ch]">
          Immersive web experiences — WebGL, motion &amp; interfaces that feel physical.
        </p>
        <a
          data-reveal
          data-hero-meta
          href="#about"
          className="group flex items-center gap-2 text-bone transition-colors hover:text-ice"
        >
          <span className="relative block h-3 w-px overflow-hidden bg-hairline">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-cue_1.8s_var(--ease-in-out-quart)_infinite] bg-ice" />
          </span>
          (Scroll)
        </a>
      </footer>
    </section>
  );
}

/**
 * Live local time in Tirana, e.g. "TIRANA 14:32".
 * Rendered empty on the server and filled after mount — rendering the time on
 * the server would always mismatch the client (hydration error).
 */
function LocalTime() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Tirane",
    });
    const update = () => setTime(fmt.format(new Date()));
    update();
    const id = window.setInterval(update, 15_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      Tirana <span className="tabular-nums text-bone">{time || "--:--"}</span>
    </>
  );
}
