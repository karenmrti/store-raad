import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RouletteConfig, RouletteItem } from "../config/rouletteConfig";

interface AdminPanelProps {
  open: boolean;
  config: RouletteConfig;
  defaultConfig: RouletteConfig;
  isModified: boolean;
  unlocked: boolean;
  onUnlock: () => void;
  onApply: (config: RouletteConfig) => void;
  onClose: () => void;
  onPreviewJackpot: () => void;
}

const NEW_ITEM_COLORS = ["#E30613", "#0A7CFF", "#FFC81E", "#1FB24A", "#1C1C24", "#8E24AA", "#FF6F00"];

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const round1 = (n: number) => Math.round(n * 10) / 10;
const formatPct = (n: number) => `${round1(n).toLocaleString("nl-NL")}%`;

/** Rounds percentages to one decimal so the active ones add up to exactly 100 (largest remainder). */
function toPercentages(weights: number[], active: boolean[]): number[] {
  const total = weights.reduce((s, w, i) => (active[i] && w > 0 ? s + w : s), 0);
  if (total <= 0) return weights;
  const tenths = weights.map((w) => (w / total) * 1000);
  const result = tenths.map(Math.floor);
  let missing = 1000 - result.reduce((s, t, i) => (active[i] && weights[i] > 0 ? s + t : s), 0);
  const order = tenths
    .map((t, i) => ({ i, rest: t - Math.floor(t) }))
    .filter(({ i }) => active[i] && weights[i] > 0)
    .sort((a, b) => b.rest - a.rest);
  for (const { i } of order) {
    if (missing-- <= 0) break;
    result[i] += 1;
  }
  return result.map((t) => t / 10);
}

/** Copies the config and rewrites weights as percentages of the enabled items, which is easier to edit. */
function toPercentDraft(config: RouletteConfig): RouletteConfig {
  const draft = clone(config);
  const pcts = toPercentages(
    draft.items.map((i) => i.weight),
    draft.items.map((i) => i.enabled),
  );
  draft.items.forEach((item, i) => (item.weight = pcts[i]));
  return draft;
}

/** Turns a config into TypeScript that can replace the object in src/config/rouletteConfig.ts. */
function toConfigCode(config: RouletteConfig): string {
  const body = JSON.stringify(config, null, 2).replace(/^(\s*)"([A-Za-z_$][\w$]*)":/gm, "$1$2:");
  return `export const rouletteConfig: RouletteConfig = ${body};\n`;
}

const inputClass =
  "w-full rounded-xl border-2 border-white/15 bg-black/40 px-3 py-2 font-body text-sm font-bold text-white placeholder:text-white/30 outline-none focus:border-mm-yellow";
const labelClass = "mb-1 block font-body text-xs font-black uppercase tracking-wider text-white/60";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 font-body text-sm font-bold text-white">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-mm-yellow ${
          checked ? "bg-mm-green" : "bg-white/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
      {label}
    </label>
  );
}

function PinGate({ pin, onUnlock, onClose }: { pin: string; onUnlock: () => void; onClose: () => void }) {
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  return (
    <form
      className="mx-auto mt-[15vh] w-full max-w-xs rounded-3xl border-2 border-white/20 bg-[#1E0A0D] p-6 text-center shadow-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        if (value === pin) onUnlock();
        else {
          setWrong(true);
          setValue("");
        }
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="font-display text-2xl text-mm-yellow">Admin</p>
      <p className="mt-1 font-body text-sm font-bold text-white/70">Voer de pincode in</p>
      <motion.input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setWrong(false);
        }}
        className={`${inputClass} mt-4 text-center text-2xl tracking-[0.5em]`}
        animate={wrong ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
        aria-label="Pincode"
        aria-invalid={wrong}
      />
      {wrong && <p className="mt-2 font-body text-sm font-bold text-[#FF8A8A]">Onjuiste pincode</p>}
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-full bg-white/10 py-2 font-display text-lg text-white hover:bg-white/20">
          Annuleren
        </button>
        <button type="submit" className="flex-1 rounded-full bg-mm-red py-2 font-display text-lg text-white hover:brightness-110">
          Open
        </button>
      </div>
    </form>
  );
}

