/* =============================================================================
 *  STORE GRAND PRIX — ROULETTE CONFIGURATION
 * =============================================================================
 *
 *  This is the ONLY file you need to edit to change the roulette.
 *
 *  1. Edit the values below (items, colors, weights, ...).
 *  2. Commit and push to GitHub.
 *  3. GitHub Actions rebuilds the site; within ~1–2 minutes EVERY visitor
 *     sees exactly the same wheel. Nothing is stored in the browser.
 *
 *  ITEM FIELDS
 *  -----------
 *  id           Unique text id (no duplicates). Example: "flex"
 *  name         Text printed on the wheel. Keep it short (max ~12 characters).
 *  description  Shown in the winner pop-up.
 *  reward       Shown in the winner pop-up and in the prize list.
 *  color        Segment color, any CSS hex color. Example: "#E30613"
 *  textColor    (optional) Text color on the segment. If omitted, white or
 *               black is picked automatically for best contrast.
 *  weight       Relative chance of winning. An item with weight 4 is twice as
 *               likely as an item with weight 2. Must be greater than 0.
 *               Chance = weight / (sum of all enabled weights).
 *  enabled      false = removed from the wheel and can never be won.
 *  icon         (optional) An emoji shown on the segment, e.g. "🏆". Use null for none.
 *  image        (optional) An image file placed in the `public/items/` folder,
 *               written as "items/your-file.png". Use null for none.
 *               If both icon and image are set, the image is used.
 *  jackpot      (optional) true = winning this item triggers the extra-big jackpot
 *               celebration.
 * ============================================================================= */

export interface RouletteItem {
  id: string;
  name: string;
  description: string;
  reward: string;
  color: string;
  textColor?: string;
  weight: number;
  enabled: boolean;
  icon?: string | null;
  image?: string | null;
  jackpot?: boolean;
}

export interface RouletteConfig {
  /** Main heading shown under the logo (screen-reader title + page heading). */
  title: string;
  /** Short line shown under the title. */
  subtitle: string;
  /** All other texts on the page. */
  texts: {
    spinButton: string;
    spinButtonLabel: string;
    spinningLabel: string;
    keyboardHint: string;
    prizes: string;
    winner: string;
    jackpot: string;
    reward: string;
    spinAgain: string;
    close: string;
    soundOn: string;
    soundOff: string;
    fullscreenOn: string;
    fullscreenOff: string;
    noItems: string;
  };
  /** How long one spin lasts, in milliseconds (8000 = 8 seconds). */
  spinDuration: number;
  /** Minimum number of full turns per spin (more = faster-looking spin). */
  minFullRotations: number;
  /**
   * Chance (0–1) of a "bijna!" moment: the wheel stops just barely over the edge of the winning
   * segment, or just before the next one. 0.3 = about 1 in 3 spins; 0 = never.
   * Only changes where inside the winning segment it stops, never which prize wins.
   */
  nearMissChance: number;
  /** Zoom in slightly on the wheel while it spins. */
  zoomOnSpin: boolean;
  /**
   * "equal"    → every segment has the same size (weights stay hidden; classic game show).
   * "weighted" → segment size matches its winning chance.
   * The winner is ALWAYS chosen by weight, in both modes.
   */
  segmentSizing: "equal" | "weighted";
  /** Show the list of prizes next to / under the wheel. */
  showPrizeList: boolean;
  /** Show the winning chance (%) of each item in the prize list. */
  showProbabilities: boolean;
  /** Fire confetti when a winner is revealed. */
  confetti: boolean;
  sound: {
    /** Master switch: false = no sound at all and the sound button is hidden. */
    enabled: boolean;
    /** Volume from 0 to 1. */
    volume: number;
    /** Engine rev when the wheel starts. */
    spinStart: boolean;
    /** Clicking sound each time a segment passes the pointer. */
    ticks: boolean;
    /** Fanfare when the winner is revealed. */
    win: boolean;
  };
  /**
   * Hidden admin mode. Open it by clicking the logo 5 times quickly, pressing Ctrl+Shift+A,
   * or adding #admin to the URL. Changes made there only apply in that browser tab until the
   * page is refreshed; use "Kopieer config-code" in the admin to make them permanent here.
   */
  /** Mascot head with a white glow + credit in the bottom-left corner. */
  mascot: {
    enabled: boolean;
    /** Cut-out image (transparent background) in the `public/` folder. */
    image: string;
    credit: string;
  };
  admin: {
    enabled: boolean;
    /** PIN asked before opening the admin. Empty string = no PIN. Note: visible in the site's code. */
    pin: string;
  };
  items: RouletteItem[];
}

