/**
 * Tiny synthesizer for the game sounds (Web Audio API), so no audio files are needed.
 * The AudioContext is created lazily on the first user gesture, as browsers require.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function getContext(volume: number): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    ctx = new Ctor();
    master = ctx.createGain();
    master.connect(ctx.destination);
  }
  master!.gain.value = Math.max(0, Math.min(1, volume));
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  ac: AudioContext,
  { freq, start, duration, type = "triangle", gain = 0.3, slideTo }: {
    freq: number;
    start: number;
    duration: number;
    type?: OscillatorType;
    gain?: number;
    slideTo?: number;
  },
) {
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(env).connect(master!);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function unlockAudio(volume: number) {
  getContext(volume);
}

export function playTick(volume: number) {
  const ac = getContext(volume);
  if (!ac) return;
  tone(ac, { freq: 1900, start: ac.currentTime, duration: 0.035, type: "square", gain: 0.12 });
}

/** Engine-rev "vroom" when the wheel launches. */
export function playSpinStart(volume: number) {
  const ac = getContext(volume);
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const filter = ac.createBiquadFilter();
  const env = ac.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(70, t);
  osc.frequency.exponentialRampToValueAtTime(260, t + 0.45);
  osc.frequency.exponentialRampToValueAtTime(140, t + 0.9);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(600, t);
  filter.frequency.exponentialRampToValueAtTime(1800, t + 0.45);
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.22, t + 0.08);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
  osc.connect(filter).connect(env).connect(master!);
  osc.start(t);
  osc.stop(t + 1);
}

/** Short burst of filtered noise, used for the drum roll and the cymbal crash. */
function noise(ac: AudioContext, start: number, duration: number, gain: number, freq: number) {
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * duration), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const env = ac.createGain();
  src.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = freq;
  env.gain.setValueAtTime(gain, start);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  src.connect(filter).connect(env).connect(master!);
  src.start(start);
}

/** Big jackpot fanfare: drum roll, cymbal crash, rising brass arpeggios and sparkles. */
export function playJackpot(volume: number) {
  const ac = getContext(volume);
  if (!ac) return;
  const t = ac.currentTime + 0.02;
  for (let i = 0; i < 14; i++) noise(ac, t + i * 0.045, 0.06, 0.12 + i * 0.012, 180);
  const hit = t + 0.65;
  noise(ac, hit, 1.6, 0.3, 6000);
  const melody: [number, number, number][] = [
    [523.25, 0, 0.12], [659.25, 0.12, 0.12], [783.99, 0.24, 0.12], [1046.5, 0.36, 0.3],
    [987.77, 0.7, 0.12], [1046.5, 0.82, 0.12], [1174.66, 0.94, 0.12], [1318.51, 1.06, 0.9],
  ];
  for (const [freq, offset, duration] of melody) {
    tone(ac, { freq, start: hit + offset, duration, type: "triangle", gain: 0.3 });
    tone(ac, { freq: freq / 2, start: hit + offset, duration, type: "sawtooth", gain: 0.06 });
    tone(ac, { freq: freq * 1.5, start: hit + offset, duration, type: "sine", gain: 0.05 });
  }
  for (let i = 0; i < 10; i++) {
    tone(ac, { freq: 2000 + Math.random() * 2500, start: hit + 1.1 + i * 0.09, duration: 0.18, type: "sine", gain: 0.06 });
  }
}

/** Victory fanfare. */
export function playWin(volume: number) {
  const ac = getContext(volume);
  if (!ac) return;
  const t = ac.currentTime + 0.02;
  const notes: [number, number, number][] = [
    [523.25, 0, 0.14],
    [659.25, 0.13, 0.14],
    [783.99, 0.26, 0.14],
    [1046.5, 0.39, 0.5],
    [783.99, 0.62, 0.12],
    [1046.5, 0.74, 0.7],
  ];
  for (const [freq, offset, duration] of notes) {
    tone(ac, { freq, start: t + offset, duration, type: "triangle", gain: 0.28 });
    tone(ac, { freq: freq / 2, start: t + offset, duration, type: "square", gain: 0.05 });
  }
}
