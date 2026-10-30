import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import { rouletteConfig as defaultConfig, type RouletteConfig } from "./config/rouletteConfig";
import { buildSegments, getEnabledItems, validateConfig, type Segment } from "./lib/wheel";
import { playWin } from "./lib/sound";
import { useRouletteSpin } from "./hooks/useRouletteSpin";
import { Background } from "./components/Background";
import { Wheel } from "./components/Wheel";
import { SpinButton } from "./components/SpinButton";
import { WinnerModal } from "./components/WinnerModal";
import { PrizeList } from "./components/PrizeList";
import { AdminPanel } from "./components/AdminPanel";
import logo from "./assets/store-grand-prix-logo.png";

const CONFETTI_COLORS = ["#E30613", "#0A7CFF", "#1FB24A", "#FFC81E", "#FFFFFF"];

function celebrate() {
  const end = Date.now() + 2200;
  const base = { colors: CONFETTI_COLORS, disableForReducedMotion: true, zIndex: 60 };
  confetti({ ...base, particleCount: 160, spread: 100, startVelocity: 55, origin: { x: 0.5, y: 0.55 } });
  const frame = () => {
    confetti({ ...base, particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.75 } });
    confetti({ ...base, particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.75 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

export default function App() {
  const reducedMotion = useReducedMotion() ?? false;
  // The live config: starts from rouletteConfig.ts; the admin can replace it for this tab only.
  const [config, setConfig] = useState<RouletteConfig>(defaultConfig);
  const segments = useMemo(() => buildSegments(getEnabledItems(config), config.segmentSizing), [config]);
  const [soundOn, setSoundOn] = useState(defaultConfig.sound.enabled);
  const [result, setResult] = useState<Segment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(!defaultConfig.admin.pin);
  const revealTimer = useRef<number>();
  const logoClicks = useRef<number[]>([]);

  useEffect(() => {
    document.title = `MediaMarkt ${defaultConfig.title}`;
    const problems = validateConfig(defaultConfig);
    if (problems.length) console.warn("[Store Grand Prix] Check src/config/rouletteConfig.ts:\n- " + problems.join("\n- "));
    return () => window.clearTimeout(revealTimer.current);
  }, []);

  const handleResult = useCallback(
    (segment: Segment) => {
      setResult(segment);
      if (config.confetti) celebrate();
      if (config.sound.enabled && soundOn && config.sound.win) playWin(config.sound.volume);
      // Let the pointer and highlighted segment be seen for a moment before the pop-up.
      revealTimer.current = window.setTimeout(() => setModalOpen(true), reducedMotion ? 150 : 700);
    },
    [config, soundOn, reducedMotion],
  );

  const { rotation, pointerKick, spinning, spin } = useRouletteSpin({
    segments,
    config,
    soundOn,
    reducedMotion,
    onResult: handleResult,
  });

  const startSpin = useCallback(() => {
    window.clearTimeout(revealTimer.current);
    setModalOpen(false);
    setResult(null);
    spin();
  }, [spin]);

  // Hidden admin: Ctrl+Shift+A, 5 quick clicks on the logo, or #admin in the URL.
  const openAdmin = useCallback(() => {
    if (!defaultConfig.admin.enabled || spinning) return;
    setModalOpen(false);
    setAdminOpen(true);
  }, [spinning]);

  const onLogoClick = () => {
    const now = Date.now();
    logoClicks.current = [...logoClicks.current.filter((t) => now - t < 2000), now];
    if (logoClicks.current.length >= 5) {
      logoClicks.current = [];
      openAdmin();
    }
  };

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash !== "#admin") return;
      history.replaceState(null, "", window.location.pathname + window.location.search);
      openAdmin();
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, [openAdmin]);

  const applyAdminConfig = useCallback((next: RouletteConfig) => {
    window.clearTimeout(revealTimer.current);
    setResult(null);
    setModalOpen(false);
    setConfig(next);
    setAdminOpen(false);
  }, []);
  const closeAdmin = useCallback(() => setAdminOpen(false), []);

  // Space bar spins the wheel (unless a control or a pop-up has focus).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === "KeyA") {
        e.preventDefault();
        openAdmin();
        return;
      }
      if (e.code !== "Space" || modalOpen || adminOpen || e.repeat) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      startSpin();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, adminOpen, startSpin, openAdmin]);

  const closeModal = useCallback(() => setModalOpen(false), []);
  const spinAgain = useCallback(() => {
    setModalOpen(false);
    window.setTimeout(startSpin, 250);
  }, [startSpin]);

  return (
    <MotionConfig reducedMotion="user">
      <Background />

      {config.sound.enabled && (
        <motion.button
          type="button"
          onClick={() => setSoundOn((on) => !on)}
          className="fixed right-3 top-3 z-40 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/70 bg-black/40 text-2xl backdrop-blur outline-none focus-visible:ring-4 focus-visible:ring-mm-yellow sm:right-5 sm:top-5"
          style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label={soundOn ? config.texts.soundOff : config.texts.soundOn}
          aria-pressed={!soundOn}
        >
          <span aria-hidden>{soundOn ? "🔊" : "🔇"}</span>
        </motion.button>
      )}

      <div className="flex min-h-dvh flex-col items-center px-4 pb-6 pt-14 sm:px-6 sm:pt-6">
        <header className="flex w-full flex-col items-center text-center">
          <motion.img
            src={logo}
            alt={`MediaMarkt ${config.title}`}
            className="logo-float w-[min(94vw,540px,max(300px,(100dvh-280px)*0.9))] drop-shadow-[0_14px_24px_rgba(0,0,0,0.55)]"
            initial={{ opacity: 0, y: -60, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            draggable={false}
            onClick={onLogoClick}
          />
          <h1 className="sr-only">{config.title}</h1>
          {config.subtitle && (
            <motion.p
              className="-mt-1 max-w-full rounded-3xl border-2 border-white/25 bg-black/30 px-5 py-1.5 font-display text-base tracking-wide text-white backdrop-blur-sm [text-wrap:balance] sm:rounded-full sm:text-2xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              {config.subtitle}
            </motion.p>
          )}
        </header>

        {segments.length === 0 ? (
          <main className="mx-auto mt-10 max-w-md rounded-3xl bg-black/40 p-6 text-center font-body font-bold text-white">
            {config.texts.noItems}
          </main>
        ) : (
          <main className="mt-5 flex w-full max-w-[1400px] flex-1 flex-col items-center justify-center gap-8 xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-center xl:gap-12">
            <div className="flex flex-col items-center gap-6 xl:col-start-2">
              <motion.div
                style={{ width: "clamp(260px, min(90vw, 100dvh - 420px), 680px)" }}
                initial={{ opacity: 0, scale: 0.6, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 70, damping: 14, delay: 0.15 }}
              >
                <Wheel
                  segments={segments}
                  rotation={rotation}
                  pointerKick={pointerKick}
                  spinning={spinning}
                  winnerIndex={result?.index ?? null}
                />
              </motion.div>

              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <SpinButton
                  label={config.texts.spinButton}
                  ariaLabel={config.texts.spinButtonLabel}
                  spinningLabel={config.texts.spinningLabel}
                  hint={config.texts.keyboardHint}
                  spinning={spinning}
                  onSpin={startSpin}
                />
              </motion.div>
            </div>

            {config.showPrizeList && (
              <div className="w-full max-w-xl xl:w-[min(20rem,100%)] xl:max-w-none xl:justify-self-start">
                <PrizeList
                  title={config.texts.prizes}
                  segments={segments}
                  showProbabilities={config.showProbabilities}
                  highlightId={spinning ? null : (result?.item.id ?? null)}
                />
              </div>
            )}
          </main>
        )}

      </div>

      <p className="sr-only" aria-live="polite">
        {spinning ? config.texts.spinningLabel : result ? `${config.texts.winner} ${result.item.name}. ${result.item.reward}` : ""}
      </p>

      <WinnerModal
        winner={modalOpen ? (result?.item ?? null) : null}
        texts={config.texts}
        onClose={closeModal}
        onSpinAgain={spinAgain}
      />

      {defaultConfig.admin.enabled && (
        <AdminPanel
          open={adminOpen}
          config={config}
          defaultConfig={defaultConfig}
          isModified={config !== defaultConfig}
          unlocked={adminUnlocked}
          onUnlock={() => setAdminUnlocked(true)}
          onApply={applyAdminConfig}
          onClose={closeAdmin}
        />
      )}
    </MotionConfig>
  );
}
