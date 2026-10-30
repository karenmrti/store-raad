import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RouletteConfig, RouletteItem } from "../config/rouletteConfig";
import { assetUrl, readableTextColor } from "../lib/wheel";

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
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] border-4 border-white bg-gradient-to-b from-[#2A0A0E] to-[#14070A] px-6 pb-7 pt-14 text-center shadow-[0_30px_80px_rgba(0,0,0,0.7)] sm:px-8"
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

            <motion.div
              className="relative mx-auto mb-2 text-7xl drop-shadow-[0_8px_10px_rgba(0,0,0,0.5)]"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 12 }}
              aria-hidden
            >
              🏆
            </motion.div>

            <motion.p
              className="relative font-display text-2xl uppercase tracking-[0.2em] text-mm-yellow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              {texts.winner}
            </motion.p>

            <motion.div
              className="relative mx-auto mt-3 inline-flex max-w-full items-center gap-3 rounded-2xl border-4 border-white px-6 py-3 shadow-[inset_0_-6px_0_rgba(0,0,0,0.25),0_10px_20px_rgba(0,0,0,0.4)]"
              style={{ backgroundColor: winner.color, color: winner.textColor ?? readableTextColor(winner.color) }}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.15, 1] }}
              transition={{ delay: 0.35, duration: 0.55, times: [0, 0.7, 1] }}
            >
              {winner.image ? (
                <img src={assetUrl(winner.image)} alt="" className="h-12 w-12 rounded-full border-2 border-white object-cover" />
              ) : (
                winner.icon && <span className="text-4xl" aria-hidden>{winner.icon}</span>
              )}
              <h2 id="winner-title" className="break-words font-display text-4xl leading-none sm:text-5xl">
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
