import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNeuroStore } from '../store/useNeuroStore';
import { Activity, Brain, Target, ArrowRight, CheckCircle2 } from 'lucide-react';

const ONBOARDING_STEPS = [
  {
    title: 'El Problema',
    description: 'La sobreestimulación digital y el multitasking fragmentan la atención, disminuyen los niveles de dopamina basal y generan niebla mental.',
    icon: <Activity className="w-12 h-12 text-error mb-4" />
  },
  {
    title: 'El Protocolo',
    description: 'NeuroShift es una intervención guiada en 4 fases: Medición, Respiración Coherente, Carga Visuoespacial (Tetris) y Memoria de Trabajo (N-Back).',
    icon: <Brain className="w-12 h-12 text-primary mb-4" />
  },
  {
    title: 'El Objetivo',
    description: 'Resetear tu estado prefrontal para entrar al "Deep Work Búnker" con máxima concentración y cero distracciones.',
    icon: <Target className="w-12 h-12 text-success mb-4" />
  }
];

export const Onboarding = () => {
  const [step, setStep] = useState(0);
  const setHasSeenOnboarding = useNeuroStore((state) => state.setHasSeenOnboarding);

  const handleNext = () => {
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setHasSeenOnboarding(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.05),transparent_50%)] pointer-events-none" />
      
      <div className="w-full max-w-sm flex flex-col items-center z-10">
        <h1 className="text-2xl font-light tracking-wide mb-8 text-center text-on-surface uppercase glow-text">NeuroShift</h1>
        
        <div className="h-64 relative w-full mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col items-center text-center p-6 glass-panel"
            >
              {ONBOARDING_STEPS[step].icon}
              <h2 className="text-lg font-mono text-on-surface uppercase tracking-widest mb-4">
                {ONBOARDING_STEPS[step].title}
              </h2>
              <p className="text-sm text-on-surface-variant font-mono leading-relaxed">
                {ONBOARDING_STEPS[step].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-2 mb-8">
          {ONBOARDING_STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === step ? 'bg-primary w-6 shadow-[0_0_8px_rgba(0,240,255,0.8)]' : 'bg-surface-dim'
              }`}
            />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4"
        >
          {step === ONBOARDING_STEPS.length - 1 ? (
            <>Comenzar Protocolo <CheckCircle2 className="w-5 h-5" /></>
          ) : (
            <>Siguiente <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </div>
  );
};
