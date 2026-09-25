"use client";

/**
 * About / Manifesto — one large statement that "writes itself" as you scroll.
 *
 * Every word starts at 12% opacity and is scrubbed to 100% in reading order,
 * tied directly to scroll position (scrub), so the reader sets the pace. Accent
 * words additionally pick up the ice colour when they light up.
 */
import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { facts, manifesto, manifestoAccents } from "@/content/site";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function Manifesto() {
  const root = useRef<HTMLElement>(null);
  const text = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        SplitText.create(text.current, {
          type: "words",
          autoSplit: true,
          onSplit: (self) => {
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: text.current,
                start: "top 80%",
                end: "bottom 45%",
                scrub: 0.6, // a touch of lag so it feels inked, not switched
              },
            });
            tl.fromTo(self.words, { opacity: 0.12 }, { opacity: 1, stagger: 0.1, duration: 0.5, ease: "none" }, 0);

            // Accent words turn ice right as they light up (same 0.1s-per-word rhythm).
            self.words.forEach((w, i) => {
              if (manifestoAccents.includes(w.textContent ?? "")) {
                tl.to(w, { color: "var(--ice)", duration: 0.4, ease: "none" }, i * 0.1 + 0.2);
              }
            });
            return tl;
          },
        });

        gsap.from("[data-fact]", {
          yPercent: 100,
          stagger: 0.08,
          duration: 1,
          scrollTrigger: { trigger: "[data-facts]", start: "top 90%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="about" className="px-gutter pt-[14vh] pb-[6vh]">
      <SectionHeader index="01" title="About" aside="Manifesto" />

      <p
        ref={text}
        className="mt-[10vh] max-w-[26ch] text-[clamp(2rem,5.2vw,5.5rem)] leading-[1.02] font-extralight tracking-[-0.035em]"
      >
        {manifesto}
      </p>

      <dl
        data-facts
        className="mt-[12vh] grid gap-6 border-t border-hairline pt-6 md:grid-cols-4"
      >
        <div className="hidden md:block" />
        {facts.map((f) => (
          <div key={f.label} className="overflow-hidden">
            <div data-fact>
              <dt className="type-meta text-ash">{f.label}</dt>
              <dd className="mt-2 text-lg font-light text-bone">{f.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
