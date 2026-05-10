import { useCallback, useRef } from 'react';

interface SoundRefs {
  ctx: AudioContext | null;
}

const soundRefs: SoundRefs = { ctx: null };

const getCtx = (): AudioContext => {
  if (!soundRefs.ctx) {
    soundRefs.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (soundRefs.ctx.state === 'suspended') {
    soundRefs.ctx.resume();
  }
  return soundRefs.ctx;
};

const playTone = (ctx: AudioContext, freq: number, duration: number, gain: number, type: OscillatorType = 'sine') => {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export const useCeremonialSounds = () => {
  const audioEnabledRef = useRef(true);

  const setAudioEnabled = useCallback((enabled: boolean) => {
    audioEnabledRef.current = enabled;
  }, []);

  const playPhaseComplete = useCallback(() => {
    if (!audioEnabledRef.current) return;
    try {
      const ctx = getCtx();
      playTone(ctx, 528, 0.4, 0.15, 'sine');
      setTimeout(() => playTone(ctx, 660, 0.6, 0.12, 'sine'), 300);
    } catch {}
  }, []);

  const playSessionComplete = useCallback(() => {
    if (!audioEnabledRef.current) return;
    try {
      const ctx = getCtx();
      playTone(ctx, 396, 0.5, 0.2, 'sine');
      setTimeout(() => playTone(ctx, 528, 0.5, 0.18, 'sine'), 400);
      setTimeout(() => playTone(ctx, 639, 0.8, 0.15, 'sine'), 800);
    } catch {}
  }, []);

  const playDeepWorkStart = useCallback(() => {
    if (!audioEnabledRef.current) return;
    try {
      const ctx = getCtx();
      playTone(ctx, 174, 1.0, 0.1, 'sine');
      setTimeout(() => playTone(ctx, 285, 0.8, 0.08, 'sine'), 600);
    } catch {}
  }, []);

  const playDeepWorkEnd = useCallback(() => {
    if (!audioEnabledRef.current) return;
    try {
      const ctx = getCtx();
      playTone(ctx, 639, 0.6, 0.2, 'sine');
      setTimeout(() => playTone(ctx, 528, 0.8, 0.15, 'sine'), 500);
      setTimeout(() => playTone(ctx, 432, 1.2, 0.12, 'sine'), 1000);
    } catch {}
  }, []);

  const playAchievementUnlock = useCallback(() => {
    if (!audioEnabledRef.current) return;
    try {
      const ctx = getCtx();
      playTone(ctx, 528, 0.15, 0.2, 'sine');
      setTimeout(() => playTone(ctx, 639, 0.15, 0.18, 'sine'), 120);
      setTimeout(() => playTone(ctx, 741, 0.15, 0.15, 'sine'), 240);
      setTimeout(() => playTone(ctx, 852, 0.4, 0.12, 'sine'), 360);
    } catch {}
  }, []);

  const playError = useCallback(() => {
    if (!audioEnabledRef.current) return;
    try {
      const ctx = getCtx();
      playTone(ctx, 200, 0.3, 0.15, 'sawtooth');
    } catch {}
  }, []);

  return {
    setAudioEnabled,
    playPhaseComplete,
    playSessionComplete,
    playDeepWorkStart,
    playDeepWorkEnd,
    playAchievementUnlock,
    playError,
  };
};
