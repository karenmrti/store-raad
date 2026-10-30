import { motion } from "framer-motion";
import { assetUrl, type Segment } from "../lib/wheel";

interface PrizeListProps {
  title: string;
  segments: Segment[];
  showProbabilities: boolean;
  highlightId: string | null;
}

function formatChance(p: number) {
  const pct = p * 100;
  return `${pct < 10 ? pct.toFixed(1).replace(".", ",") : Math.round(pct)}%`;
}

export function PrizeList({ title, segments, showProbabilities, highlightId }: PrizeListProps) {
  return (
    <section className="w-full rounded-3xl border-2 border-white/15 bg-black/30 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.35)] backdrop-blur-md xl:max-h-[calc(100dvh-260px)] xl:overflow-y-auto">
      <h2 className="mb-2 flex items-center gap-2 font-display text-xl uppercase tracking-wider text-mm-yellow">
        <span className="bg-checker-strip inline-block h-4 w-6 rounded-sm" aria-hidden />
        {title}
      </h2>
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-1">
        {segments.map(({ item, probability }, i) => {
          const active = item.id === highlightId;
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0, scale: active ? 1.03 : 1 }}
              transition={{ delay: 0.6 + i * 0.05 }}
              className={`flex items-center gap-3 rounded-2xl px-3 py-1.5 transition-colors ${
                active ? "bg-white/20 ring-2 ring-mm-yellow" : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white text-base shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)]"
                style={{ backgroundColor: item.color }}
                aria-hidden
              >
                {item.image ? (
                  <img src={assetUrl(item.image)} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  item.icon
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-lg leading-tight text-white">{item.name}</span>
                {item.reward && <span className="block truncate font-body text-sm font-bold text-white/70">{item.reward}</span>}
              </span>
              {showProbabilities && (
                <span className="shrink-0 rounded-full bg-black/40 px-2.5 py-1 font-body text-sm font-black tabular-nums text-mm-yellow">
                  {formatChance(probability)}
                </span>
              )}
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
