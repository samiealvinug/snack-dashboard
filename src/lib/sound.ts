let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, duration: number, gain = 0.18) {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const vol = audio.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const t = audio.currentTime + start;
  vol.gain.setValueAtTime(0.0001, t);
  vol.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  vol.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(vol).connect(audio.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

/** Classic cash-register "ka-ching" chime. */
export function playCashChime() {
  tone(1318.5, 0, 0.22, 0.2);
  tone(1760, 0.06, 0.35, 0.16);
  tone(2637, 0.12, 0.45, 0.1);
}

export function playBeep() {
  tone(880, 0, 0.09, 0.12);
}

export function playAlert() {
  tone(440, 0, 0.16, 0.14);
  tone(330, 0.14, 0.24, 0.12);
}

export function playError() {
  tone(185, 0, 0.18, 0.16);
  tone(155, 0.2, 0.3, 0.14);
}
