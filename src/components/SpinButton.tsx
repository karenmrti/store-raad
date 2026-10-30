import { motion } from "framer-motion";

interface SpinButtonProps {
  label: string;
  ariaLabel: string;
  spinningLabel: string;
  hint: string;
  spinning: boolean;
  onSpin: () => void;
}

export function SpinButton({ label, ariaLabel, spinningLabel, hint, spinning, onSpin }: SpinButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onSpin}
      disabled={spinning}
      className="spin-button group relative isolate rounded-full px-12 py-4 font-display text-4xl uppercase tracking-wide text-[color:var(--btn-text)] outline-none focus-visible:ring-4 focus-visible:ring-mm-yellow focus-visible:ring-offset-4 focus-visible:ring-offset-mm-red-dark disabled:cursor-not-allowed sm:px-16 sm:py-5 sm:text-5xl"
      whileHover={spinning ? undefined : { scale: 1.06, y: -2 }}
      whileTap={spinning ? undefined : { scale: 0.94, y: 3 }}
      animate={spinning ? { scale: 0.96, opacity: 0.75 } : { scale: [1, 1.04, 1], opacity: 1 }}
      transition={spinning ? { duration: 0.2 } : { scale: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } }}
      aria-label={spinning ? spinningLabel : ariaLabel}
      title={hint}
    >
      <span className="relative z-10 drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]">{spinning ? "..." : label}</span>
      <span className="spin-button-shine pointer-events-none absolute inset-x-[10%] top-[8%] h-[38%] rounded-full" aria-hidden />
    </motion.button>
  );
}
