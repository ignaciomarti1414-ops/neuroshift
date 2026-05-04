import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { useNeuroStore } from '../store/useNeuroStore';
import { X } from 'lucide-react';

export const Phase2Friction = ({ onCancel }: { onCancel: () => void }) => {
  const nextPhase = useNeuroStore((state) => state.nextPhase);
  const [isPressed, setIsPressed] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  const controls = useAnimation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startInteraction = () => {
    setIsPressed(true);
    setInterrupted(false);
    
    // Animate the sphere shrinking linearly over 30 seconds
    controls.start({
      scale: 0.2,
      opacity: 0.8,
      boxShadow: "0 0 80px rgba(0,240,255,0.8), inset 0 0 60px rgba(0,240,255,0.6)",
      transition: { duration: 30, ease: 'linear' }
    });

    timeoutRef.current = setTimeout(() => {
      // 30 seconds completed
      controls.start({
        scale: 0,
        opacity: 0,
        transition: { duration: 0.5, ease: 'easeIn' }
      }).then(() => {
        nextPhase();
      });
    }, 30000);
  };

  const stopInteraction = () => {
    if (!isPressed) return;
    setIsPressed(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setInterrupted(true);
    controls.start({
      scale: 1,
      opacity: 1,
      boxShadow: "0 0 40px rgba(0,240,255,0.4), inset 0 0 40px rgba(0,240,255,0.2)",
      transition: { type: 'spring', stiffness: 200, damping: 12 }
    });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <main className="flex-1 flex flex-col items-center justify-start py-4 md:py-8 w-full max-w-md mx-auto select-none overflow-hidden touch-none h-full relative">
      <h2 className="text-xl md:text-3xl font-light text-primary glow-text uppercase tracking-widest mb-1 text-center w-full shrink-0">
        Inhibición Activa
      </h2>
      
      <div className="glass-panel w-full flex-1 flex flex-col items-center relative overflow-hidden mt-2 mb-4 justify-between min-h-0">
        <h3 className="text-xs text-on-surface-variant font-mono uppercase tracking-[0.2em] m-4 md:m-6 text-center shrink-0">
          Fase 2: Surf de Impulso
        </h3>
        
        <div className="flex-1 w-full flex items-center justify-center relative touch-none py-4 min-h-[220px]">
           {/* Background glow when pressed */}
           <div className={`absolute inset-0 bg-primary/5 rounded-full blur-[60px] transition-opacity duration-1000 ${isPressed ? 'opacity-100' : 'opacity-0'} pointer-events-none`}></div>
           
           <motion.div
             animate={controls}
             initial={{ 
               scale: 1, opacity: 1, 
               boxShadow: "0 0 40px rgba(0,240,255,0.4), inset 0 0 40px rgba(0,240,255,0.2)" 
             }}
             onPointerDown={startInteraction}
             onPointerUp={stopInteraction}
             onPointerLeave={stopInteraction}
             onPointerCancel={stopInteraction}
             className="w-48 h-48 sm:w-60 sm:h-60 md:w-64 md:h-64 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(0,240,255,0.15),_transparent)] border border-primary/30 backdrop-blur-md cursor-pointer flex items-center justify-center touch-none"
             style={{ touchAction: 'none' }}
           >
             <div className="w-[80%] h-[80%] rounded-full border border-primary/40 border-dashed animate-[spin_10s_linear_infinite] opacity-50 relative pointer-events-none"></div>
             <div className="absolute w-[60%] h-[60%] rounded-full border border-primary/60 border-dotted animate-[spin_15s_linear_infinite_reverse] opacity-50 pointer-events-none"></div>
           </motion.div>
        </div>

        <div className="min-h-[80px] flex items-center justify-center text-center px-4 mb-4 shrink-0">
          <p className={`font-mono text-[10px] sm:text-xs tracking-widest leading-relaxed transition-colors duration-300 ${interrupted ? 'text-[#ff0055] uppercase' : isPressed ? 'text-primary uppercase' : 'text-on-surface-variant uppercase'} `}>
            {interrupted 
              ? "Conexión interrumpida. Mantén presionado de nuevo." 
              : isPressed 
                ? "Mantén para comprimir el impulso..." 
                : "Mantén presionada la esfera para empezar"}
          </p>
        </div>
      </div>

      <div className="w-full flex items-end justify-center max-w-md mx-auto z-10 shrink-0">
        <button 
          onClick={onCancel}
          className="px-6 py-3 w-full sm:w-auto rounded-lg bg-[rgba(255,0,85,0.05)] border border-[rgba(255,0,85,0.2)] text-[#ff0055]/80 font-mono text-xs uppercase tracking-widest hover:bg-[rgba(255,0,85,0.1)] hover:text-[#ff0055] transition-colors flex items-center justify-center gap-2" 
          type="button"
        >
          <X className="w-4 h-4" />
          Abortar y Salir
        </button>
      </div>
    </main>
  );
};
