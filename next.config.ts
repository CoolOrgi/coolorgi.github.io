import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a fully static site into /out so it can keep living on GitHub Pages
  // at orgi.is-a.dev — no server needed.
  output: "export",
  // GitHub Pages can't run the Next.js image optimizer.
  images: { unoptimized: true },
};

export default nextConfig;
