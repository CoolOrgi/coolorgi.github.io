"use client";

/**
 * Single place where GSAP plugins get registered.
 *
 * Every component imports gsap from HERE instead of from "gsap" directly. That
 * guarantees ScrollTrigger / SplitText are registered exactly once, before any
 * component tries to use them, and keeps plugin registration out of server code.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

  // Shared house easing so every motion on the site feels like the same "hand".
  gsap.defaults({ ease: "expo.out", duration: 1.2 });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
