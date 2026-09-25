"use client";

/**
 * Capabilities — two giant marquees running in opposite directions, then a
 * dense typographic grid of the actual stack.
 *
 * The marquees idle slowly, and scroll velocity kicks them: scrolling fast
 * speeds them up (and flips direction when scrolling up), then they ease back
 * to cruising speed. The row also skews slightly with velocity, like it has mass.
 */
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { capabilities, marquee } from "@/content/site";
import { SectionHeader } from "@/components/ui/SectionHeader";

function MarqueeRow({ words, reverse = false }: { words: string[]; reverse?: boolean }) {
  // Two identical halves → translating by -50% loops seamlessly.
  const half = (
    <span className="flex shrink-0 items-center" aria-hidden>
      {words.map((w) => (
        <span key={w} className="flex items-center">
          <span className="px-[0.35em]">{w}</span>
          <span className="text-[0.35em] text-ice">✦</span>
        </span>
      ))}
    </span>
  );
  return (
    <div data-marquee data-reverse={reverse || undefined} className="flex w-max will-change-transform">
      {half}
      {half}
    </div>
  );
}

export function Capabilities() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const rows = gsap.utils.toArray<HTMLElement>("[data-marquee]");
        const loops = rows.map((row) => {
          const dir = row.dataset.reverse ? 1 : -1;
          return gsap.fromTo(
            row,
            { xPercent: dir === -1 ? 0 : -50 },
            { xPercent: dir === -1 ? -50 : 0, duration: 38, ease: "none", repeat: -1 },
          );
        });

        const skewTo = rows.map((row) => gsap.quickTo(row, "skewX", { duration: 0.6, ease: "power3" }));

        ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const v = self.getVelocity(); // px/s, negative when scrolling up
            const boost = 1 + Math.min(Math.abs(v) / 400, 6);
            const sign = self.direction;
            loops.forEach((loop) => {
              gsap.to(loop, { timeScale: boost * sign, duration: 0.2, overwrite: true });
              gsap.to(loop, { timeScale: sign, duration: 1.2, delay: 0.2, ease: "power2.out" });
            });
            const skew = gsap.utils.clamp(-8, 8, v / -250);
            skewTo.forEach((to) => to(skew));
          },
        });

        gsap.from("[data-cap-col]", {
          yPercent: 30,
          opacity: 0,
          stagger: 0.08,
          duration: 1.2,
          scrollTrigger: { trigger: "[data-cap-grid]", start: "top 85%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="capabilities" className="overflow-hidden py-[14vh]">
      <div className="px-gutter">
        <SectionHeader index="03" title="Capabilities" aside="Stack" />
      </div>

      <div
        className="mt-[8vh] flex flex-col gap-2 text-[clamp(3.5rem,11vw,11rem)] leading-[1] font-thin tracking-[-0.05em] whitespace-nowrap select-none"
        aria-label={[...marquee.top, ...marquee.bottom].join(", ")}
        role="img"
      >
        <MarqueeRow words={marquee.top} />
        <MarqueeRow words={marquee.bottom} reverse />
      </div>

      <div
        data-cap-grid
        className="mx-gutter mt-[10vh] grid grid-cols-2 border-t border-l border-hairline md:grid-cols-4"
      >
        {capabilities.map((col, i) => (
          <div
            key={col.title}
            data-cap-col
            className="border-r border-b border-hairline p-4 md:p-6"
          >
            <div className="type-meta flex justify-between text-ash">
              <span>03.{i + 1}</span>
              <span className="text-bone">{col.title}</span>
            </div>
            <ul className="mt-10 space-y-1.5 md:mt-16">
              {col.items.map((item) => (
                <li key={item} className="text-[clamp(1rem,1.6vw,1.5rem)] font-light tracking-[-0.02em]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
