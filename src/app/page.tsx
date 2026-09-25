import { Hero } from "@/components/hero/Hero";
import { Manifesto } from "@/components/manifesto/Manifesto";
import { Work } from "@/components/work/Work";
import { Capabilities } from "@/components/capabilities/Capabilities";
import { Contact } from "@/components/contact/Contact";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Manifesto />
        <Work />
        <Capabilities />
      </main>
      <Contact />
    </>
  );
}
