import { useState } from "react";
import { motion } from "framer-motion";
import type { RouletteConfig } from "../config/rouletteConfig";
import { assetUrl } from "../lib/wheel";

/** Cut-out mascot head with a white outline glow and the credit underneath. Hidden if the image is missing. */
export function Mascot({ mascot }: { mascot: RouletteConfig["mascot"] }) {
  const [failed, setFailed] = useState(false);
  if (!mascot.enabled || failed) return null;

  return (
    <motion.div
      className="pointer-events-none mt-8 flex flex-col items-center gap-1 self-start sm:fixed sm:bottom-4 sm:left-4 sm:z-30 sm:mt-0"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1, type: "spring", stiffness: 120, damping: 14 }}
    >
      <motion.img
        src={assetUrl(mascot.image)}
        alt="Mascotte"
        onError={() => setFailed(true)}
        draggable={false}
        className="mascot-glow pointer-events-auto h-12 w-auto sm:h-16"
        whileHover={{ rotate: [0, -10, 10, -6, 0], scale: 1.08 }}
        transition={{ duration: 0.6 }}
      />
      {mascot.credit && <p className="font-body text-[10px] font-bold text-white/45 sm:text-xs">{mascot.credit}</p>}
    </motion.div>
  );
}
