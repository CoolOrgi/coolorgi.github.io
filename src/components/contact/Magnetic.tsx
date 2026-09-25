"use client";

/**
 * Wraps any element so it's pulled toward the cursor when it comes near, and
 * springs back (elastic) when the cursor leaves. The inner label moves further
 * than the outer shape, which gives the effect its depth.
 */
import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export function Magnetic({
  children,
  strength = 0.4,
  className,
}: {
  children: ReactNode;
  /** 0–1: how far toward the cursor it travels */
  strength?: number;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      const inner = el.querySelector<HTMLElement>("[data-magnetic-inner]");

      const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const ixTo = inner && gsap.quickTo(inner, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const iyTo = inner && gsap.quickTo(inner, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });

      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        xTo(dx * strength);
        yTo(dy * strength);
        ixTo?.(dx * strength * 0.5);
        iyTo?.(dy * strength * 0.5);
      };
      const onLeave = () => {
        xTo(0);
        yTo(0);
        ixTo?.(0);
        iyTo?.(0);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: root },
  );

  return (
    // Padding enlarges the "field" the cursor gets captured in, beyond the visible button.
    <div ref={root} className={`p-8 ${className ?? ""}`}>
      {children}
    </div>
  );
}
