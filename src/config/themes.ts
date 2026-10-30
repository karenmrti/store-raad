/* =============================================================================
 *  THEMES
 * =============================================================================
 *
 *  Pick the active theme with `theme` in rouletteConfig.ts (or in the admin).
 *
 *  logo            Image in the `public/` folder (e.g. "logos/kerst.png") or a full URL.
 *                  null = the standard Store Grand Prix logo.
 *  logoDecoration  Emoji placed on the corner of the logo (only used with the standard logo).
 *  background      Three colors for the page background, from the top to the edges.
 *  button          Three colors for the big spin button: light, middle, dark.
 *  buttonText      Text color on the spin button.
 *  glow            Color of the glow around the wheel and the spin button.
 *  confetti        Confetti colors when someone wins.
 *  particles       Emoji or short texts that slowly fall over the background. [] = none.
 *  subtitle        Subtitle filled in when this theme is chosen in the admin.
 * ============================================================================= */

export interface Theme {
  id: string;
  name: string;
  logo: string | null;
  logoDecoration: string | null;
  background: [string, string, string];
  button: [string, string, string];
  buttonText: string;
  glow: string;
  confetti: string[];
  particles: string[];
  subtitle: string;
}

export const themes: Theme[] = [
  {
    id: "standaard",
    name: "Standaard",
    logo: null,
    logoDecoration: null,
    background: ["#E30613", "#9E0410", "#3D0207"],
    button: ["#FF3B47", "#E30613", "#A5040E"],
    buttonText: "#FFFFFF",
    glow: "#FFC81E",
    confetti: ["#E30613", "#0A7CFF", "#1FB24A", "#FFC81E", "#FFFFFF"],
    particles: [],
    subtitle: "Draai aan het rad en race naar de trofee!",
  },
  {
    id: "kerst",
    name: "Kerst",
    logo: null,
    logoDecoration: "🎅",
    background: ["#1E8A47", "#0E5A2C", "#052A14"],
    button: ["#FF3B47", "#E30613", "#A5040E"],
    buttonText: "#FFFFFF",
    glow: "#FFF3C4",
    confetti: ["#E30613", "#1FB24A", "#FFFFFF", "#FFD84D"],
    particles: ["❄", "❅", "❆", "✦"],
    subtitle: "Draai aan het rad en win een kerstcadeau! 🎄",
  },
  {
    id: "btw-dagen",
    name: "BTW-dagen",
    logo: null,
    logoDecoration: "🏷️",
    background: ["#FF8A00", "#E30613", "#6E0208"],
    button: ["#FFE066", "#FFC81E", "#C98A00"],
    buttonText: "#6E0208",
    glow: "#FFE066",
    confetti: ["#FFC81E", "#FFFFFF", "#E30613", "#FF8A00"],
    particles: ["%", "%", "💸", "🏷️"],
    subtitle: "BTW-dagen: draai en scoor je voordeel!",
  },
  {
    id: "black-friday",
    name: "Black Friday",
    logo: null,
    logoDecoration: "🛍️",
    background: ["#3A3A3A", "#151515", "#000000"],
    button: ["#FF3B47", "#E30613", "#A5040E"],
    buttonText: "#FFFFFF",
    glow: "#E30613",
    confetti: ["#FFFFFF", "#E30613", "#9A9A9A", "#FFC81E"],
    particles: ["%", "🖤", "★"],
    subtitle: "Black Friday: draai voor de beste deal!",
  },
  {
    id: "zomer",
    name: "Zomer",
    logo: null,
    logoDecoration: "🕶️",
    background: ["#4FC3F7", "#0288D1", "#063F6B"],
    button: ["#FFB547", "#FF7A00", "#C2410C"],
    buttonText: "#FFFFFF",
    glow: "#FFE066",
    confetti: ["#FFE066", "#FF7A00", "#4FC3F7", "#FFFFFF", "#1FB24A"],
    particles: ["☀️", "🌴", "🏖️"],
    subtitle: "Zomer Grand Prix: draai en win!",
  },
  {
    id: "halloween",
    name: "Halloween",
    logo: null,
    logoDecoration: "🎃",
    background: ["#8B3FD9", "#4C1D95", "#160829"],
    button: ["#FFB547", "#FF7A00", "#C2410C"],
    buttonText: "#FFFFFF",
    glow: "#FF7A00",
    confetti: ["#FF7A00", "#8B3FD9", "#1FB24A", "#000000", "#FFFFFF"],
    particles: ["🎃", "👻", "🦇"],
    subtitle: "Draai als je durft! 👻",
  },
];

export function getTheme(id: string | undefined): Theme {
  return themes.find((t) => t.id === id) ?? themes[0];
}
