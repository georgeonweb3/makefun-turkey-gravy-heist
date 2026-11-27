// WebAudio synth sounds: no audio files, everything is oscillators and filtered noise.
// Created lazily on the first user gesture so browsers allow it; safe to call before that
// (calls are no-ops until the context exists). M toggles mute.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let noiseBuf = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const len = ctx.sampleRate * 0.5;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo, delay) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, freq, delay) {
    if (muted) return;
    const c = ensure();
    if (!c || !noiseBuf) return;
    const t0 = c.currentTime + (delay || 0);
    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq || 1200;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol || 0.2, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    jump() { tone(280, 0.16, 'square', 0.08, 520); },
    gobble() {
      tone(220, 0.09, 'sawtooth', 0.12, 140);
      tone(220, 0.09, 'sawtooth', 0.12, 140, 0.1);
      tone(260, 0.12, 'sawtooth', 0.12, 120, 0.2);
    },
    pickup() { tone(660, 0.09, 'sine', 0.14, 990); tone(990, 0.12, 'sine', 0.1, 1320, 0.07); },
    golden() { tone(523, 0.1, 'triangle', 0.16); tone(659, 0.1, 'triangle', 0.16, null, 0.09); tone(784, 0.18, 'triangle', 0.16, null, 0.18); },
    splat() { noise(0.18, 0.25, 900); tone(160, 0.2, 'sine', 0.18, 60); },
    grease() { noise(0.35, 0.16, 2400); tone(900, 0.3, 'sine', 0.06, 300); },
    slip() { tone(700, 0.5, 'sine', 0.14, 120); noise(0.4, 0.22, 700, 0.15); },
    gate() { tone(392, 0.12, 'triangle', 0.15); tone(587, 0.2, 'triangle', 0.15, null, 0.1); },
    zone() { tone(440, 0.14, 'triangle', 0.14); tone(554, 0.14, 'triangle', 0.14, null, 0.12); tone(659, 0.22, 'triangle', 0.14, null, 0.24); },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.16, null, i * 0.14));
      tone(1319, 0.5, 'triangle', 0.14, null, 0.6);
    },
    lose() { tone(392, 0.3, 'sawtooth', 0.1, 370); tone(370, 0.3, 'sawtooth', 0.1, 350, 0.28); tone(311, 0.6, 'sawtooth', 0.1, 220, 0.56); },
  };
}
