import type { RouletteConfig, RouletteItem } from "../config/rouletteConfig";

/** A wheel segment: angles are in degrees, clockwise, measured from 12 o'clock. */
export interface Segment {
  item: RouletteItem;
  index: number;
  start: number;
  end: number;
  mid: number;
  probability: number;
}

export function getEnabledItems(config: RouletteConfig): RouletteItem[] {
  return config.items.filter((item) => item.enabled && Number.isFinite(item.weight) && item.weight > 0);
}

export function buildSegments(items: RouletteItem[], sizing: RouletteConfig["segmentSizing"]): Segment[] {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = 0;
  return items.map((item, index) => {
    const span = sizing === "weighted" ? (item.weight / totalWeight) * 360 : 360 / items.length;
    const segment: Segment = {
      item,
      index,
      start: cursor,
      end: cursor + span,
      mid: cursor + span / 2,
      probability: item.weight / totalWeight,
    };
    cursor += span;
    return segment;
  });
}

/** Uniform random number in [0, 1), using the crypto API when available. */
function random(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 2 ** 32;
  }
  return Math.random();
}

/** Picks a segment according to the item weights. */
export function pickWeighted(segments: Segment[]): Segment {
  const total = segments.reduce((sum, s) => sum + s.item.weight, 0);
  let roll = random() * total;
  for (const segment of segments) {
    roll -= segment.item.weight;
    if (roll < 0) return segment;
  }
  return segments[segments.length - 1];
}

const mod360 = (deg: number) => ((deg % 360) + 360) % 360;

/**
 * The wheel is rotated clockwise by `rotation` degrees and the pointer sits at 12 o'clock,
 * so the wheel angle under the pointer is (-rotation mod 360).
 */
export function segmentAtPointer(segments: Segment[], rotation: number): Segment {
  const angle = mod360(-rotation);
  return segments.find((s) => angle >= s.start && angle < s.end) ?? segments[segments.length - 1];
}

/**
 * Computes the final rotation that lands the pointer inside `target`. Normally it lands at a random
 * spot clear of the segment edges; with `nearMiss` it lands just inside one of the two edges, so
 * the wheel either barely crawls into the winner or barely stops before the next segment.
 */
export function computeTargetRotation(current: number, target: Segment, minFullRotations: number, nearMiss = false): number {
  const span = target.end - target.start;
  let landingAngle: number;
  if (nearMiss && span > 8) {
    // 1.5°–3.5° inside the edge: clearly on the winner, but only just.
    const inset = 1.5 + random() * 2;
    // The pointer enters a segment at its `end` edge and leaves at its `start` edge.
    landingAngle = random() < 0.5 ? target.end - inset : target.start + inset;
  } else {
    const margin = Math.min(span * 0.2, 6);
    landingAngle = target.start + margin + random() * (span - margin * 2);
  }
  const delta = mod360(-landingAngle - current);
  return current + minFullRotations * 360 + delta;
}

/**
 * Spin easing: a short, smooth acceleration followed by a long deceleration.
 * Velocity ramps up linearly over the first ACCEL fraction of the spin, then decays as (1-u)^2,
 * so speed is continuous everywhere and reaches exactly zero at the end.
 */
const ACCEL = 0.07;
const TOTAL_AREA = ACCEL / 2 + (1 - ACCEL) / 3;
export function spinEase(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < ACCEL) return (t * t) / (2 * ACCEL) / TOTAL_AREA;
  const u = (t - ACCEL) / (1 - ACCEL);
  return (ACCEL / 2 + ((1 - ACCEL) * (1 - (1 - u) ** 3)) / 3) / TOTAL_AREA;
}

/** Picks white or near-black text for the best contrast on `hex`. */
export function readableTextColor(hex: string): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return "#FFFFFF";
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  return lum > 0.45 ? "#1A0A0C" : "#FFFFFF";
}

/** Resolves an image path from the config (relative to `public/`) so it works on GitHub Pages. */
export function assetUrl(path: string): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  return import.meta.env.BASE_URL + path.replace(/^\.?\//, "");
}

/** Reports config mistakes in the browser console so they are easy to spot. */
export function validateConfig(config: RouletteConfig): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const item of config.items) {
    if (seen.has(item.id)) problems.push(`Duplicate item id "${item.id}".`);
    seen.add(item.id);
    if (item.enabled && !(Number.isFinite(item.weight) && item.weight > 0)) {
      problems.push(`Item "${item.id}" is enabled but has weight ${item.weight}; it is ignored (weight must be > 0).`);
    }
  }
  if (getEnabledItems(config).length === 0) problems.push("No enabled items with a weight above 0.");
  if (!(config.spinDuration > 0)) problems.push("spinDuration must be greater than 0.");
  return problems;
}
