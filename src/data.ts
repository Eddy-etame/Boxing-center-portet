/**
 * Single source of truth for Boxing Center Portet content.
 * Facts verified from boxingcenter.fr + the Portet-sur-Garonne flagship page.
 * Swap any placeholder (coachs photos, exact planning) when real assets arrive.
 */

export const SITE = {
  name: "Boxing Center Portet",
  group: "Boxing Center",
  city: "Portet-sur-Garonne",
  baseline: "Boxes pieds, poings, projections.",
  claim: "La salle phare. 800 m² dédiés au combat.",
  since: 2016,
  address: {
    street: "61 route d'Espagne",
    zip: "31120",
    city: "Portet-sur-Garonne",
    country: "FR",
    lat: 43.5236,
    lng: 1.4053,
  },
  phone: "05 62 24 46 82",
  phoneHref: "+33562244682",
  email: "boxingcenter31@gmail.com",
  hours: "Lun–Sam · 10h00 – 21h30",
  hoursData: [
    { d: "Lundi – Vendredi", h: "10:00 – 21:30" },
    { d: "Samedi", h: "10:00 – 21:30" },
    { d: "Dimanche", h: "Fermé" },
  ],
  federations: ["FFBoxe", "FFKMDA", "FMMAF"],
  surfaces: [
    { label: "Aire de boxe & combat", value: "500 m²" },
    { label: "Cross training", value: "400 m²" },
    { label: "Sacs lourds Metal Boxe", value: "24" },
    { label: "Ring olympique", value: "1" },
  ],
  social: {
    facebook: "https://www.facebook.com/BoxingCenterToulouse/",
    instagram: "https://www.instagram.com/boxingcenter_toulouse/",
    parent: "https://boxingcenter.fr/",
  },
};

export const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/activites/", label: "Activités" },
  { href: "/salles/", label: "Le club" },
  { href: "/coachs/", label: "Coachs" },
  { href: "/plannings/", label: "Planning" },
  { href: "/tarifs/", label: "Tarifs" },
  { href: "/contact/", label: "Contact" },
];

export type Discipline = {
  key: string;
  name: string;
  tag: string;
  desc: string;
};

export const DISCIPLINES: Discipline[] = [
  { key: "01", name: "Boxe Anglaise", tag: "Poings", desc: "Le noble art. Jeu de jambes, esquives, enchaînements. Le socle de tout boxeur." },
  { key: "02", name: "Boxe Thaïlandaise", tag: "Muay Thaï", desc: "Poings, pieds, genoux, coudes. La science des huit membres, intense et complète." },
  { key: "03", name: "Kick Boxing / K1", tag: "Pieds-poings", desc: "Vitesse et puissance. Le format pieds-poings le plus explosif du ring." },
  { key: "04", name: "MMA & Grappling", tag: "Cage", desc: "Frappe, lutte, sol. Sur tatami et panneaux MMA, du débutant au compétiteur." },
  { key: "05", name: "Cross Training", tag: "Prépa", desc: "Cages, barres olympiques, rameurs. La condition physique des combattants." },
  { key: "06", name: "Boxing Training", tag: "Cardio", desc: "Tout le geste technique, l'intensité du ring, sans les coups. Pour brûler et progresser." },
  { key: "07", name: "Lady Punch", tag: "Femmes", desc: "Des créneaux pensés pour les femmes. Énergie, confiance, technique." },
  { key: "08", name: "Boxe Éducative", tag: "Enfants", desc: "Pour les plus jeunes : coordination, respect, maîtrise de soi en toute sécurité." },
];

export const TARIFS = [
  { name: "Séance d'essai", price: "10€", unit: "la séance", note: "Sans engagement. Toutes disciplines.", feature: false },
  { name: "Mensuel", price: "36–44€", unit: "/ mois", note: "Accès illimité 7j/7. Tarif étudiant disponible.", feature: true },
  { name: "Annuel", price: "250–400€", unit: "/ an", note: "L'engagement des passionnés. Le meilleur rapport.", feature: false },
  { name: "Enfants", price: "280€", unit: "/ an", note: "Boxe éducative encadrée, créneaux dédiés.", feature: false },
];

export const STATS = [
  { value: "800", suffix: "m²", label: "d'espace combat" },
  { value: "24", suffix: "", label: "sacs lourds" },
  { value: "10+", suffix: "", label: "disciplines" },
  { value: "7", suffix: "j/7", label: "accès illimité" },
];

export const COACHS = [
  { name: "Coach — Boxe Anglaise", role: "Boxe Anglaise · Compétition", initials: "BA" },
  { name: "Coach — Muay Thaï", role: "Boxe Thaï · K1", initials: "MT" },
  { name: "Coach — MMA", role: "MMA · Grappling", initials: "MM" },
  { name: "Coach — Cross Training", role: "Prépa physique", initials: "CT" },
];

export const PLANNING = [
  { day: "Lundi", items: [["18:30", "Boxe Anglaise"], ["19:30", "Muay Thaï"], ["20:30", "Cross Training"]] },
  { day: "Mardi", items: [["12:30", "Boxing Training"], ["18:30", "MMA"], ["19:30", "Lady Punch"]] },
  { day: "Mercredi", items: [["14:00", "Boxe Éducative"], ["18:30", "Kick / K1"], ["19:30", "Boxe Anglaise"]] },
  { day: "Jeudi", items: [["12:30", "Cross Training"], ["18:30", "Muay Thaï"], ["19:30", "Grappling"]] },
  { day: "Vendredi", items: [["18:30", "Boxe Anglaise"], ["19:30", "Sparring"], ["20:30", "MMA"]] },
  { day: "Samedi", items: [["10:30", "Cross Training"], ["11:30", "Boxing Training"], ["12:30", "Open Mat"]] },
];

export const THEMES = [
  { id: "arena", label: "Arène", hint: "Cinématique · sombre" },
  { id: "heritage", label: "Héritage", hint: "Navy · bronze" },
  { id: "raw", label: "Brut", hint: "La salle · béton" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

/** Real photos of the club (public/img). Curated; grayscale→colour on reveal. */
export const GALLERY = [
  { src: "/img/gym-01.jpg", label: "La salle — fresques & sacs", span: "wide" },
  { src: "/img/gym-14.jpg", label: "Soirée de gala — le ring", span: "tall" },
  { src: "/img/gym-08.jpg", label: "Cross training", span: "" },
  { src: "/img/gym-05.jpg", label: "L'aire de combat", span: "" },
  { src: "/img/gym-11.jpg", label: "Sacs lourds Metal Boxe", span: "" },
  { src: "/img/gym-17.jpg", label: "Tatami & panneaux MMA", span: "wide" },
];

/** Raw club footage (public/media) — muted ambient loops, never the AI ads. */
export const CLIPS = [
  { src: "/media/clip-1.mp4", label: "À l'entraînement" },
  { src: "/media/clip-2.mp4", label: "Sur le ring" },
  { src: "/media/clip-3.mp4", label: "Cross training" },
];
