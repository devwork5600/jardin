// Single source for who is legally behind this site. Every legal page reads
// it, so the identity can't drift between mentions légales, CGV and the
// privacy policy.
export const LEGAL = {
  siteName: "Jardin Indoor",
  editorName: "Adrien Delagneau",
  contactEmail: "devwork5600@gmail.com",
  officialSiteUrl: "https://jardin-indoor.com",
  officialSiteLabel: "jardin-indoor.com",
  updated: "24 septembre 2026",
  host: {
    name: "Vercel Inc.",
    address: "340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis",
    url: "https://vercel.com",
  },
} as const;
