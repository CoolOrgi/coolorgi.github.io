import type Lenis from "lenis";

/** The global Lenis instance (null before mount or with reduced motion). */
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => void (instance = l);
export const getLenis = () => instance;
