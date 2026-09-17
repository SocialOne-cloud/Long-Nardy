/**
 * Small synthesised effects — no audio files to ship or pre-load, and
 * nothing plays until the first user gesture has unlocked audio.
 */
type Effect = 'dice' | 'checker' | 'win';

let ctx: AudioContext | null = null;
let enabled = true;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (ctx === null) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function tone(at: number, freq: number, duration: number, gain: number, type: OscillatorType = 'sine') {
  const audio = context();
  if (!audio) return;
  const osc = audio.createOscillator();
  const vol = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  vol.gain.setValueAtTime(0.0001, at);
  vol.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  vol.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(vol).connect(audio.destination);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

export function play(effect: Effect) {
  if (!enabled) return;
  const audio = context();
  if (!audio) return;
  const now = audio.currentTime;

  if (effect === 'checker') {
    tone(now, 520, 0.07, 0.05, 'triangle');
    return;
  }
  if (effect === 'dice') {
    for (let i = 0; i < 5; i += 1) {
      tone(now + i * 0.055, 180 + Math.random() * 220, 0.05, 0.035, 'square');
    }
    return;
  }
  [0, 0.12, 0.24, 0.42].forEach((offset, i) => {
    tone(now + offset, [523.25, 659.25, 783.99, 1046.5][i], 0.4, 0.06, 'sine');
  });
}
