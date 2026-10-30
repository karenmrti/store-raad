import { useCallback, useEffect, useRef, useState } from "react";
import { animate, useMotionValue, type AnimationPlaybackControls } from "framer-motion";
import type { RouletteConfig } from "../config/rouletteConfig";
import { computeTargetRotation, pickWeighted, segmentAtPointer, spinEase, type Segment } from "../lib/wheel";
import { playSpinStart, playTick, unlockAudio } from "../lib/sound";

interface Options {
  segments: Segment[];
  config: RouletteConfig;
  soundOn: boolean;
  reducedMotion: boolean;
  onResult: (segment: Segment) => void;
}

/**
 * Owns the wheel rotation. The winner is drawn by weight BEFORE the spin and the wheel is animated
 * to land on it, but the result is only published once the animation has finished — and it is read
 * back from the final wheel angle, so what the pointer shows and what is announced always match.
 */
export function useRouletteSpin({ segments, config, soundOn, reducedMotion, onResult }: Options) {
  const rotation = useMotionValue(0);
  const pointerKick = useMotionValue(0);
  const [spinning, setSpinning] = useState(false);
  const spinningRef = useRef(false);
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);

  // Keep the latest values available to the running animation without restarting it.
  const latest = useRef({ soundOn, onResult });
  latest.current = { soundOn, onResult };

  useEffect(() => () => controlsRef.current?.stop(), []);

  const spin = useCallback(() => {
    if (spinningRef.current || segments.length === 0) return;
    spinningRef.current = true;
    setSpinning(true);

    const { sound } = config;
    const soundAllowed = () => sound.enabled && latest.current.soundOn;
    if (soundAllowed()) {
      unlockAudio(sound.volume);
      if (sound.spinStart) playSpinStart(sound.volume);
    }

    const chosen = pickWeighted(segments);
    const from = rotation.get();
    const to = computeTargetRotation(from, chosen, reducedMotion ? 2 : config.minFullRotations);
    const duration = (reducedMotion ? Math.min(config.spinDuration, 2500) : config.spinDuration) / 1000;

    let lastIndex = segmentAtPointer(segments, from).index;

    controlsRef.current = animate(rotation, to, {
      duration,
      ease: reducedMotion ? "easeOut" : spinEase,
      onUpdate: (value) => {
        const index = segmentAtPointer(segments, value).index;
        if (index === lastIndex) return;
        lastIndex = index;
        if (soundAllowed() && sound.ticks) playTick(sound.volume);
        if (!reducedMotion) animate(pointerKick, [-26, 0], { duration: 0.22, ease: "easeOut" });
      },
      onComplete: () => {
        const landed = segmentAtPointer(segments, to);
        if (landed.index !== chosen.index) {
          console.error("[Store Grand Prix] Landed segment differs from the drawn winner.", { chosen, landed });
        }
        // Normalise so the angle never grows without bound; visually identical.
        rotation.jump(((to % 360) + 360) % 360);
        spinningRef.current = false;
        setSpinning(false);
        latest.current.onResult(landed);
      },
    });
  }, [segments, config, reducedMotion, rotation, pointerKick]);

  return { rotation, pointerKick, spinning, spin };
}
