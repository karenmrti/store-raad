import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RouletteConfig, RouletteItem } from "../config/rouletteConfig";
import { assetUrl, readableTextColor } from "../lib/wheel";

/**
 * Font size for the prize name so its longest word always fits the badge: up to 3rem, scaled down
 * by word length and by the space left in the pop-up (screen width minus paddings and icon).
 */
function nameFontSize(item: RouletteItem) {
  const longestWord = Math.max(...item.name.split(/\s+/).map((w) => w.length));
  // Long multi-word names wrap onto at most ~3 lines instead of becoming a tall block.
  const charsPerLine = Math.max(3, longestWord, Math.ceil(item.name.length / 3));
  const reserved = item.image || item.icon ? "12.5rem" : "8.5rem";
  return `min(3rem, calc((min(100vw, 28rem) - ${reserved}) / ${(charsPerLine * 0.68).toFixed(2)}))`;
}

interface WinnerModalProps {
  winner: RouletteItem | null;
  texts: RouletteConfig["texts"];
  onClose: () => void;
  onSpinAgain: () => void;
}

export function WinnerModal({ winner, texts, onClose, onSpinAgain }: WinnerModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!winner) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [winner, onClose]);

  return (
    <AnimatePresence>
      {winner && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="winner-title"
        >
          <motion.div
            className={`relative w-full max-w-md overflow-hidden rounded-[2rem] border-4 bg-gradient-to-b px-6 pb-7 pt-14 text-center sm:px-8 ${
              winner.jackpot
                ? "jackpot-card from-[#4A2A00] via-[#2A0A0E] to-[#14070A]"
                : "border-white from-[#2A0A0E] to-[#14070A] shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
            }`}
            initial={{ scale: 0.4, y: 80, rotate: -6 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.7, y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-checker-strip absolute inset-x-0 top-0 h-5 opacity-90" aria-hidden />
            <div
              className="winner-rays pointer-events-none absolute left-1/2 top-[38%] h-[160%] w-[160%] opacity-30"
              aria-hidden
            />

            <div className="relative mx-auto mb-2 flex items-end justify-center gap-2" aria-hidden>
              {(winner.jackpot ? ["text-5xl", "text-8xl", "text-5xl"] : ["text-7xl"]).map((size, i) => (
                <motion.span
                  key={i}
                  className={`${size} drop-shadow-[0_8px_10px_rgba(0,0,0,0.5)]`}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={winner.jackpot ? { scale: 1, rotate: 0, y: [0, -8, 0] } : { scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.15 + i * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 12,
                    y: { duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 },
                  }}
                >
                  🏆
                </motion.span>
              ))}
            </div>

            <motion.p
              className={`relative font-display uppercase ${
                winner.jackpot ? "jackpot-text text-4xl tracking-[0.1em] sm:text-5xl" : "text-2xl tracking-[0.2em] text-mm-yellow"
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              {winner.jackpot ? texts.jackpot : texts.winner}
            </motion.p>

            <motion.div
              className="relative mx-auto mt-3 inline-flex max-w-full items-center gap-3 rounded-2xl border-4 border-white px-6 py-3 shadow-[inset_0_-6px_0_rgba(0,0,0,0.25),0_10px_20px_rgba(0,0,0,0.4)]"
              style={{ backgroundColor: winner.color, color: winner.textColor ?? readableTextColor(winner.color) }}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.15, 1] }}
              transition={{ delay: 0.35, duration: 0.55, times: [0, 0.7, 1] }}
            >
              {winner.image ? (
                <img src={assetUrl(winner.image)} alt="" className="h-12 w-12 shrink-0 rounded-full border-2 border-white object-cover" />
              ) : (
                winner.icon && <span className="shrink-0 text-4xl" aria-hidden>{winner.icon}</span>
              )}
              <h2
                id="winner-title"
                className="min-w-0 font-display leading-none [overflow-wrap:anywhere] [text-wrap:balance]"
                style={{ fontSize: nameFontSize(winner) }}
              >
                {winner.name}
              </h2>
            </motion.div>

            <motion.div
              className="relative mt-5 space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {winner.description && <p className="font-body text-lg font-bold text-white/90">{winner.description}</p>}
              {winner.reward && (
                <p className="inline-block rounded-full bg-mm-yellow px-4 py-1.5 font-body text-base font-black uppercase tracking-wide text-mm-ink">
                  {texts.reward}: {winner.reward}
                </p>
              )}
            </motion.div>

            <motion.div
              className="relative mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <motion.button
                type="button"
                onClick={onSpinAgain}
                className="rounded-full bg-mm-red px-6 py-3 font-display text-xl uppercase text-white shadow-[inset_0_-5px_0_rgba(0,0,0,0.3)] outline-none focus-visible:ring-4 focus-visible:ring-mm-yellow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {texts.spinAgain}
              </motion.button>
              <motion.button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="rounded-full bg-white px-6 py-3 font-display text-xl uppercase text-mm-ink shadow-[inset_0_-5px_0_rgba(0,0,0,0.15)] outline-none focus-visible:ring-4 focus-visible:ring-mm-yellow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {texts.close}
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
