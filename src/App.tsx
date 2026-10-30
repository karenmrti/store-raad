import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import { rouletteConfig as defaultConfig, type RouletteConfig } from "./config/rouletteConfig";
import { buildSegments, getEnabledItems, validateConfig, type Segment } from "./lib/wheel";
import { playJackpot, playWin } from "./lib/sound";
import { useRouletteSpin } from "./hooks/useRouletteSpin";
import { Background } from "./components/Background";
import { Wheel } from "./components/Wheel";
import { SpinButton } from "./components/SpinButton";
import { WinnerModal } from "./components/WinnerModal";
import { PrizeList } from "./components/PrizeList";
import { AdminPanel } from "./components/AdminPanel";
import { JackpotFlash } from "./components/JackpotFlash";
import { Mascot } from "./components/Mascot";
import logo from "./assets/store-grand-prix-logo.webp";

const cornerButton =
  "flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/70 bg-black/40 text-2xl text-white backdrop-blur outline-none focus-visible:ring-4 focus-visible:ring-mm-yellow";

const CONFETTI_COLORS =["#E30613", "#0A7CFF", "#1FB24A", "#FFC81E", "#FFFFFF"];

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

const JACKPOT_COLORS = ["#FFD84D", "#FFC81E", "#F5B301", "#FFF1A8", "#FFFFFF", "#E30613"];
const JACKPOT_FLASH_MS = 2800;

/** Bigger, longer celebration: gold cannons, emoji rain and fireworks for ~6 seconds. */
function celebrateJackpot() {
  const base = { colors: JACKPOT_COLORS, disableForReducedMotion: true, zIndex: 60 };
  const emoji = ["🏆", "💰", "⭐"].map((text) => confetti.shapeFromText({ text, scalar: 2.2 }));
  confetti({ ...base, particleCount: 250, spread: 160, startVelocity: 65, scalar: 1.3, origin: { x: 0.5, y: 0.6 } });
  confetti({ ...base, particleCount: 40, spread: 120, startVelocity: 50, shapes: emoji, scalar: 2.2, origin: { x: 0.5, y: 0.5 } });

  const end = Date.now() + 6000;
  const sides = () => {
    confetti({ ...base, particleCount: 6, angle: 60, spread: 70, startVelocity: 70, origin: { x: 0, y: 0.8 } });
    confetti({ ...base, particleCount: 6, angle: 120, spread: 70, startVelocity: 70, origin: { x: 1, y: 0.8 } });
    if (Date.now() < end) requestAnimationFrame(sides);
  };
  sides();

  const fireworks = window.setInterval(() => {
    if (Date.now() > end) return window.clearInterval(fireworks);
    const origin = { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.35 };
    confetti({ ...base, particleCount: 70, spread: 360, startVelocity: 32, gravity: 0.8, ticks: 120, origin });
    confetti({ ...base, particleCount: 6, spread: 360, startVelocity: 20, shapes: emoji, scalar: 2.2, ticks: 160, origin });
  }, 450);
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
  const [jackpotFlash, setJackpotFlash] = useState(false);
  const revealTimer = useRef<number>();
  const flashTimer = useRef<number>();
  const logoClicks = useRef<number[]>([]);

  useEffect(() => {
    document.title = `MediaMarkt ${defaultConfig.title}`;
    const problems = validateConfig(defaultConfig);
    if (problems.length) console.warn("[Store Grand Prix] Check src/config/rouletteConfig.ts:\n- " + problems.join("\n- "));
    return () => {
      window.clearTimeout(revealTimer.current);
      window.clearTimeout(flashTimer.current);
    };
  }, []);

  /** Gold flash, fireworks and fanfare; `then` runs when the flash is over. */
  const runJackpotCelebration = useCallback(
    (then?: () => void) => {
      if (config.confetti) celebrateJackpot();
      if (config.sound.enabled && soundOn && config.sound.win) playJackpot(config.sound.volume);
      setJackpotFlash(true);
      window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => {
        setJackpotFlash(false);
        then?.();
      }, reducedMotion ? 1500 : JACKPOT_FLASH_MS);
    },
    [config, soundOn, reducedMotion],
  );

  const handleResult = useCallback(
    (segment: Segment) => {
      setResult(segment);
      if (segment.item.jackpot) {
        revealTimer.current = window.setTimeout(() => runJackpotCelebration(() => setModalOpen(true)), 250);
        return;
      }
      if (config.confetti) celebrate();
      if (config.sound.enabled && soundOn && config.sound.win) playWin(config.sound.volume);
      // Let the pointer and highlighted segment be seen for a moment before the pop-up.
      revealTimer.current = window.setTimeout(() => setModalOpen(true), reducedMotion ? 150 : 700);
    },
    [config, soundOn, reducedMotion, runJackpotCelebration],
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
    window.clearTimeout(flashTimer.current);
    setJackpotFlash(false);
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

  // Full screen (e.g. for a TV or tablet in the store). Hidden where the browser can't do it, like iPhone.
  const fullscreenSupported = typeof document !== "undefined" && !!document.documentElement.requestFullscreen;
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  };
  const previewJackpot = useCallback(() => {
    setAdminOpen(false);
    window.setTimeout(() => runJackpotCelebration(), 400);
  }, [runJackpotCelebration]);

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

      <div
        className="fixed right-3 top-3 z-40 flex gap-2 sm:right-5 sm:top-5"
        style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
      >
        {fullscreenSupported && (
          <motion.button
            type="button"
            onClick={toggleFullscreen}
            className={cornerButton}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isFullscreen ? config.texts.fullscreenOff : config.texts.fullscreenOn}
            title={isFullscreen ? config.texts.fullscreenOff : config.texts.fullscreenOn}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              {isFullscreen ? (
                <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
              ) : (
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              )}
            </svg>
          </motion.button>
        )}
        {config.sound.enabled && (
          <motion.button
            type="button"
            onClick={() => setSoundOn((on) => !on)}
            className={cornerButton}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={soundOn ? config.texts.soundOff : config.texts.soundOn}
            aria-pressed={!soundOn}
          >
            <span aria-hidden>{soundOn ? "🔊" : "🔇"}</span>
          </motion.button>
        )}
      </div>

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
                {/* Subtle camera push-in while the wheel spins */}
                <motion.div
                  animate={{ scale: spinning && config.zoomOnSpin ? 1.07 : 1 }}
                  transition={{ duration: spinning ? 1.4 : 0.9, ease: "easeInOut" }}
                >
                  <Wheel
                    segments={segments}
                    rotation={rotation}
                    pointerKick={pointerKick}
                    spinning={spinning}
                    winnerIndex={result?.index ?? null}
                  />
                </motion.div>
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

        <Mascot mascot={config.mascot} />
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

      <JackpotFlash show={jackpotFlash} />

      {defaultConfig.admin.enabled && (
        <AdminPanel
          open={adminOpen}
          onPreviewJackpot={previewJackpot}
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
