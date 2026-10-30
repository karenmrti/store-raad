import type { Theme } from "../config/themes";

const PARTICLE_COUNT = 22;

/** Animated racing backdrop in the theme's colors. Pure CSS animations (cheap), disabled under prefers-reduced-motion. */
export function Background({ theme }: { theme: Theme }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 transition-[background] duration-700"
        style={{ background: `radial-gradient(ellipse at top, ${theme.background[0]} 0%, ${theme.background[1]} 42%, ${theme.background[2]} 100%)` }}
      />
      <div className="bg-checker absolute -inset-[20%] opacity-[0.045]" />
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 55%, color-mix(in srgb, ${theme.glow} 18%, transparent), transparent 55%)` }}
      />

      {/* Speed lines */}
      {[12, 28, 46, 63, 78, 91].map((top, i) => (
        <span
          key={top}
          className="speed-line absolute h-[3px] w-[30vw] rounded-full"
          style={{ top: `${top}%`, animationDelay: `${i * 1.3}s`, animationDuration: `${5 + (i % 3)}s` }}
        />
      ))}

      {/* Falling theme particles, spread evenly with fixed pseudo-random offsets */}
      {theme.particles.length > 0 &&
        Array.from({ length: PARTICLE_COUNT }, (_, i) => (
          <span
            key={`${theme.id}-${i}`}
            className="particle"
            style={{
              left: `${(i * 37 + 5) % 100}%`,
              fontSize: `${16 + ((i * 11) % 20)}px`,
              animationDuration: `${10 + ((i * 7) % 9)}s`,
              animationDelay: `-${(i * 13) % 19}s`,
            }}
          >
            {theme.particles[i % theme.particles.length]}
          </span>
        ))}

      {/* Checkered flag strip at the bottom edge */}
      <div className="bg-checker-strip absolute inset-x-0 bottom-0 h-4 opacity-40 sm:h-5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
