import type { ProductBadge } from "../src/generated/prisma/client";
import scraped from "./catalog-scraped.json";
import { slugify } from "./slugify";

export { slugify };

export const OWN_BRAND = "Feuilles et épines";

export const TOP_CATEGORIES = [
  {
    name: "Cactus & succulentes",
    slug: "cactus-succulentes",
    description:
      "Cactus, succulentes, euphorbes et agaves : des plantes graphiques qui pardonnent les oublis.",
  },
  {
    name: "Bonsaï",
    slug: "bonsai",
    description:
      "Arbres miniatures d'intérieur et d'extérieur, pots et substrats pour bien démarrer.",
  },
  {
    name: "Plantes d'intérieur",
    slug: "plantes-interieur",
    description:
      "Feuillages, calathea, philodendron ou plantes increvables : de quoi habiller chaque pièce.",
  },
  {
    name: "Pots & jardinage",
    slug: "pots-jardinage",
    description:
      "Terre cuite, cache-pots, terreaux, sécateurs et arrosoirs pour prendre soin de vos plantes.",
  },
];

// parent slug, name, slug, intro (used when a product has no description)
export const SUBCATEGORIES: {
  parent: string;
  name: string;
  slug: string;
  intro: string;
}[] = [
  { parent: "cactus-succulentes", name: "Cactus", slug: "cactus", intro: "Un cactus facile à vivre, à installer en plein soleil." },
  { parent: "cactus-succulentes", name: "Succulentes", slug: "succulentes", intro: "Une succulente aux feuilles charnues, facile à multiplier." },
  { parent: "cactus-succulentes", name: "Euphorbes & agaves", slug: "euphorbes-agaves", intro: "Une plante graphique et architecturale." },
  { parent: "bonsai", name: "Bonsaï d'intérieur", slug: "bonsai-interieur", intro: "Un bonsaï adapté à la vie en appartement, à la lumière d'une fenêtre." },
  { parent: "bonsai", name: "Bonsaï d'extérieur", slug: "bonsai-exterieur", intro: "Un arbre rustique qui vit dehors et suit le rythme des saisons." },
  { parent: "bonsai", name: "Pots à bonsaï", slug: "pots-bonsai", intro: "Un pot à drainage percé, choisi pour la proportion avec l'arbre." },
  { parent: "bonsai", name: "Substrats & livres", slug: "substrats-bonsai", intro: "Pour bien démarrer avec les bonsaï." },
  { parent: "plantes-interieur", name: "Feuillages", slug: "feuillages", intro: "Un feuillage qui change une pièce." },
  { parent: "plantes-interieur", name: "Calathea", slug: "calatheas", intro: "Un feuillage rayé ou pourpre, pour les amateurs de motifs." },
  { parent: "plantes-interieur", name: "Philodendron & alocasia", slug: "philodendrons-alocasias", intro: "Une variété recherchée, pour les collectionneurs." },
  { parent: "plantes-interieur", name: "Faciles d'entretien", slug: "plantes-faciles", intro: "Une plante robuste, qui supporte les oublis d'arrosage." },
  { parent: "pots-jardinage", name: "Pots en terre cuite", slug: "pots-terre-cuite", intro: "De la vraie terre cuite, qui laisse respirer les racines." },
  { parent: "pots-jardinage", name: "Cache-pots", slug: "cache-pots", intro: "Pour habiller un pot de culture sans le remplacer." },
  { parent: "pots-jardinage", name: "Terreaux", slug: "terreaux", intro: "Un mélange prêt à l'emploi." },
  { parent: "pots-jardinage", name: "Sécateurs", slug: "outils-jardin", intro: "Un outil solide pour le quotidien du jardinier." },
  { parent: "pots-jardinage", name: "Arrosage", slug: "arrosage", intro: "Pour arroser juste ce qu'il faut, sans excès." },
];

// Default advice + specs per subcategory: living plants get care info.
export const SUB_CONSEIL: Record<string, string> = {
  cactus: "Plein soleil toute l'année. Arrosez toutes les 2 à 3 semaines l'été, presque plus l'hiver.",
  succulentes: "Lumière vive mais pas de soleil brûlant derrière une vitre. Évitez l'eau dans le cœur de la rosette.",
  "euphorbes-agaves": "Beaucoup de lumière et un arrosage rare. Attention à la sève des euphorbes, irritante pour la peau.",
  "bonsai-interieur": "Près d'une fenêtre lumineuse, à l'écart des radiateurs. Arrosez dès que la surface est sèche.",
  "bonsai-exterieur": "Dehors toute l'année, à mi-ombre l'été. Surtout ne le rentrez pas au chaud l'hiver.",
  feuillages: "Lumière vive sans soleil direct. Arrosez quand les 3 premiers centimètres de terre sont secs.",
  calatheas: "Humidité ambiante et lumière filtrée. Arrosez avec une eau peu calcaire.",
  "philodendrons-alocasias": "Humidité stable, lumière filtrée. Une plante qui demande un peu d'attention, mais qui la rend bien.",
  "plantes-faciles": "Elle s'adapte à presque tout. Un arrosage toutes les 2 semaines suffit.",
  arrosage: "Arrosez le matin et au pied de la plante plutôt que sur les feuilles.",
};

const SUCCULENT_CHARS = [
  ["Exposition", "Plein soleil"],
  ["Arrosage", "Rare (toutes les 2 à 3 semaines)"],
  ["Substrat", "Terreau cactées, très drainant"],
  ["Rusticité", "Intérieur ou véranda, mini 8 °C"],
];
const BONSAI_CHARS = [
  ["Exposition", "Lumineuse, sans soleil brûlant"],
  ["Arrosage", "Quand la surface est sèche"],
  ["Taille", "Au printemps et à l'automne"],
  ["Rempotage", "Tous les 2 à 3 ans"],
];
const FOLIAGE_CHARS = [
  ["Exposition", "Lumière vive indirecte"],
  ["Arrosage", "Modéré, terre légèrement humide"],
  ["Toxicité", "Toxique pour les animaux si ingérée"],
  ["Rusticité", "Intérieur, mini 12 °C"],
];

export const SUB_CHARS: Record<string, string[][]> = {
  cactus: SUCCULENT_CHARS,
  succulentes: SUCCULENT_CHARS,
  "euphorbes-agaves": SUCCULENT_CHARS,
  "bonsai-interieur": BONSAI_CHARS,
  feuillages: FOLIAGE_CHARS,
  calatheas: FOLIAGE_CHARS,
  "philodendrons-alocasias": FOLIAGE_CHARS,
  "plantes-faciles": FOLIAGE_CHARS,
};

// Real product data (name, price, description) collected once from a
// third-party shop for a personal, non-commercial portfolio demo. Photos are
// not in the repo: they live in public/products/<slug>/N.jpg (gitignored) and
// the seed links whatever is there; products without files get a placeholder.
export type CatalogRow = {
  sub: string;
  name: string;
  price: number;
  badge: ProductBadge | null;
  description: string;
};

export const PRODUCTS = scraped as CatalogRow[];

export const BRAND_NAMES = [OWN_BRAND];
export const PRODUCT_SLUGS = PRODUCTS.map((row) => slugify(row.name));
