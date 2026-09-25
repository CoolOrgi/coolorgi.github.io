"use client";

/**
 * Custom cursor — only on devices with a real mouse (hover + fine pointer).
 *
 * A single 96px disc, scaled down to a dot by default. Any element can change
 * its state declaratively:
 *   data-cursor="link"                       → grows a little
 *   data-cursor="view" data-cursor-label="…" → expands into an ice disc with a label
 *
 * Position uses gsap.quickTo (one reusable tween per axis, no allocations per
 * mousemove), which gives the slight trailing "weight" instead of a hard lock.
 */
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const SIZE = 96;

export function Cursor() {
  const disc = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const el = disc.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    document.documentElement.classList.add("has-cursor");

    gsap.set(el, { xPercent: -50, yPercent: -50, scale: 0.1, autoAlpha: 0 });
    const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3" });

    let mode: string | null = null;
    let visible = false;

    const setMode = (next: string | null, text?: string) => {
      if (next === mode) return;
      mode = next;
      if (label.current && text) label.current.textContent = text;

      if (mode === "view") {
        gsap.to(el, { scale: 1, backgroundColor: "#b8d4e8", mixBlendMode: "normal", duration: 0.6, ease: "expo.out" });
        gsap.to(label.current, { autoAlpha: 1, scale: 1, duration: 0.4, delay: 0.1 });
      } else {
        gsap.to(el, {
          scale: mode === "link" ? 0.4 : 0.1,
          backgroundColor: "#ededed",
          mixBlendMode: "difference",
          duration: 0.5,
          ease: "expo.out",
        });
        gsap.to(label.current, { autoAlpha: 0, scale: 0.6, duration: 0.2 });
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!visible) {
        visible = true;
        gsap.set(el, { x: e.clientX, y: e.clientY });
        gsap.to(el, { autoAlpha: 1, duration: 0.3 });
      }
      xTo(e.clientX);
      yTo(e.clientY);
    };

    // Event delegation: one listener handles every [data-cursor] element on the
    // page, including ones mounted later.
    const onOver = (e: PointerEvent) => {
      const target = (e.target as Element).closest<HTMLElement>("[data-cursor], a, button");
      if (!target) return setMode(null);
      const kind = target.dataset.cursor ?? "link";
      setMode(kind, target.dataset.cursorLabel);
    };

    const onLeaveWindow = () => {
      visible = false;
      gsap.to(el, { autoAlpha: 0, duration: 0.3 });
    };

    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerover", onOver);
    document.documentElement.addEventListener("pointerleave", onLeaveWindow);

    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeaveWindow);
    };
  });

  return (
    <div
      ref={disc}
      aria-hidden
      style={{ width: SIZE, height: SIZE }}
      className="pointer-events-none invisible fixed top-0 left-0 z-[90] flex items-center justify-center rounded-full bg-bone mix-blend-difference"
    >
      <span ref={label} className="type-meta invisible text-void">
        View
      </span>
    </div>
  );
}
