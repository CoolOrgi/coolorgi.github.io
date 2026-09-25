"use client";

/**
 * Contact + footer. Massive "Let's Talk." whose letters rise in one by one,
 * a magnetic call-to-action disc, socials, and the closing meta bar.
 */
import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { contact } from "@/content/site";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Magnetic } from "./Magnetic";

export function Contact() {
  const root = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);

  const cta = contact.email
    ? { href: `mailto:${contact.email}`, label: contact.email }
    : { href: contact.fallback.href, label: `@coolorgi on ${contact.fallback.label}` };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(title.current, { visibility: "visible" });
        SplitText.create(title.current, {
          type: "chars",
          mask: "chars",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.chars, {
              yPercent: 110,
              duration: 1.4,
              stagger: 0.035,
              scrollTrigger: { trigger: title.current, start: "top 85%" },
            }),
        });
        gsap.from("[data-cta]", {
          scale: 0,
          rotate: -30,
          duration: 1.4,
          ease: "elastic.out(1, 0.6)",
          scrollTrigger: { trigger: "[data-cta]", start: "top 95%" },
        });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(title.current, { visibility: "visible" });
      });
    },
    { scope: root },
  );

  return (
    <footer ref={root} id="contact" className="px-gutter pt-[14vh] pb-8">
      <SectionHeader index="04" title="Contact" aside="Available" />

      <div className="mt-[10vh] flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <h2
          ref={title}
          data-reveal
          className="text-[clamp(5.5rem,17vw,19rem)] leading-[0.85] font-thin tracking-[-0.06em]"
        >
          Let&rsquo;s
          <br />
          Talk<span className="text-ice">.</span>
        </h2>

        <Magnetic className="-m-8 self-start md:self-end">
          <a
            data-cta
            href={cta.href}
            target={contact.email ? undefined : "_blank"}
            rel="noreferrer"
            data-cursor="link"
            className="group relative flex size-[clamp(9rem,14vw,13rem)] items-center justify-center overflow-hidden rounded-full bg-ice text-void"
          >
            {/* Light fill rises from the bottom on hover. */}
            <span className="absolute inset-0 translate-y-full rounded-full bg-bone transition-transform duration-700 ease-expo group-hover:translate-y-0" />
            <span data-magnetic-inner className="type-meta relative text-center">
              Say hello
              <br />↗
            </span>
          </a>
        </Magnetic>
      </div>

      <div className="mt-[10vh] grid gap-8 border-t border-hairline pt-6 md:grid-cols-4">
        <div>
          <p className="type-meta text-ash">Reach me</p>
          <a
            href={cta.href}
            target={contact.email ? undefined : "_blank"}
            rel="noreferrer"
            className="mt-2 inline-block text-lg font-light underline decoration-hairline underline-offset-4 transition-colors hover:text-ice hover:decoration-ice"
          >
            {cta.label}
          </a>
        </div>
        <div className="hidden md:block" />
        <ul className="type-meta col-span-1 grid grid-cols-2 gap-y-2 md:col-span-2 md:grid-cols-4">
          {contact.socials.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-1 text-bone transition-colors hover:text-ice"
              >
                <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-500 ease-expo group-hover:bg-[length:100%_1px]">
                  {s.label}
                </span>
                <span className="text-ash transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="type-meta mt-[8vh] grid grid-cols-2 gap-4 text-ash md:grid-cols-4">
        <span>© {new Date().getFullYear()} Orgi</span>
        <span className="hidden md:block">Next.js · R3F · GSAP · Lenis</span>
        <span className="hidden md:block">Tirana, Albania</span>
        <button
          type="button"
          onClick={() => {
            const lenis = getLenis();
            if (lenis) lenis.scrollTo(0, { duration: 2 });
            else window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="text-right text-bone transition-colors hover:text-ice"
        >
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}
