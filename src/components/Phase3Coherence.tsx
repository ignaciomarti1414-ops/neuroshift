import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNeuroStore } from '../store/useNeuroStore';

export const Phase3Coherence = () => {
  const coherenceDuration = useNeuroStore((state) => state.coherenceDuration);
  const [phase, setPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [timeLeft, setTimeLeft] = useState(coherenceDuration);
  const nextPhase = useNeuroStore((state) => state.nextPhase);

  const startTimeRef = useRef<number>(Date.now());
  const endTimeRef = useRef<number>(Date.now() + coherenceDuration * 1000);
  const cycleTimerRef = useRef<number>(0);
  const countdownTimerRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const isPausedRef = useRef(false);

  const CYCLE_DURATION = 16000;
  const PHASE_DURATION = 4000;

  useEffect(() => {
    const phases: Array<'inhale' | 'hold1' | 'exhale' | 'hold2'> = ['inhale', 'hold1', 'exhale', 'hold2'];

    const runCycle = () => {
      if (isPausedRef.current) return;
      const elapsed = (Date.now() - startTimeRef.current) % CYCLE_DURATION;
      const newPhaseIndex = Math.floor(elapsed / PHASE_DURATION) % 4;
      setPhase(phases[newPhaseIndex]);
    };

    const updateTimer = () => {
      if (isPausedRef.current) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(cycleTimerRef.current);
        clearInterval(countdownTimerRef.current);
        nextPhase();
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        isPausedRef.current = true;
        pausedTimeRef.current = Date.now();
      } else if (isPausedRef.current) {
        const pauseDuration = Date.now() - pausedTimeRef.current;
        startTimeRef.current += pauseDuration;
        endTimeRef.current += pauseDuration;
        isPausedRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    cycleTimerRef.current = window.setInterval(runCycle, 250);
    countdownTimerRef.current = window.setInterval(updateTimer, 250);
    runCycle();
    updateTimer();

    return () => {
      clearInterval(cycleTimerRef.current);
      clearInterval(countdownTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [nextPhase]);

  const getPhaseText = () => {
    switch(phase) {
      case 'inhale': return 'Inhala';
      case 'hold1': return 'Mantén';
      case 'exhale': return 'Exhala';
      case 'hold2': return 'Mantén';
    }
  };

  const getPhaseSubtext = () => {
    switch(phase) {
      case 'inhale': return 'Por la nariz';
      case 'hold1': return 'Mantén la respiración';
      case 'exhale': return 'Por la boca';
      case 'hold2': return 'Vacío';
    }
  };

  const getScale = () => {
    switch(phase) {
      case 'inhale': return 1.5;
      case 'hold1': return 1.5;
      case 'exhale': return 0.8;
      case 'hold2': return 0.8;
    }
  };

  const getOpacity = () => {
    switch(phase) {
      case 'inhale': return 1;
      case 'hold1': return 1;
      case 'exhale': return 0.5;
      case 'hold2': return 0.5;
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-background w-full p-4">
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.05),transparent_60%)] pointer-events-none z-0"></div>

      <div className="flex flex-col items-center w-full max-w-md mx-auto z-10 pt-4">
        <h2 className="text-xl md:text-3xl font-light text-primary glow-text uppercase tracking-widest mb-2 text-center w-full">
          Neuro-Coherencia
        </h2>
        <p className="text-on-surface-variant font-mono text-xs mb-8 text-center uppercase tracking-widest leading-relaxed">
          Respira con el ritmo<br/>Inhala 4s, Mantén 4s...
        </p>

        <div className="glass-panel w-full p-8 flex flex-col items-center relative overflow-hidden mb-8 h-[360px] justify-center">
            <h3 className="absolute top-8 text-xs text-on-surface-variant font-mono uppercase tracking-[0.2em] text-center w-full">
              Fase 3: Respiración
            </h3>

            <div className="flex-1 w-full flex items-center justify-center relative mt-6">
              <motion.div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                animate={{
                  scale: getScale(),
                  opacity: getOpacity(),
                }}
                transition={{
                  duration: (phase === 'inhale' || phase === 'exhale') ? 4 : 0, // No duration for holds
                  ease: "easeInOut"
                }}
              >
                <div className="w-[180px] h-[180px] bg-primary/20 rounded-full blur-[30px]"></div>
                <div className="absolute w-[140px] h-[140px] border border-primary/50 rounded-full"></div>
                <div className="absolute w-[180px] h-[180px] border border-primary/20 rounded-full border-dashed"></div>
              </motion.div>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 text-shadow-sm mix-blend-screen">
                <AnimatePresence mode="wait">
                  <motion.h2 
                    key={phase}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl font-light tracking-wide mb-1 text-white"
                  >
                    {getPhaseText()}
                  </motion.h2>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={`${phase}-sub`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-on-surface-variant font-mono text-[10px] tracking-widest uppercase"
                  >
                    {getPhaseSubtext()}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
            
            <div className="absolute bottom-8 text-xl font-mono text-white text-center w-full flex flex-col items-center" aria-live="polite" aria-atomic="true">
                <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Restante</span>
            </div>
        </div>

        <div className="w-full flex items-center justify-center">
            <button
              onClick={nextPhase}
              className="px-6 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-on-surface-variant font-mono text-xs uppercase tracking-widest hover:bg-[rgba(255,255,255,0.1)] hover:text-white transition-colors"
            >
              Omitir Coherencia
            </button>
        </div>
      </div>
    </main>
  );
};
