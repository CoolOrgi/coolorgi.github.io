/**
 * All copy, links and project data for the site. Edit here, not in components.
 */

export type Project = {
  slug: string;
  title: string;
  /** Short line under the title */
  description: string;
  category: string;
  /** Shown in the row meta; also the link label */
  domain?: string;
  url?: string;
  /** 16:10 cover, used by the hover shader and the mobile thumbnail */
  image: string;
};

export const projects: Project[] = [
  {
    slug: "neomotion",
    title: "NeoMotion",
    description:
      "The future of transport — its benefits, and what comes next for the world.",
    category: "Concept · Web",
    domain: "neomotion.dev",
    url: "https://neomotion.dev",
    image: "/media/work/neomotion.jpg",
  },
  {
    slug: "ai-albania",
    title: "AI Albania",
    description:
      "A digital language bridge preserving Albanian language and culture through AI.",
    category: "Platform · AI",
    domain: "aialbania.site",
    url: "https://aialbania.site",
    image: "/media/work/aialbania.jpg",
  },
  {
    slug: "drita-studios",
    title: "Drita Studios",
    description: "Studio identity and web presence. Drita — Albanian for “light”.",
    category: "Studio · Identity",
    image: "/media/work/drita.jpg",
  },
];

export const manifesto =
  "I’m Orgi — a developer from Albania who treats the browser like a studio. I design and build websites that feel less like pages and more like places: fast, physical, and obsessively detailed.";

/** Words in the manifesto that get the ice accent once revealed */
export const manifestoAccents = ["places:", "studio."];

export const facts = [
  { label: "Focus", value: "Creative front-end, WebGL & motion" },
  { label: "Stack", value: "React · Next.js · Python" },
  { label: "Status", value: "Open to projects & collaborations" },
];

export const marquee = {
  top: ["React", "Next.js", "TypeScript", "GSAP", "WebGL", "Three.js"],
  bottom: ["Python", "Flask", "Django", "SQLite", "MongoDB", "MySQL"],
};

export const capabilities = [
  {
    title: "Front-end",
    items: ["HTML & CSS", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS"],
  },
  {
    title: "Motion & 3D",
    items: ["GSAP", "ScrollTrigger", "Lenis", "Three.js", "React Three Fiber", "GLSL shaders"],
  },
  {
    title: "Back-end & Data",
    items: ["Python", "Flask", "Django", "SQLite", "MongoDB", "MySQL"],
  },
  {
    title: "Tools & Craft",
    items: ["Git & GitHub", "VS Code", "UI/UX principles", "Responsive design", "Performance", "Technical writing"],
  },
];

export const contact = {
  /** Set to an address to make the big magnetic button a mailto: link. */
  email: null as string | null,
  /** Where the button goes while `email` is null */
  fallback: { label: "Instagram", href: "https://www.instagram.com/coolorgi" },
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/coolorgi" },
    { label: "GitHub", href: "https://github.com/CoolOrgi" },
    { label: "X / Twitter", href: "https://x.com/coolorgi" },
    { label: "Facebook", href: "https://www.facebook.com/orgesibi633/" },
  ],
};

export const nav = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Contact", href: "#contact" },
];
