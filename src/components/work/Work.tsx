"use client";

/**
 * Selected Works — full-width typographic rows instead of cards.
 *
 * Mouse devices: hovering a row dims the others, nudges its title, turns the
 * cursor into a "View" disc and surfaces the project image through the WebGL
 * mask in <WorkReveal>. Touch devices get the image inline under each row,
 * since there's no hover to reveal it.
 *
 * As each row enters the viewport its hairline draws in and its text rises out of a mask.
 */
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { projects } from "@/content/site";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { RevealStore } from "./WorkReveal";

const WorkReveal = dynamic(() => import("./WorkReveal"), { ssr: false });

export function Work() {
  const root = useRef<HTMLElement>(null);
  const store = useRef<RevealStore>({ index: -1 });
  const hoverDevice = useMediaQuery("(hover: hover) and (pointer: fine)");
  const [inView, setInView] = useState(false);

  // Only render the hover canvas while this section is on screen.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-row]").forEach((row) => {
          gsap.from(row.querySelectorAll("[data-row-reveal]"), {
            yPercent: 110,
            duration: 1.3,
            stagger: 0.05,
            scrollTrigger: { trigger: row, start: "top 88%" },
          });
          gsap.from(row, {
            "--line": 0,
            duration: 1.4,
            ease: "expo.inOut",
            scrollTrigger: { trigger: row, start: "top 92%" },
          });
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="work" className="px-gutter py-[14vh]">
      <SectionHeader
        index="02"
        title="Selected Works"
        aside={String(projects.length).padStart(2, "0")}
      />

      <ul
        className="group/list mt-[8vh]"
        onPointerLeave={() => (store.current.index = -1)}
      >
        {projects.map((p, i) => {
          const Row = p.url ? "a" : "div";
          return (
            <li
              key={p.slug}
              data-row
              style={{ ["--line" as string]: 1 }}
              className="relative transition-opacity duration-500 ease-expo pointer-fine:group-hover/list:opacity-25 pointer-fine:hover:!opacity-100 before:absolute before:inset-x-0 before:top-0 before:h-px before:origin-left before:scale-x-[var(--line)] before:bg-hairline last:after:absolute last:after:inset-x-0 last:after:bottom-0 last:after:h-px last:after:bg-hairline"
              onPointerEnter={() => (store.current.index = i)}
            >
              <Row
                {...(p.url ? { href: p.url, target: "_blank", rel: "noreferrer" } : {})}
                data-cursor="view"
                data-cursor-label={p.url ? "View" : "Soon"}
                className="group/row grid grid-cols-[auto_1fr] items-end gap-x-6 gap-y-4 py-[clamp(1.5rem,4vh,3rem)] md:grid-cols-[4rem_1fr_16rem_2rem]"
              >
                <span className="type-meta self-start overflow-hidden pt-3 text-ash">
                  <span data-row-reveal className="block">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>

                <span className="overflow-hidden pb-[0.08em]">
                  {/* GSAP owns the outer span's transform, CSS the inner one — they'd fight on one element. */}
                  <span data-row-reveal className="block">
                    <span className="block text-[clamp(2.6rem,8vw,8.5rem)] leading-[0.95] font-extralight tracking-[-0.05em] transition-transform duration-700 ease-expo pointer-fine:group-hover/row:translate-x-[1.5vw]">
                      {p.title}
                    </span>
                  </span>
                </span>

                <span className="type-meta col-start-2 flex flex-col gap-1 overflow-hidden text-ash md:col-start-auto md:pb-3">
                  <span data-row-reveal className="block text-bone">
                    {p.category}
                  </span>
                  <span data-row-reveal className="block">
                    {p.domain ?? "In progress"}
                  </span>
                </span>

                <span
                  aria-hidden
                  className="hidden self-center justify-self-end text-2xl font-extralight text-ash transition-all duration-500 ease-expo group-hover/row:-translate-y-1 group-hover/row:translate-x-1 group-hover/row:text-ice md:block"
                >
                  {p.url ? "↗" : "·"}
                </span>

                <span className="col-span-full hidden max-w-[48ch] text-base font-light text-ash md:col-start-2 md:col-end-3 md:block">
                  {p.description}
                </span>

                {/* Touch devices: no hover, so show the cover inline. */}
                {/* eslint-disable-next-line @next/next/no-img-element -- static export, no optimizer */}
                <img
                  src={p.image}
                  alt=""
                  loading="lazy"
                  className="col-span-full aspect-[16/10] w-full rounded-sm object-cover pointer-fine:hidden"
                />
              </Row>
            </li>
          );
        })}
      </ul>

      {hoverDevice && (
        <WorkReveal images={projects.map((p) => p.image)} store={store} active={inView} />
      )}
    </section>
  );
}
