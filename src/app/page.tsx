import { Hero } from "@/components/hero/Hero";

export default function Home() {
  return (
    <main>
      <Hero />

      {/* Placeholder until the Manifesto section is built — gives the hero
          something to scroll into so the scroll-linked effects can be tested. */}
      <section id="about" className="flex min-h-svh items-center px-gutter">
        <p className="type-meta text-ash">(02) — About / Manifesto · next</p>
      </section>
    </main>
  );
}
