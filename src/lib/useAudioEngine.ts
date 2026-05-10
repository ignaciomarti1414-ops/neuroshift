import { useEffect, useRef, useState, useCallback } from 'react';

export type NoiseType = 'white' | 'pink' | 'brown' | 'green' | 'grey';

interface NoiseBufferRefs {
  bufferSource: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
}

const NOISE_COLORS: NoiseType[] = ['white', 'pink', 'brown', 'green', 'grey'];

export const useAudioEngine = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const noiseNodeRef = useRef<AudioWorkletNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const lastNoiseTypeRef = useRef<NoiseType>('brown');
  const noiseBufferRefsRef = useRef<NoiseBufferRefs>({ bufferSource: null, gainNode: null });
  const useBufferFallbackRef = useRef(false);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);

  const generateNoiseBuffer = useCallback((ctx: AudioContext, type: NoiseType): AudioBuffer => {
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * 2;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let lastOut = 0;
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;

        switch (type) {
          case 'white':
            data[i] = white * 0.15;
            break;
          case 'pink':
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
            break;
          case 'brown':
            data[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
            break;
          case 'grey':
            data[i] = (white * 0.8 + lastOut * 0.2) * 0.3;
            lastOut = white;
            break;
          case 'green':
            data[i] = (white - lastOut) * 0.5;
            lastOut = white;
            break;
        }
      }
    }
    return buffer;
  }, []);

  const playNoiseBuffer = useCallback((ctx: AudioContext, type: NoiseType, destination: AudioNode) => {
    if (noiseBufferRefsRef.current.bufferSource) {
      try { noiseBufferRefsRef.current.bufferSource.stop(); } catch {}
      noiseBufferRefsRef.current.bufferSource.disconnect();
    }
    if (noiseBufferRefsRef.current.gainNode) {
      noiseBufferRefsRef.current.gainNode.disconnect();
    }

    if (!noiseBufferRef.current) {
      noiseBufferRef.current = generateNoiseBuffer(ctx, type);
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBufferRef.current;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = 0.05;

    source.connect(gain);
    gain.connect(destination);
    source.start();

    noiseBufferRefsRef.current = { bufferSource: source, gainNode: gain };
  }, [generateNoiseBuffer]);

  const initAudio = useCallback(async (initialNoiseType: NoiseType = 'brown') => {
    if (audioCtxRef.current) return;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;
    lastNoiseTypeRef.current = initialNoiseType;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.5;
    gainNode.connect(ctx.destination);
    gainNodeRef.current = gainNode;

    let workletLoaded = false;
    try {
      await ctx.audioWorklet.addModule('/noise-worklet.js');
      const noiseNode = new AudioWorkletNode(ctx, `${initialNoiseType}-noise-processor`);
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.05;
      noiseNode.connect(noiseGain);
      noiseGain.connect(gainNode);
      noiseNodeRef.current = noiseNode;
      noiseGainRef.current = noiseGain;
      workletLoaded = true;
    } catch (err) {
      console.warn('AudioWorklet not supported, using buffer fallback for noise:', err);
      playNoiseBuffer(ctx, initialNoiseType, gainNode);
      useBufferFallbackRef.current = true;
    }

    const carrierFreq = 400;
    const merger = ctx.createChannelMerger(2);
    merger.connect(gainNode);

    const leftOsc = ctx.createOscillator();
    leftOsc.type = 'sine';
    leftOsc.frequency.value = carrierFreq;
    leftOsc.connect(merger, 0, 0);
    leftOsc.start();
    leftOscRef.current = leftOsc;

    const rightOsc = ctx.createOscillator();
    rightOsc.type = 'sine';
    rightOsc.frequency.value = carrierFreq + 14;
    rightOsc.connect(merger, 0, 1);
    rightOsc.start();
    rightOscRef.current = rightOsc;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    setIsInitialized(true);
  }, [playNoiseBuffer]);

  const setNoiseType = useCallback((type: NoiseType) => {
    if (!audioCtxRef.current || !gainNodeRef.current || lastNoiseTypeRef.current === type) return;

    if (useBufferFallbackRef.current) {
      noiseBufferRef.current = null;
      playNoiseBuffer(audioCtxRef.current, type, gainNodeRef.current);
      lastNoiseTypeRef.current = type;
      return;
    }

    try {
      const ctx = audioCtxRef.current;
      if (noiseNodeRef.current) {
        noiseNodeRef.current.disconnect();
      }

      const newNoiseNode = new AudioWorkletNode(ctx, `${type}-noise-processor`);
      newNoiseNode.connect(gainNodeRef.current);
      noiseNodeRef.current = newNoiseNode;
      lastNoiseTypeRef.current = type;
    } catch (err) {
      console.warn(`Failed to change noise type to ${type}:`, err);
      useBufferFallbackRef.current = true;
      noiseBufferRef.current = null;
      playNoiseBuffer(audioCtxRef.current, type, gainNodeRef.current);
    }
  }, [playNoiseBuffer]);

  const setFrequencySweep = useCallback((targetOffsetHz: number, durationSeconds: number) => {
    if (!audioCtxRef.current || !rightOscRef.current) return;

    const ctx = audioCtxRef.current;
    const rightOsc = rightOscRef.current;

    rightOsc.frequency.cancelScheduledValues(ctx.currentTime);
    rightOsc.frequency.setValueAtTime(rightOsc.frequency.value, ctx.currentTime);
    rightOsc.frequency.linearRampToValueAtTime(400 + targetOffsetHz, ctx.currentTime + durationSeconds);
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.015);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioCtxRef.current) {
      leftOscRef.current?.stop();
      rightOscRef.current?.stop();
      noiseNodeRef.current?.disconnect();
      noiseGainRef.current?.disconnect();
      gainNodeRef.current?.disconnect();

      if (noiseBufferRefsRef.current.bufferSource) {
        try { noiseBufferRefsRef.current.bufferSource.stop(); } catch {}
        noiseBufferRefsRef.current.bufferSource.disconnect();
      }
      if (noiseBufferRefsRef.current.gainNode) {
        noiseBufferRefsRef.current.gainNode.disconnect();
      }

      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
      leftOscRef.current = null;
      rightOscRef.current = null;
      noiseNodeRef.current = null;
      noiseGainRef.current = null;
      gainNodeRef.current = null;
      noiseBufferRefsRef.current = { bufferSource: null, gainNode: null };
      useBufferFallbackRef.current = false;
      noiseBufferRef.current = null;
    }
    setIsInitialized(false);
  }, []);

  return {
    initAudio,
    stopAudio,
    setFrequencySweep,
    setVolume,
    setNoiseType,
    isInitialized
  };
};
