/**
 * Tiny coordination layer between the Loader and everything that should wait
 * for it (hero intro, scroll unlock). Plain module state — no React context —
 * because GSAP code outside the render cycle needs to read it too.
 */

type Listener = () => void;

let introDone = false;
const introListeners = new Set<Listener>();

export const isIntroDone = () => introDone;

/** Runs `cb` once the loader has lifted (immediately if it already has). Returns an unsubscribe. */
export function onIntroDone(cb: Listener) {
  if (introDone) {
    cb();
    return () => {};
  }
  introListeners.add(cb);
  return () => void introListeners.delete(cb);
}

export function markIntroDone() {
  if (introDone) return;
  introDone = true;
  document.documentElement.classList.remove("is-loading");
  introListeners.forEach((cb) => cb());
  introListeners.clear();
}

/* The hero's WebGL canvas reports when its first frame is on screen, so the
   loader can keep covering it until then instead of revealing a blank canvas. */

let resolveScene: () => void;
export const sceneReady = new Promise<void>((resolve) => (resolveScene = resolve));
export const markSceneReady = () => resolveScene();
