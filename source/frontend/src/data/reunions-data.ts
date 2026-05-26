/**
 * Source of truth for the Reunions section.
 * Astro iterates this at build time to render slides and data-* attributes.
 * The JS client reads the data-* attributes at runtime for panel updates and animations.
 */

export interface ReunionPerson {
  name: string;
  /** Year the person owned the car (displayed in the tooltip) */
  legend: string;
  /** Chapter (1-based) this person belongs to. Multiple people can share a chapter. */
  chapter: number;
  /** SVG rect position as percentage of viewBox */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Short audio clip URL (mp3) — the person's audio quote */
  audio?: string;
  /** Text of the audio quote, shown in the expanded tooltip */
  quote?: string;
  /** Photo URL for the person modal (mobile). Shown inside the modal. */
  photo?: string;
  /** Force tooltip to appear on this side. Auto-detected from viewport if omitted. */
  tooltipSide?: "left" | "right";
  /** Vertical offset in px for manual fine-tuning of tooltip position. Default 0. */
  tooltipOffsetY?: number;
  /** Exact tooltip position (% of container: 0–100). When set, overrides side/offset. */
  tooltipLeft?: number;
  tooltipTop?: number;
  /** Custom max-height in px for this person's signature inside the tooltip. Defaults to 32. */
  signatureMaxHeight?: number;
}

export interface ReunionBeacon {
  x: string;
  y: string;
}

export interface Reunion {
  id: string;
  /** Location label for default (Spanish) locale */
  country: string;
  /** Same location in English (UI when locale is en) */
  countryEn: string;
  model: string;
  vin: string;
  date: string;
  chapters: number;
  video: {
    /** YouTube video ID for Spanish locale */
    es: string;
    /** YouTube video ID for English locale */
    en: string;
  };
  /** Background scene — always visible, base layer */
  bg: string;
  /** Background scene — always visible, base layer */
  bgDesktop: string;
  /** Cumulative person snapshots (PNGs), one per owner, in order */
  images: string[];
  /** Signature images (SVGs), one per owner, in order */
  signature: string[];
  /**
   * Mobile person modal image when a chapter has multiple people (e.g. duo photo).
   * Key = chapter number (1-based). Overrides individual `photo` in dual modal only.
   */
  modalPhotoByChapter?: Partial<Record<number, string>>;
  people: ReunionPerson[];
}

