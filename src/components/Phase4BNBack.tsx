import { useState, useEffect, useRef, useCallback } from 'react';
import { useNeuroStore } from '../store/useNeuroStore';

export const Phase4BNBack = () => {
  const [activeSquare, setActiveSquare] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'success' | 'error' | 'miss' | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isStarted, setIsStarted] = useState(false);
  const [isMatchStatus, setIsMatchStatus] = useState<boolean>(false);
  
  const historyRef = useRef<number[]>([]);
  const timeoutRef = useRef<number>();
  const respondedRef = useRef<boolean>(false);
  
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const falseAlarmsRef = useRef(0);

  const nextPhase = useNeuroStore(state => state.nextPhase);
  const nBackLevel = useNeuroStore(state => state.nBackLevel);
  const evaluateCognitiveLoad = useNeuroStore(state => state.evaluateCognitiveLoad);

  const INTERVAL_MS = 2000;

  const handleComplete = useCallback(() => {
    const hits = hitsRef.current;
    const misses = missesRef.current;
    const falseAlarms = falseAlarmsRef.current;
    const total = hits + misses + falseAlarms;
    const accuracy = total > 0 ? (hits / total) * 100 : 100; // if they got zero possible, 100%
    
    evaluateCognitiveLoad(accuracy);
    nextPhase();
  }, [nextPhase, evaluateCognitiveLoad]);

  useEffect(() => {
    if (!isStarted) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, handleComplete]);

  const stepTask = useCallback(() => {
    const history = historyRef.current;
    
    // Check for missed matches
    if (history.length > nBackLevel && !respondedRef.current) {
      const prev = history[history.length - 1];
      const target = history[history.length - 1 - nBackLevel];
      if (prev === target) {
        setScore(s => Math.max(0, s - 1));
        setFeedback('miss');
        missesRef.current++;
      } else {
        setFeedback(null);
      }
    } else if (respondedRef.current) {
      setFeedback(null);
    }

    respondedRef.current = false;
    setIsMatchStatus(false);
    
    let nextSquare: number;
    const shouldMatch = Math.random() < 0.3; // 30% chance of being a match
    
    if (shouldMatch && history.length >= nBackLevel) {
       nextSquare = history[history.length - nBackLevel];
    } else {
       do {
         nextSquare = Math.floor(Math.random() * 9);
       } while (history.length >= nBackLevel && nextSquare === history[history.length - nBackLevel]);
    }

    // Brief blanking to separate visual pulses
    setActiveSquare(null);
    historyRef.current.push(nextSquare);
    
    setTimeout(() => {
        setActiveSquare(nextSquare);
    }, 150);
    
    timeoutRef.current = window.setTimeout(stepTask, INTERVAL_MS);
  }, [nBackLevel]);

  const startGame = () => {
    setIsStarted(true);
    stepTask();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMatch = () => {
    if (respondedRef.current) return;
    
    const history = historyRef.current;
    if (history.length <= nBackLevel) return;
    
    respondedRef.current = true;
    setIsMatchStatus(true);
    
    const current = history[history.length - 1];
    const previous = history[history.length - 1 - nBackLevel];
    
    if (current === previous) {
      setScore(s => s + 1);
      setFeedback('success');
      hitsRef.current++;
    } else {
      setScore(s => Math.max(0, s - 1));
      setFeedback('error');
      falseAlarmsRef.current++;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-6 overflow-hidden w-full h-full min-h-0">
      <div className="flex flex-col items-center w-full max-w-md h-full py-2 justify-center">
        <h2 className="text-xl md:text-3xl font-light text-primary glow-text uppercase tracking-widest mb-1 text-center w-full shrink-0">
          Carga Ejecutiva
        </h2>
        <p className="text-on-surface-variant font-mono text-[10px] md:text-xs mb-2 md:mb-6 text-center uppercase tracking-widest shrink-0">
          Integración de Reconocimiento de Patrones
        </p>

        <div className="glass-panel w-full p-4 md:p-6 mb-2 md:mb-6 flex-1 flex flex-col min-h-[300px]">
           <h3 className="text-[10px] md:text-xs text-on-surface-variant font-mono uppercase tracking-[0.2em] mb-2 md:mb-4 text-center shrink-0">
             Fase 4B: Memoria de Trabajo
           </h3>
           
           <div className="flex justify-between w-full mb-2 md:mb-6 relative shrink-0">
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className="text-primary font-mono text-[10px] tracking-widest opacity-50 uppercase shadow-[0_0_10px_rgba(0,180,255,0.5)]">
                    Calibración actual: {nBackLevel}-Back
                 </span>
             </div>
             <div className="font-mono text-white flex flex-col z-10">
                <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Tiempo</span>
                <span className="text-xl md:text-2xl font-light text-white">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
             </div>
             <div className="font-mono text-white flex flex-col items-end z-10">
                <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Puntos</span>
                <span className="text-xl md:text-2xl font-light text-primary glow-text">{score}</span>
             </div>
          </div>
          
          <div className="flex justify-center flex-1 items-center mb-2 md:mb-6 min-h-[160px]">
            <div className="glass p-2 md:p-3 rounded-xl border border-[rgba(255,255,255,0.05)] shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] aspect-square h-full max-h-[180px] md:max-h-[220px]">
              <div className="grid grid-cols-3 gap-1 md:gap-2 w-full h-full">
                {Array(9).fill(null).map((_, i) => (
                  <div 
                    key={i} 
                    className={`rounded transition-all duration-200 border shadow-inner ${
                      activeSquare === i 
                        ? 'bg-[rgba(0,240,255,0.6)] border-[rgba(0,240,255,0.8)] shadow-[0_0_20px_rgba(0,240,255,0.6)] scale-[0.95]' 
                        : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <p className="text-[8px] md:text-[10px] text-on-surface-variant font-mono mb-2 md:mb-4 text-center uppercase tracking-widest leading-relaxed shrink-0">
             Presiona COINCIDE si el cuadrado actual<br/>coincide con {nBackLevel === 1 ? 'el anterior' : `el de ${nBackLevel} turnos atrás`}.
          </p>

          <div className="min-h-[80px] flex flex-col items-center justify-end w-full shrink-0">
            {!isStarted ? (
              <button 
                onClick={startGame}
                className="btn-primary w-full shadow-lg"
              >
                Iniciar Protocolo
              </button>
            ) : (
              <div className="flex flex-col items-center w-full">
                 <button 
                   onClick={handleMatch}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' || e.key === ' ') {
                       e.preventDefault();
                       handleMatch();
                     }
                   }}
                   tabIndex={0}
                   aria-label="Coincide. Presiona Enter o Espacio."
                   disabled={isMatchStatus}
                   className={`h-12 md:h-16 w-full rounded-2xl border border-[rgba(255,255,255,0.1)] uppercase tracking-[0.2em] text-sm md:text-lg transition-all font-light outline-none active:scale-95 flex items-center justify-center focus:ring-2 focus:ring-primary ${
                     isMatchStatus && feedback === 'success'
                       ? 'bg-[rgba(0,255,157,0.1)] border-[rgba(0,255,157,0.5)] text-[#00ff9d] shadow-[0_0_20px_rgba(0,255,157,0.2)]' 
                       : isMatchStatus && feedback === 'error'
                       ? 'bg-[rgba(255,0,85,0.1)] border-[rgba(255,0,85,0.5)] text-[#ff0055]'
                       : 'bg-[rgba(0,240,255,0.05)] text-primary hover:bg-[rgba(0,240,255,0.1)] shadow-[0_4px_14px_rgba(0,0,0,0.5)]'
                   }`}
                 >
                   COINCIDE
                 </button>
                 <div className="h-4 md:h-6 mt-2 flex items-center justify-center">
                   {feedback === 'success' && <span className="text-[#00ff9d] font-mono text-[8px] md:text-[10px] uppercase tracking-widest transition-opacity animate-pulse">Patrón Confirmado (+1)</span>}
                   {feedback === 'error' && <span className="text-[#ff0055] font-mono text-[8px] md:text-[10px] uppercase tracking-widest transition-opacity animate-pulse">Desajuste de Patrón (-1)</span>}
                   {feedback === 'miss' && <span className="text-orange-400 font-mono text-[8px] md:text-[10px] uppercase tracking-widest transition-opacity animate-pulse">Patrón Perdido (-1)</span>}
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

