import { memo } from "react";
import { motion, type MotionValue } from "framer-motion";
import { assetUrl, readableTextColor, type Segment } from "../lib/wheel";

const R = 500; // segment radius in the wheel's own SVG units
const HUB = 0.2 * R;
const BULBS = 24;

function polar(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: radius * Math.sin(a), y: -radius * Math.cos(a) };
}

function segmentPath(start: number, end: number) {
  if (end - start >= 359.999) {
    return `M 0 ${-R} A ${R} ${R} 0 1 1 0 ${R} A ${R} ${R} 0 1 1 0 ${-R} Z`;
  }
  const p0 = polar(start, R);
  const p1 = polar(end, R);
  const large = end - start > 180 ? 1 : 0;
  return `M 0 0 L ${p0.x} ${p0.y} A ${R} ${R} 0 ${large} 1 ${p1.x} ${p1.y} Z`;
}

const CHAR_WIDTH = 0.64; // average glyph width of the display font (incl. outline), in em

/** Chooses one line, or two lines split at a space, whichever allows the larger font. */
function layoutLabel(name: string, length: number, chord: number) {
  const fit = (lines: string[]) =>
    Math.min(
      64,
      (chord * 0.5) / lines.length,
      length / (Math.max(...lines.map((l) => l.length), 3) * CHAR_WIDTH),
    );
  let best = { lines: [name], fontSize: fit([name]) };
  const words = name.split(" ");
  for (let i = 1; i < words.length; i++) {
    const lines = [words.slice(0, i).join(" "), words.slice(i).join(" ")];
    const fontSize = fit(lines);
    if (fontSize > best.fontSize * 1.1) best = { lines, fontSize };
  }
  return { lines: best.lines, fontSize: Math.max(12, best.fontSize) };
}

