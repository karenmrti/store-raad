import { AnimatePresence, motion } from "framer-motion";

/** Full-screen "JACKPOT!" moment shown before the winner pop-up. */
export function JackpotFlash({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[55] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          aria-hidden
        >
          {/* White-gold flash */}
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle,#FFFBE0_0%,#FFC81E_35%,rgba(227,6,19,0.85)_75%)]"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0.55, 0.7, 0.5] }}
            transition={{ duration: 1.2, times: [0, 0.3, 0.5, 1] }}
          />
          <div className="jackpot-rays absolute left-1/2 top-1/2 h-[220vmax] w-[220vmax]" />

          <motion.div
            className="relative flex flex-col items-center px-4 text-center"
            initial={{ scale: 0.2, rotate: -12 }}
            animate={{ scale: [0.2, 1.25, 1], rotate: [-12, 4, 0] }}
            transition={{ duration: 0.8, times: [0, 0.6, 1], ease: "easeOut" }}
          >
            <motion.div
              className="text-[clamp(4rem,14vw,9rem)] leading-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)]"
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
            >
              🏆
            </motion.div>
            <p className="jackpot-text font-display text-[clamp(3.5rem,15vw,11rem)] leading-[0.9] tracking-wide">JACKPOT!</p>
            <div className="mt-3 flex gap-3 text-[clamp(2rem,6vw,4rem)]">
              {["💰", "⭐", "💰"].map((emoji, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 360] }}
                  transition={{ delay: 0.4 + i * 0.12, rotate: { duration: 1.4, repeat: Infinity, ease: "linear" } }}
                >
                  {emoji}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
