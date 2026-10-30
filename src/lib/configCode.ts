import type { RouletteConfig, RouletteItem } from "../config/rouletteConfig";

/** Turns a config into TypeScript that can replace the object in src/config/rouletteConfig.ts. */
export function toConfigCode(config: RouletteConfig): string {
  const body = JSON.stringify(config, null, 2).replace(/^(\s*)"([A-Za-z_$][\w$]*)":/gm, "$1$2:");
  return `export const rouletteConfig: RouletteConfig = ${body};\n`;
}

/**
 * Reads pasted config code — the exported code, plain JSON, or the object copied straight from
 * rouletteConfig.ts (unquoted keys, comments, single quotes, trailing commas) — WITHOUT running it.
 */
export function parseConfigCode(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Geen config gevonden: de code moet tussen { en } staan.");
  const src = text.slice(start, end + 1);

  let out = "";
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const close = src.indexOf("*/", i + 2);
      i = close < 0 ? src.length : close + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      let s = "";
      i++;
      while (i < src.length && src[i] !== c) {
        if (src[i] === "\\") {
          s += src[i + 1] === "'" ? "'" : src[i] + src[i + 1];
          i += 2;
        } else {
          s += src[i] === '"' ? '\\"' : src[i] === "\n" ? "\\n" : src[i];
          i++;
        }
      }
      i++;
      out += `"${s}"`;
      continue;
    }
    if (/[0-9]/.test(c) || (c === "-" && /[0-9.]/.test(src[i + 1] ?? ""))) {
      let n = c;
      i++;
      while (i < src.length && /[0-9.eE+-]/.test(src[i])) n += src[i++];
      out += n;
      continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let id = "";
      while (i < src.length && /[\w$]/.test(src[i])) id += src[i++];
      out += id === "true" || id === "false" || id === "null" ? id : id === "undefined" ? "null" : `"${id}"`;
      continue;
    }
    out += c;
    i++;
  }
  out = out.replace(/,(\s*[}\]])/g, "$1");

  try {
    return JSON.parse(out);
  } catch {
    throw new Error("De code kon niet gelezen worden. Plak de volledige config-code, van de eerste { tot de laatste }.");
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Fills in anything missing or of the wrong type from `defaults`, so older or partial templates still work. */
function mergeDefaults<T>(defaults: T, value: unknown): T {
  if (isObject(defaults)) {
    const source = isObject(value) ? value : {};
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(defaults)) result[key] = mergeDefaults((defaults as Record<string, unknown>)[key], source[key]);
    return result as T;
  }
  if (defaults === null) return (value === null || typeof value === "string" ? value : defaults) as T;
  return (typeof value === typeof defaults ? value : defaults) as T;
}

const FALLBACK_COLORS = ["#E30613", "#0A7CFF", "#FFC81E", "#1FB24A", "#1C1C24", "#8E24AA"];

function toItem(raw: unknown, index: number): RouletteItem | null {
  if (!isObject(raw) || typeof raw.name !== "string" || !raw.name.trim()) return null;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const strOrNull = (v: unknown) => (typeof v === "string" && v ? v : null);
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : `item-${index + 1}`,
    name: raw.name,
    description: str(raw.description),
    reward: str(raw.reward),
    color: typeof raw.color === "string" && raw.color ? raw.color : FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    ...(typeof raw.textColor === "string" && raw.textColor ? { textColor: raw.textColor } : {}),
    weight: typeof raw.weight === "number" && raw.weight >= 0 ? raw.weight : 1,
    enabled: raw.enabled !== false,
    icon: strOrNull(raw.icon),
    image: strOrNull(raw.image),
    jackpot: raw.jackpot === true,
  };
}

/** Parses pasted code into a complete, valid config. Throws an Error with a Dutch message if it can't. */
export function importConfig(text: string, defaults: RouletteConfig): RouletteConfig {
  const raw = parseConfigCode(text);
  if (!isObject(raw)) throw new Error("De code bevat geen config-object.");
  if (!Array.isArray(raw.items)) throw new Error('De config mist de lijst met items ("items: [ … ]").');

  const config = mergeDefaults(defaults, raw);
  const items = raw.items.map(toItem).filter((item): item is RouletteItem => item !== null);
  if (items.length === 0) throw new Error("Er staan geen geldige items in de config (elk item heeft minstens een naam nodig).");

  // Make ids unique so the wheel never mixes two items up.
  const seen = new Set<string>();
  for (const item of items) {
    let id = item.id;
    for (let n = 2; seen.has(id); n++) id = `${item.id}-${n}`;
    item.id = id;
    seen.add(id);
  }
  if (!items.some((i) => i.enabled && i.weight > 0)) throw new Error("Geen enkel item staat op actief met een kans hoger dan 0.");

  return { ...config, items };
}