const SegmentGraphic = memo(function SegmentGraphic({ segment, total }: { segment: Segment; total: number }) {
  const { item, start, end, mid } = segment;
  const span = end - start;
  const media = item.image ? "image" : item.icon ? "icon" : null;
  const textColor = item.textColor ?? readableTextColor(item.color);

  // Text runs along the radius; the font shrinks to fit both the length and the segment width.
  const textOuter = media ? 0.7 * R : 0.9 * R;
  const textInner = 0.3 * R; // clear of the center hub
  const textMidRadius = (textOuter + textInner) / 2;
  const chord = 2 * textMidRadius * Math.sin(((Math.min(span, 180) / 2) * Math.PI) / 180);
  const { lines, fontSize } = layoutLabel(item.name, textOuter - textInner, chord);
  const lineHeight = fontSize * 0.95;

  // Flip text on the left half of the wheel so it never reads upside-down when the wheel stops.
  const flip = total > 1 && mid > 180 && mid < 360;
  const textRotation = flip ? mid + 90 : mid - 90;

  const mediaRadius = 0.83 * R;
  const mediaSize = Math.min(84, 2 * mediaRadius * Math.sin(((Math.min(span, 120) / 2) * Math.PI) / 180) * 0.5);

  return (
    <g>
      <path d={segmentPath(start, end)} fill={item.color} stroke="#FFFFFF" strokeWidth={total > 1 ? 5 : 0} />
      <g transform={`rotate(${textRotation})`}>
        <text
          x={flip ? -textOuter : textOuter}
          y={0}
          textAnchor={flip ? "start" : "end"}
          dominantBaseline="central"
          fill={textColor}
          fontSize={fontSize}
          className="font-display"
          style={{ paintOrder: "stroke", letterSpacing: "0.02em" }}
          stroke="rgba(0,0,0,0.35)"
          strokeWidth={fontSize * 0.12}
          strokeLinejoin="round"
        >
          {lines.map((line, i) => (
            <tspan key={i} x={flip ? -textOuter : textOuter} y={(i - (lines.length - 1) / 2) * lineHeight}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
      {media && (
        <g transform={`rotate(${mid}) translate(0 ${-mediaRadius})`}>
          {media === "image" ? (
            <>
              <clipPath id={`segment-clip-${segment.index}`}>
                <circle r={mediaSize / 2} />
              </clipPath>
              <circle r={mediaSize / 2 + 5} fill="#FFFFFF" />
              <image
                href={assetUrl(item.image!)}
                x={-mediaSize / 2}
                y={-mediaSize / 2}
                width={mediaSize}
                height={mediaSize}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#segment-clip-${segment.index})`}
              />
            </>
          ) : (
            <g>
              <circle r={mediaSize / 2 + 5} fill="#FFFFFF" fillOpacity={0.92} stroke="rgba(0,0,0,0.18)" strokeWidth={3} />
              <text textAnchor="middle" dominantBaseline="central" y={mediaSize * 0.04} fontSize={mediaSize * 0.62}>
                {item.icon}
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
});

interface WheelProps {
  segments: Segment[];
  rotation: MotionValue<number>;
  pointerKick: MotionValue<number>;
  spinning: boolean;
  winnerIndex: number | null;
}

export function Wheel({ segments, rotation, pointerKick, spinning, winnerIndex }: WheelProps) {
  const winner = winnerIndex !== null ? segments[winnerIndex] : null;

  return (
    <div className="relative aspect-square w-full select-none">
      {/* Glow behind the wheel */}
      <div
        className={`absolute -inset-[6%] rounded-full blur-2xl transition-opacity duration-700 ${
          spinning ? "opacity-90" : "opacity-60"
        }`}
        style={{ background: "radial-gradient(circle, rgba(255,200,30,0.65) 0%, rgba(227,6,19,0.35) 45%, transparent 70%)" }}
        aria-hidden
      />

      {/* Static rim with chasing lights */}
      <svg viewBox="0 0 1000 1000" className="absolute inset-0 h-full w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)]" aria-hidden>
        <defs>
          <linearGradient id="rim-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF1A8" />
            <stop offset="35%" stopColor="#F5B301" />
            <stop offset="65%" stopColor="#B87900" />
            <stop offset="100%" stopColor="#FFE07A" />
          </linearGradient>
          <radialGradient id="bulb" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#FFF4B0" />
            <stop offset="100%" stopColor="#FFB800" />
          </radialGradient>
        </defs>
        <circle cx="500" cy="500" r="497" fill="url(#rim-gold)" />
        <circle cx="500" cy="500" r="478" fill="#1A0507" />
        <circle cx="500" cy="500" r="446" fill="#FFFFFF" />
        {Array.from({ length: BULBS }, (_, i) => {
          const p = polar((i * 360) / BULBS, 462);
          return (
            <circle
              key={i}
              cx={500 + p.x}
              cy={500 + p.y}
              r="10"
              fill="url(#bulb)"
              className={`bulb ${i % 2 ? "bulb-b" : "bulb-a"} ${spinning ? "bulb-fast" : ""}`}
            />
          );
        })}
      </svg>

      {/* Rotating segments */}
      <motion.div className="absolute inset-[6%] rounded-full" style={{ rotate: rotation }}>
        <svg viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`} className="h-full w-full overflow-visible" role="img" aria-label="Prize wheel">
          <defs>
            <radialGradient id="gloss" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
              <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.04" />
              <stop offset="88%" stopColor="#000000" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.38" />
            </radialGradient>
          </defs>
          {segments.map((segment) => (
            <SegmentGraphic key={segment.item.id} segment={segment} total={segments.length} />
          ))}
          <circle r={R} fill="url(#gloss)" pointerEvents="none" />
          {winner && !spinning && (
            <motion.path
              d={segmentPath(winner.start, winner.end)}
              fill="#FFFFFF"
              stroke="#FFE45C"
              strokeWidth={14}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0.08, 0.35, 0.08] }}
              transition={{ duration: 1.8, repeat: Infinity, repeatType: "mirror" }}
              pointerEvents="none"
            />
          )}
        </svg>
      </motion.div>

      {/* Hub */}
      <svg viewBox="0 0 1000 1000" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="checker" width="36" height="36" patternUnits="userSpaceOnUse">
            <rect width="36" height="36" fill="#FFFFFF" />
            <rect width="18" height="18" fill="#111111" />
            <rect x="18" y="18" width="18" height="18" fill="#111111" />
          </pattern>
          <radialGradient id="hub-shine" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
          </radialGradient>
        </defs>
        <circle cx="500" cy="500" r={HUB * 0.88 + 26} fill="url(#rim-gold)" style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,.5))" }} />
        <circle cx="500" cy="500" r={HUB * 0.88} fill="url(#checker)" />
        <circle cx="500" cy="500" r={HUB * 0.45} fill="#E30613" stroke="#FFFFFF" strokeWidth="8" />
        <circle cx="500" cy="500" r={HUB * 0.88} fill="url(#hub-shine)" />
      </svg>

      {/* Pointer: the outer div centers it; the inner one rotates (Framer Motion owns its transform). */}
      <div className="absolute left-1/2 top-[-3.5%] z-10 w-[12%] -translate-x-1/2" aria-hidden>
        <motion.div style={{ rotate: pointerKick, transformOrigin: "50% 22%" }}>
          <svg viewBox="0 0 120 170" className="w-full drop-shadow-[0_6px_6px_rgba(0,0,0,0.55)]">
            <defs>
              <linearGradient id="pointer-red" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FF4B55" />
                <stop offset="55%" stopColor="#E30613" />
                <stop offset="100%" stopColor="#8E030C" />
              </linearGradient>
            </defs>
            <path d="M60 165 L12 48 A50 50 0 1 1 108 48 Z" fill="url(#pointer-red)" stroke="#FFFFFF" strokeWidth="8" strokeLinejoin="round" />
            <circle cx="60" cy="38" r="20" fill="url(#rim-gold)" stroke="#7A4E00" strokeWidth="3" />
            <ellipse cx="44" cy="28" rx="10" ry="6" fill="#FFFFFF" opacity="0.55" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