export const reunions: Reunion[] = [
  {
    id: "mexico",
    country: "Ciudad de México",
    countryEn: "Mexico City",
    model: "Porsche 911 T",
    vin: "VIN-9111100202",
    date: "01.10.25",
    chapters: 4,
    video: {
      es: "1LA1S272Ex8",
      en: "Qc3wHHaCqGI",
    },
    bg: "/images/reunions/mexico-porsche.png",
    bgDesktop: "/images/reunions/mexico-porsche.jpg",
    images: [
      "/images/reunions/mexico-owner-1.png",
      "/images/reunions/mexico-owner-4.png",
      "/images/reunions/mexico-owner-2.png",
      "/images/reunions/mexico-owner-3.png",
    ],
    people: [
      { name: "Miguel Esparza", tooltipLeft: 40, tooltipTop: 38, signatureMaxHeight: 40, legend: "", chapter: 1, x: 44, y: 22, width: 10, height: 54, audio: "/audios/mexico/chapter-1.mp3", quote: "", photo: "/images/cards/mexico/1.jpg" },
      { name: "Abdón Hernández", tooltipLeft: 88.5, tooltipTop: 33.5, signatureMaxHeight: 36, legend: "", chapter: 2, x: 79, y: 22, width: 11, height: 54, audio: "/audios/mexico/chapter-2.mp3", quote: "", photo: "/images/cards/mexico/2.jpg" },
      { name: "Matthieu Sion", tooltipLeft: 53, tooltipTop: 35, signatureMaxHeight: 28, legend: "", chapter: 3, x: 55, y: 22, width: 11, height: 54, audio: "/audios/mexico/chapter-3.mp3", quote: "", photo: "/images/cards/mexico/3.jpg" },
      { name: "Rodrigo Baz", tooltipLeft: 66, tooltipTop: 29, signatureMaxHeight: 32, legend: "", chapter: 4, x: 67, y: 22, width: 11, height: 54, audio: "/audios/mexico/chapter-4.mp3", quote: "", photo: "/images/cards/mexico/4.jpg" },
    ],
    signature: [
      "/images/reunions/signatures/mexico-signature-1-esparza.svg",
      "/images/reunions/signatures/mexico-signature-2-hernandez.svg",
      "/images/reunions/signatures/mexico-signature-3-sion.svg",
      "/images/reunions/signatures/mexico-signature-4-baz.svg",
    ]
  },
  {
    id: "colombia",
    country: "Bogotá",
    countryEn: "Bogota",
    model: "Porsche 356",
    vin: "VIN-82656",
    date: "14.10.25",
    chapters: 3,
    video: {
      es: "YU-V_-Y3eoM",
      en: "Ph4xRTR5mk8",
    },
    bg: "/images/reunions/colombia-porsche.png",
    bgDesktop: "/images/reunions/colombia-porsche.jpg",
    images: [
      "/images/reunions/colombia-owner-1.png",
      "/images/reunions/colombia-owner-2.png",
      "/images/reunions/colombia-owner-3.png",
      "/images/reunions/colombia-owner-4.png",
    ],
    people: [
      { name: "Olga Solano de Esguerra", tooltipLeft: 56, tooltipTop: 36, signatureMaxHeight: 32, legend: "", chapter: 1, x: 40, y: 22, width: 8, height: 54, audio: "/audios/colombia/chapter-1.mp3", quote: "", photo: "/images/cards/colombia/1.jpg" },
      { name: "Camilo Esguerra", tooltipLeft: 63, tooltipTop: 34, signatureMaxHeight: 72, legend: "", chapter: 2, x: 49, y: 22, width: 9, height: 54, audio: "/audios/colombia/chapter-2.mp3", quote: "", photo: "/images/cards/colombia/2.jpg" },
      { name: "Pablo Esguerra", tooltipLeft: 66, tooltipTop: 37.5, signatureMaxHeight: 28, legend: "", chapter: 3, x: 70, y: 22, width: 10, height: 54, audio: "/audios/colombia/chapter-3-i.mp3", quote: "", tooltipSide: "right", tooltipOffsetY: -40, photo: "/images/cards/colombia/4.jpg" },
      { name: "Federico Esguerra", tooltipLeft: 90, tooltipTop: 38.5, signatureMaxHeight: 40, legend: "", chapter: 3, x: 80, y: 22, width: 10, height: 54, audio: "/audios/colombia/chapter-3-ii.mp3", quote: "", tooltipSide: "left", tooltipOffsetY: 40, photo: "/images/cards/colombia/3.jpg" },
    ],
    signature: [
      "/images/reunions/signatures/colombia-signature-1-solano.svg",
      "/images/reunions/signatures/colombia-signature-2-esguerra.svg",
      "/images/reunions/signatures/colombia-signature-4-esguerra.svg",
      "/images/reunions/signatures/colombia-signature-3-esguerra.svg",
    ]
  },
  {
    id: "peru",
    country: "Lima",
    countryEn: "Lima",
    model: "Porsche 911 SC",
    vin: "VIN-WP0AB0910KS120785",
    date: "10.11.2025",
    chapters: 5,
    video: {
      es: "-_ym9-bstUU",
      en: "J52-I0iqB9E",
    },
    bg: "/images/reunions/peru-porsche.png",
    bgDesktop: "/images/reunions/peru-porsche.jpg",
    modalPhotoByChapter: {
      3: "/images/cards/peru/3-duo.jpg",
    },
    images: [
      "/images/reunions/peru-owner-1.png",
      "/images/reunions/peru-owner-2.png",
      "/images/reunions/peru-owner-3.png",
      "/images/reunions/peru-owner-4.png",
      "/images/reunions/peru-owner-5.png",
      "/images/reunions/peru-owner-6.png",
    ],
    people: [
      { name: "Luis \"Lucho\" Fischer", tooltipLeft: 51, tooltipTop: 35, signatureMaxHeight: 54, legend: "", chapter: 1, x: 37, y: 25, width: 9, height: 54, audio: "/audios/peru/chapter-1.mp3", quote: "", photo: "/images/cards/peru/1.jpg" },
      { name: "Francisco Sardón", tooltipLeft: 76.5, tooltipTop: 32, signatureMaxHeight: 30, legend: "", chapter: 2, x: 81, y: 25, width: 7, height: 54, audio: "/audios/peru/chapter-2.mp3", quote: "", photo: "/images/cards/peru/2.jpg" },
      { name: "Joseline Wong", tooltipLeft: 62, tooltipTop: 35, signatureMaxHeight: 32, legend: "", chapter: 3, x: 47, y: 25, width: 14, height: 54, audio: "/audios/peru/chapter-3.mp3", quote: "", photo: "/images/cards/peru/3.jpg" },
      { name: "Julio Espinosa", tooltipLeft: 45, tooltipTop: 36, signatureMaxHeight: 24, legend: "", chapter: 3, x: 47, y: 25, width: 14, height: 54, audio: "/audios/peru/chapter-3.mp3", quote: "", photo: "/images/cards/peru/4.jpg" },
      { name: "Victor Tejada", tooltipLeft: 84, tooltipTop: 37, signatureMaxHeight: 40, legend: "", chapter: 4, x: 89, y: 25, width: 8, height: 54, audio: "/audios/peru/chapter-4.mp3", quote: "", photo: "/images/cards/peru/5.jpg" },
      { name: "Miguel Rodrigo", tooltipLeft: 67, tooltipTop: 28, signatureMaxHeight: 28, legend: "", chapter: 5, x: 68, y: 25, width: 10, height: 54, audio: "/audios/peru/chapter-5.mp3", quote: "", photo: "/images/cards/peru/6.jpg" },
    ],
    signature: [
      "/images/reunions/signatures/peru-signature-1-fischer.svg",
      "/images/reunions/signatures/peru-signature-2-sardon.svg",
      "/images/reunions/signatures/peru-signature-3-wong.svg",
      "/images/reunions/signatures/peru-signature-4-espinosa.svg",
      "/images/reunions/signatures/peru-signature-5-tejada.svg",
      "/images/reunions/signatures/peru-signature-6-rodrigo.svg",
    ]
  },
];
