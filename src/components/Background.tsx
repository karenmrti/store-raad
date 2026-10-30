/** Animated racing backdrop. Pure CSS animations (cheap), disabled under prefers-reduced-motion. */
export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#E30613_0%,#9E0410_42%,#3D0207_100%)]" />
      <div className="bg-checker absolute -inset-[20%] opacity-[0.045]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(255,200,30,0.18),transparent_55%)]" />

      {/* Speed lines */}
      {[12, 28, 46, 63, 78, 91].map((top, i) => (
        <span
          key={top}
          className="speed-line absolute h-[3px] w-[30vw] rounded-full"
          style={{ top: `${top}%`, animationDelay: `${i * 1.3}s`, animationDuration: `${5 + (i % 3)}s` }}
        />
      ))}

      {/* Checkered flag strips at the bottom and top edges */}
      <div className="bg-checker-strip absolute inset-x-0 bottom-0 h-4 opacity-40 sm:h-5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