function ItemEditor({
  item,
  index,
  count,
  chance,
  onChange,
  onMove,
  onRemove,
}: {
  item: RouletteItem;
  index: number;
  count: number;
  chance: number;
  onChange: (patch: Partial<RouletteItem>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const iconButton =
    "flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 font-body text-base font-black text-white hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className={`rounded-2xl border-2 p-3 sm:p-4 ${item.enabled ? "border-white/15 bg-white/[0.06]" : "border-dashed border-white/15 bg-black/20 opacity-70"}`}
    >
      <div className="flex flex-wrap items-end gap-2">
        <label className="shrink-0" title="Kleur">
          <span className={labelClass}>Kleur</span>
          <input
            type="color"
            value={item.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="h-10 w-12 cursor-pointer rounded-xl border-2 border-white/20 bg-transparent p-0.5"
          />
        </label>
        <label className="min-w-[8rem] flex-1">
          <span className={labelClass}>Naam op het rad</span>
          <input className={inputClass} value={item.name} onChange={(e) => onChange({ name: e.target.value })} />
        </label>
        <label className="w-16 shrink-0">
          <span className={labelClass}>Icoon</span>
          <input
            className={`${inputClass} text-center text-lg`}
            value={item.icon ?? ""}
            onChange={(e) => onChange({ icon: e.target.value || null })}
            placeholder="—"
          />
        </label>
        <div className="flex shrink-0 gap-1">
          <button type="button" className={iconButton} onClick={() => onMove(-1)} disabled={index === 0} aria-label="Omhoog">
            ▲
          </button>
          <button type="button" className={iconButton} onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Omlaag">
            ▼
          </button>
          <button type="button" className={`${iconButton} hover:bg-mm-red`} onClick={onRemove} aria-label={`${item.name} verwijderen`}>
            🗑
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <label>
          <span className={labelClass}>Omschrijving</span>
          <input className={inputClass} value={item.description} onChange={(e) => onChange({ description: e.target.value })} />
        </label>
        <label>
          <span className={labelClass}>Beloning</span>
          <input className={inputClass} value={item.reward} onChange={(e) => onChange({ reward: e.target.value })} />
        </label>
        <label>
          <span className={labelClass}>Afbeelding (optioneel)</span>
          <input
            className={inputClass}
            value={item.image ?? ""}
            onChange={(e) => onChange({ image: e.target.value || null })}
            placeholder="items/foto.png"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex min-w-[14rem] flex-1 items-center gap-3">
          <span className={`${labelClass} mb-0 shrink-0`}>Kans</span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={Math.min(item.weight, 100)}
            onChange={(e) => onChange({ weight: Number(e.target.value) })}
            className="h-2 flex-1 cursor-pointer accent-mm-yellow"
            aria-label={`Kans voor ${item.name}`}
          />
          <div className="relative w-24 shrink-0">
            <input
              type="number"
              min={0}
              step={0.1}
              value={item.weight}
              onChange={(e) => onChange({ weight: Math.max(0, Number(e.target.value) || 0) })}
              className={`${inputClass} pr-7 text-right tabular-nums`}
              aria-label={`Kans in procent voor ${item.name}`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-body text-sm font-black text-white/50">%</span>
          </div>
        </div>
        <span className="font-body text-xs font-bold text-white/60">
          {item.enabled && item.weight > 0 ? <>Werkelijke kans: <span className="text-mm-yellow">{formatPct(chance)}</span></> : "Wordt nooit gekozen"}
        </span>
        <Toggle checked={!!item.jackpot} onChange={(jackpot) => onChange({ jackpot })} label="Jackpot" />
        <Toggle checked={item.enabled} onChange={(enabled) => onChange({ enabled })} label="Actief" />
      </div>
    </motion.li>
  );
}

export function AdminPanel({
  open,
  config,
  defaultConfig,
  isModified,
  unlocked,
  onUnlock,
  onApply,
  onClose,
  onPreviewJackpot,
}: AdminPanelProps) {
  const [draft, setDraft] = useState<RouletteConfig>(() => toPercentDraft(config));
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Start from the live config every time the panel opens.
  useEffect(() => {
    if (!open) return;
    setDraft(toPercentDraft(config));
    setError(null);
    setCode(null);
  }, [open, config]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const activeTotal = useMemo(
    () => draft.items.filter((i) => i.enabled && i.weight > 0).reduce((s, i) => s + i.weight, 0),
    [draft.items],
  );
  const totalIs100 = Math.abs(activeTotal - 100) < 0.05;

  const update = (patch: Partial<RouletteConfig>) => setDraft((d) => ({ ...d, ...patch }));
  const updateItem = (index: number, patch: Partial<RouletteItem>) =>
    setDraft((d) => ({ ...d, items: d.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) }));
  const moveItem = (index: number, direction: -1 | 1) =>
    setDraft((d) => {
      const items = [...d.items];
      const [moved] = items.splice(index, 1);
      items.splice(index + direction, 0, moved);
      return { ...d, items };
    });
  const removeItem = (index: number) => setDraft((d) => ({ ...d, items: d.items.filter((_, i) => i !== index) }));
  const addItem = () =>
    setDraft((d) => ({
      ...d,
      items: [
        ...d.items,
        {
          id: `item-${Date.now().toString(36)}`,
          name: "NIEUW",
          description: "",
          reward: "",
          color: NEW_ITEM_COLORS[d.items.length % NEW_ITEM_COLORS.length],
          weight: 10,
          enabled: true,
          icon: "⭐",
          image: null,
        },
      ],
    }));
  const normalize = () =>
    setDraft((d) => {
      const pcts = toPercentages(
        d.items.map((i) => i.weight),
        d.items.map((i) => i.enabled),
      );
      return { ...d, items: d.items.map((i, idx) => (i.enabled && i.weight > 0 ? { ...i, weight: pcts[idx] } : i)) };
    });
  const equalize = () =>
    setDraft((d) => {
      const pcts = toPercentages(
        d.items.map((i) => (i.enabled ? 1 : 0)),
        d.items.map((i) => i.enabled),
      );
      return { ...d, items: d.items.map((i, idx) => (i.enabled ? { ...i, weight: pcts[idx] } : i)) };
    });

  const validate = (): string | null => {
    if (!draft.items.some((i) => i.enabled && i.weight > 0)) return "Zet minstens één item op actief met een kans hoger dan 0%.";
    if (draft.items.some((i) => !i.name.trim())) return "Elk item heeft een naam nodig.";
    if (!(draft.spinDuration >= 1000)) return "De draaiduur moet minstens 1 seconde zijn.";
    return null;
  };

  const apply = () => {
    const problem = validate();
    if (problem) return setError(problem);
    onApply(clone(draft));
  };

  const exportCode = async () => {
    const problem = validate();
    if (problem) return setError(problem);
    setError(null);
    const text = toConfigCode(draft);
    setCode(text);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const chanceOf = (item: RouletteItem) => (activeTotal > 0 && item.enabled ? (item.weight / activeTotal) * 100 : 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] overflow-y-auto bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Admin-instellingen"
        >
          {!unlocked ? (
            <PinGate pin={defaultConfig.admin.pin} onUnlock={onUnlock} onClose={onClose} />
          ) : (
            <motion.div
              className="ml-auto flex min-h-full w-full max-w-3xl flex-col bg-gradient-to-b from-[#2A0A0E] to-[#14070A] shadow-[-20px_0_60px_rgba(0,0,0,0.6)]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b-2 border-white/10 bg-[#2A0A0E]/95 px-4 py-3 backdrop-blur sm:px-6" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))" }}>
                <div className="flex items-center gap-3">
                  <span className="bg-checker-strip inline-block h-6 w-8 rounded" aria-hidden />
                  <div>
                    <h2 className="font-display text-2xl leading-none text-mm-yellow">Admin</h2>
                    <p className="font-body text-xs font-bold text-white/60">
                      {isModified ? "Lokale wijzigingen actief in dit tabblad" : "Standaardinstellingen uit de config"}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20" aria-label="Sluiten">
                  ✕
                </button>
              </header>

              <div className="flex-1 space-y-6 px-4 py-5 sm:px-6">
                <section>
                  <h3 className="mb-3 font-display text-xl text-white">Algemeen</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className={labelClass}>Ondertitel</span>
                      <input className={inputClass} value={draft.subtitle} onChange={(e) => update({ subtitle: e.target.value })} />
                    </label>
                    <label>
                      <span className={labelClass}>Draaiduur (seconden)</span>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        step={0.5}
                        className={inputClass}
                        value={draft.spinDuration / 1000}
                        onChange={(e) => update({ spinDuration: Math.round((Number(e.target.value) || 0) * 1000) })}
                      />
                    </label>
                    <label>
                      <span className={labelClass}>Grootte van de vakken</span>
                      <select
                        className={inputClass}
                        value={draft.segmentSizing}
                        onChange={(e) => update({ segmentSizing: e.target.value as RouletteConfig["segmentSizing"] })}
                      >
                        <option value="equal">Allemaal even groot</option>
                        <option value="weighted">Naar verhouding van de kans</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                    <Toggle checked={draft.showPrizeList} onChange={(v) => update({ showPrizeList: v })} label="Prijzenlijst tonen" />
                    <Toggle checked={draft.showProbabilities} onChange={(v) => update({ showProbabilities: v })} label="Percentages tonen" />
                    <Toggle checked={draft.confetti} onChange={(v) => update({ confetti: v })} label="Confetti" />
                    <Toggle checked={draft.sound.enabled} onChange={(v) => update({ sound: { ...draft.sound, enabled: v } })} label="Geluid" />
                  </div>
                </section>

                <section>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-xl text-white">Items op het rad</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 font-body text-sm font-black tabular-nums ${
                          totalIs100 ? "bg-mm-green/25 text-[#7DF0A0]" : "bg-[#FF6F00]/25 text-[#FFC27A]"
                        }`}
                      >
                        Totaal actief: {formatPct(activeTotal)}
                      </span>
                      {!totalIs100 && activeTotal > 0 && (
                        <button type="button" onClick={normalize} className="rounded-full bg-white/10 px-3 py-1 font-body text-sm font-black text-white hover:bg-white/20">
                          Maak 100%
                        </button>
                      )}
                      <button type="button" onClick={equalize} className="rounded-full bg-white/10 px-3 py-1 font-body text-sm font-black text-white hover:bg-white/20">
                        Gelijk verdelen
                      </button>
                    </div>
                  </div>
                  {!totalIs100 && activeTotal > 0 && (
                    <p className="mb-3 font-body text-xs font-bold text-white/60">
                      Het totaal hoeft niet precies 100% te zijn: de kansen worden naar verhouding omgerekend (zie "Werkelijke kans").
                    </p>
                  )}

                  <ul className="space-y-3">
                    <AnimatePresence initial={false}>
                      {draft.items.map((item, index) => (
                        <ItemEditor
                          key={item.id}
                          item={item}
                          index={index}
                          count={draft.items.length}
                          chance={chanceOf(item)}
                          onChange={(patch) => updateItem(index, patch)}
                          onMove={(dir) => moveItem(index, dir)}
                          onRemove={() => removeItem(index)}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>

                  <button
                    type="button"
                    onClick={addItem}
                    className="mt-3 w-full rounded-2xl border-2 border-dashed border-white/25 py-3 font-display text-lg text-white/80 hover:border-mm-yellow hover:text-mm-yellow"
                  >
                    + Item toevoegen
                  </button>
                </section>

                {code !== null && (
                  <section>
                    <h3 className="mb-2 font-display text-xl text-white">Config-code {copied && <span className="font-body text-sm font-black text-[#7DF0A0]">✓ Gekopieerd</span>}</h3>
                    <p className="mb-2 font-body text-xs font-bold text-white/60">
                      {copied ? "De code staat op je klembord." : "Kopiëren lukte niet automatisch; selecteer de code hieronder en kopieer handmatig."}
                    </p>
                    <textarea
                      readOnly
                      value={code}
                      onFocus={(e) => e.currentTarget.select()}
                      className="h-48 w-full rounded-xl border-2 border-white/15 bg-black/50 p-3 font-mono text-xs text-white/90 outline-none focus:border-mm-yellow"
                    />
                  </section>
                )}
              </div>

              <footer className="sticky bottom-0 border-t-2 border-white/10 bg-[#14070A]/95 px-4 py-3 backdrop-blur sm:px-6" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}>
                {error && <p className="mb-2 font-body text-sm font-bold text-[#FF8A8A]">{error}</p>}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft(toPercentDraft(defaultConfig))}
                    className="rounded-full bg-white/10 px-4 py-2 font-body text-sm font-black text-white hover:bg-white/20"
                  >
                    Standaard herstellen
                  </button>
                  <button type="button" onClick={exportCode} className="rounded-full bg-white/10 px-4 py-2 font-body text-sm font-black text-white hover:bg-white/20">
                    Kopieer config-code
                  </button>
                  <button
                    type="button"
                    onClick={onPreviewJackpot}
                    className="rounded-full bg-gradient-to-b from-[#FFE57A] to-[#F5A300] px-4 py-2 font-body text-sm font-black text-[#5A1A00] hover:brightness-110"
                  >
                    🏆 Viering testen
                  </button>
                  <div className="ml-auto flex gap-2">
                    <button type="button" onClick={onClose} className="rounded-full bg-white/10 px-5 py-2 font-display text-lg text-white hover:bg-white/20">
                      Annuleren
                    </button>
                    <button
                      type="button"
                      onClick={apply}
                      className="rounded-full bg-mm-red px-6 py-2 font-display text-lg text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)] hover:brightness-110"
                    >
                      Toepassen
                    </button>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
