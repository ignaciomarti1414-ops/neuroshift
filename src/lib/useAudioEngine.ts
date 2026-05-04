import { useEffect, useRef, useState, useCallback } from 'react';

export type NoiseType = 'white' | 'pink' | 'brown' | 'green' | 'grey';

/**
 * Custom hook to manage the Web Audio API engine.
 * Specifically designed to generate Binaural Beats and colored noise.
 * Requires the user to have stereo headphones for the binaural effect.
 */
export const useAudioEngine = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const noiseNodeRef = useRef<AudioWorkletNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const lastNoiseTypeRef = useRef<NoiseType>('brown');

  /**
   * Initializes the AudioContext, nodes and oscillators for binaural beat generation.
   * Modulates frequencies to the left and right ear to create a beat frequency in the brain.
   */
  const initAudio = useCallback(async (initialNoiseType: NoiseType = 'brown') => {
    if (audioCtxRef.current) return;
    
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;
    lastNoiseTypeRef.current = initialNoiseType;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.5;
    gainNode.connect(ctx.destination);
    gainNodeRef.current = gainNode;

    try {
      await ctx.audioWorklet.addModule('/noise-worklet.js');
      const noiseNode = new AudioWorkletNode(ctx, `${initialNoiseType}-noise-processor`);
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.05; // background noise level
      noiseNode.connect(noiseGain);
      noiseGain.connect(gainNode);
      noiseNodeRef.current = noiseNode;
      noiseGainRef.current = noiseGain;
    } catch (err) {
      console.error("Failed to load noise-worklet:", err);
    }

    // Carrier frequency for Binaural Beats
    const carrierFreq = 400;

    const merger = ctx.createChannelMerger(2);
    merger.connect(gainNode);

    const leftOsc = ctx.createOscillator();
    leftOsc.type = 'sine';
    leftOsc.frequency.value = carrierFreq;
    leftOsc.connect(merger, 0, 0); // connect to left channel
    leftOsc.start();
    leftOscRef.current = leftOsc;

    const rightOsc = ctx.createOscillator();
    rightOsc.type = 'sine';
    // Offset will be applied dynamically
    rightOsc.frequency.value = carrierFreq + 14; // Default to 14Hz (Beta)
    rightOsc.connect(merger, 0, 1); // connect to right channel
    rightOsc.start();
    rightOscRef.current = rightOsc;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    setIsInitialized(true);
  }, []);

  const setNoiseType = useCallback((type: NoiseType) => {
    if (!audioCtxRef.current || !noiseGainRef.current || lastNoiseTypeRef.current === type) return;
    try {
      const ctx = audioCtxRef.current;
      if (noiseNodeRef.current) {
        noiseNodeRef.current.disconnect();
      }
      
      const newNoiseNode = new AudioWorkletNode(ctx, `${type}-noise-processor`);
      newNoiseNode.connect(noiseGainRef.current);
      noiseNodeRef.current = newNoiseNode;
      lastNoiseTypeRef.current = type;
    } catch (err) {
      console.error(`Failed to change noise type to ${type}:`, err);
    }
  }, []);

  /**
   * Sweeps the binaural beat frequency to a new target over a specified duration.
   * This is used to guide brainwave entrainment (e.g., from Beta to Alpha).
   * 
   * @param {number} targetOffsetHz - The target beat frequency (e.g., 10 for Alpha, 15 for Beta).
   * @param {number} durationSeconds - The time in seconds to ramp to the target frequency.
   */
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
      // Use relatively fast ramp for volume to prevent clicks
      gainNodeRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.015);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
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
