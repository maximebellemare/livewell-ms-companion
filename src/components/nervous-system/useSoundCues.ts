import { useCallback, useRef, useState } from "react";

/**
 * Web-Audio-only sound cues for the Regulation Center.
 * Provides: start bell, ambient drone loop, countdown bell, end chime.
 * Zero external dependencies — everything is synthesised.
 */

// ─── Low-level helpers ────────────────────────────────────────

const getCtx = (): AudioContext | null => {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
};

/** Single sine bell with exponential decay */
const bell = (
  ctx: AudioContext,
  freq: number,
  time: number,
  dur: number,
  vol: number,
) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, time);
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(vol, time + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + dur);
};

// ─── Sound generators ─────────────────────────────────────────

/** Warm ascending 3-note bell — used at session start */
export const playStartBell = () => {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  bell(ctx, 396, t, 1.6, 0.10);        // G4
  bell(ctx, 528, t + 0.18, 1.4, 0.08); // C5
  bell(ctx, 660, t + 0.40, 1.8, 0.07); // E5
  setTimeout(() => ctx.close(), 3000);
};

/** Soft single bell — countdown warning */
export const playCountdownBell = () => {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  bell(ctx, 440, t, 0.8, 0.06); // A4 — gentle ping
  setTimeout(() => ctx.close(), 1500);
};

/** Completion chime — 3 ascending notes */
export const playEndChime = () => {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  bell(ctx, 523.25, t, 1.2, 0.12);        // C5
  bell(ctx, 659.25, t + 0.15, 1.0, 0.10); // E5
  bell(ctx, 783.99, t + 0.35, 1.6, 0.08); // G5
  setTimeout(() => ctx.close(), 3500);
};

// ─── Ambient drone ────────────────────────────────────────────

interface AmbientNodes {
  ctx: AudioContext;
  gain: GainNode;
  oscs: OscillatorNode[];
}

const startAmbient = (): AmbientNodes | null => {
  const ctx = getCtx();
  if (!ctx) return null;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2); // fade in
  master.connect(ctx.destination);

  // Layered soft pad: two detuned sines + a sub
  const freqs = [174.61, 220, 130.81]; // F3, A3, C3
  const oscs = freqs.map((f, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, ctx.currentTime);
    // slight detune for warmth
    osc.detune.setValueAtTime(i * 3 - 3, ctx.currentTime);
    const g = ctx.createGain();
    g.gain.setValueAtTime(i === 2 ? 0.5 : 1, ctx.currentTime); // sub quieter
    osc.connect(g);
    g.connect(master);
    osc.start();
    return osc;
  });

  return { ctx, gain: master, oscs };
};

const stopAmbient = (nodes: AmbientNodes | null) => {
  if (!nodes) return;
  const { ctx, gain, oscs } = nodes;
  try {
    const t = ctx.currentTime;
    gain.gain.linearRampToValueAtTime(0.0001, t + 1.5); // fade out
    setTimeout(() => {
      oscs.forEach((o) => { try { o.stop(); } catch {} });
      try { ctx.close(); } catch {}
    }, 2000);
  } catch {}
};

// ─── Hook ─────────────────────────────────────────────────────

export const useSoundCues = () => {
  const [enabled, setEnabled] = useState(false);
  const [ambientOn, setAmbientOn] = useState(false);
  const ambientRef = useRef<AmbientNodes | null>(null);
  const countdownFired = useRef(false);

  const onStart = useCallback(() => {
    if (!enabled) return;
    playStartBell();
    countdownFired.current = false;
  }, [enabled]);

  const onEnd = useCallback(() => {
    if (!enabled) return;
    playEndChime();
    stopAmbientLoop();
  }, [enabled]);

  /** Call each tick with secondsRemaining to trigger countdown bell */
  const onTick = useCallback(
    (secondsRemaining: number) => {
      if (!enabled) return;
      if (secondsRemaining === 10 && !countdownFired.current) {
        countdownFired.current = true;
        playCountdownBell();
      }
    },
    [enabled],
  );

  const startAmbientLoop = useCallback(() => {
    if (!enabled || ambientRef.current) return;
    ambientRef.current = startAmbient();
    setAmbientOn(true);
  }, [enabled]);

  const stopAmbientLoop = useCallback(() => {
    stopAmbient(ambientRef.current);
    ambientRef.current = null;
    setAmbientOn(false);
  }, []);

  const toggleAmbient = useCallback(() => {
    if (ambientRef.current) {
      stopAmbientLoop();
    } else if (enabled) {
      startAmbientLoop();
    }
  }, [enabled, startAmbientLoop, stopAmbientLoop]);

  /** Clean up on unmount or disable */
  const cleanup = useCallback(() => {
    stopAmbientLoop();
    countdownFired.current = false;
  }, [stopAmbientLoop]);

  return {
    enabled,
    setEnabled,
    ambientOn,
    onStart,
    onEnd,
    onTick,
    startAmbientLoop,
    stopAmbientLoop,
    toggleAmbient,
    cleanup,
  };
};