export const rouletteConfig: RouletteConfig = {
  title: "Store Grand Prix",
  subtitle: "Draai aan het rad en race naar de trofee!",

  texts: {
    spinButton: "DRAAI!",
    spinButtonLabel: "Draai aan het rad",
    spinningLabel: "Het rad draait…",
    keyboardHint: "of druk op de spatiebalk",
    prizes: "Prijzen",
    winner: "Winnaar!",
    jackpot: "JACKPOT!",
    reward: "Beloning",
    spinAgain: "Nog een keer",
    close: "Sluiten",
    soundOn: "Geluid aanzetten",
    soundOff: "Geluid uitzetten",
    fullscreenOn: "Volledig scherm",
    fullscreenOff: "Volledig scherm verlaten",
    noItems: "Er zijn geen prijzen actief. Zet in src/config/rouletteConfig.ts bij minstens één item enabled: true en een weight hoger dan 0.",
  },

  spinDuration: 8000,
  minFullRotations: 7,
  nearMissChance: 0.3,
  zoomOnSpin: true,
  segmentSizing: "equal",
  showPrizeList: true,
  showProbabilities: true,
  confetti: true,

  sound: {
    enabled: true,
    volume: 0.6,
    spinStart: true,
    ticks: true,
    win: true,
  },

  mascot: {
    enabled: true,
    image: "mascot-head.webp",
    credit: "made by Karen <3",
  },

  admin: {
    enabled: true,
    pin: "1234",
  },

  // ---------------------------------------------------------------------------
  //  ITEMS — placeholders, replace them with your own.
  //  Add an item: copy a { ... } block and change the values.
  //  Remove an item: delete its { ... } block (or set enabled: false).
  // ---------------------------------------------------------------------------
  items: [
    {
      id: "flex",
      name: "FLEX",
      description: "Win een FLEX-uitdaging voor je team.",
      reward: "Bonuspunten",
      color: "#E30613",
      weight: 3,
      enabled: true,
      icon: "💪",
      image: null,
    },
    {
      id: "fix",
      name: "FIX",
      description: "Win een FIX-uitdaging voor je team.",
      reward: "Bonuspunten",
      color: "#0A7CFF",
      weight: 2,
      enabled: true,
      icon: "🔧",
      image: null,
    },
    {
      id: "turbo",
      name: "TURBO",
      description: "Turbo boost! Je volgende uitdaging telt dubbel.",
      reward: "Dubbele punten",
      color: "#FFC81E",
      weight: 2,
      enabled: true,
      icon: "🚀",
      image: null,
    },
    {
      id: "pit-stop",
      name: "PIT STOP",
      description: "Neem een welverdiende pauze in de pitstraat.",
      reward: "Koffiepauze",
      color: "#1FB24A",
      weight: 3,
      enabled: true,
      icon: "☕",
      image: null,
    },
    {
      id: "jackpot",
      name: "JACKPOT",
      description: "De hoofdprijs van de Store Grand Prix!",
      reward: "Hoofdprijs",
      color: "#1C1C24",
      textColor: "#FFC81E",
      weight: 1,
      enabled: true,
      icon: "🏆",
      image: null,
      jackpot: true,
    },
    {
      id: "bonus-lap",
      name: "BONUSRONDE",
      description: "Een extra ronde: draai nog een keer!",
      reward: "Gratis extra draai",
      color: "#E30613",
      weight: 2,
      enabled: true,
      icon: "🏁",
      image: null,
    },
    {
      id: "team-prize",
      name: "TEAMPRIJS",
      description: "Het hele team wint een traktatie.",
      reward: "Teamtraktatie",
      color: "#0A7CFF",
      weight: 2,
      enabled: true,
      icon: "🎉",
      image: null,
    },
    {
      id: "gift-card",
      name: "CADEAUKAART",
      description: "Win een MediaMarkt-cadeaukaart.",
      reward: "Cadeaukaart",
      color: "#1FB24A",
      weight: 1,
      enabled: true,
      icon: "🎁",
      image: null,
    },
    {
      // Example of a disabled item: it is not shown and can never be won.
      id: "mystery",
      name: "MYSTERIE",
      description: "Een mysterieprijs.",
      reward: "???",
      color: "#8E24AA",
      weight: 1,
      enabled: false,
      icon: "❓",
      image: null,
    },
  ],
};
