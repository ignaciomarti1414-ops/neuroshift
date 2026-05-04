import React, { useState, useRef, useEffect } from 'react';
import { useNeuroStore } from '../store/useNeuroStore';

export const Phase1Entry = () => {
  const [val, setVal] = useState<number | null>(null);
  const [displayVal, setDisplayVal] = useState(50);
  const { setMetrics, nextPhase } = useNeuroStore();
  const dialRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (val !== null) setDisplayVal(val);
  }, [val]);

  const handlePointerMove = (e: React.PointerEvent | PointerEvent) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    let newVal = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setVal(Math.round(newVal));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    handlePointerMove(e);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', () => {
      window.removeEventListener('pointermove', handlePointerMove);
    }, { once: true });
  };

  const handleComplete = () => {
    if (val !== null) {
      setMetrics('entry', val);
      nextPhase();
    }
  };

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${circumference * 0.66} ${circumference}`;
  const strokeDashoffset = val !== null ? circumference * 0.66 * (1 - (val / 100)) : circumference * 0.66 * 0.5;

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-2 md:p-6 overflow-hidden w-full h-full min-h-0">
      <div className="flex flex-col items-center w-full max-w-md h-full justify-between py-2 md:py-6">
        <div className="flex flex-col items-center w-full shrink-0">
          <h2 className="text-xl md:text-3xl font-light text-primary glow-text uppercase tracking-widest mb-1 text-center w-full">
            Calibración Inicial
          </h2>
          <p className="text-on-surface-variant font-mono text-[10px] md:text-xs mb-2 md:mb-6 text-center uppercase tracking-widest leading-relaxed">
            Evalúa tu estado neurocognitivo actual
          </p>
        </div>

        <div className="glass-panel w-full p-4 md:p-6 flex flex-col items-center relative overflow-hidden flex-1 min-h-[220px]">
            <h2 className="text-on-surface-variant font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] mb-2 md:mb-4 shrink-0">
              Estado Neurocognitivo (VAS)
            </h2>
            
            <div 
              className="relative w-full max-w-[200px] md:max-w-[240px] aspect-[1.3] flex flex-1 items-start justify-center cursor-pointer select-none"
              ref={dialRef}
              onPointerDown={handlePointerDown}
              style={{ touchAction: 'none' }}
            >
              <svg viewBox="0 0 280 280" className="absolute top-0 left-0 w-full h-[120%] -rotate-[210deg] pointer-events-none">
                 <circle 
                   cx="140" cy="140" r={radius} 
                   className="dial-track"
                   strokeDasharray={strokeDasharray}
                 />
                 <circle 
                   cx="140" cy="140" r={radius} 
                   className="dial-progress drop-shadow-[0_0_12px_rgba(0,240,255,0.8)]"
                   strokeDasharray={strokeDasharray}
                   strokeDashoffset={strokeDashoffset}
                   style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
                 />
              </svg>
              
              <div className="dial-container w-[55%] aspect-square rounded-full flex flex-col items-center justify-center z-10 pointer-events-none relative shadow-xl mt-[6%]">
                <span className="text-[8px] md:text-[10px] text-primary uppercase tracking-widest font-mono mb-0.5">PRE-SESIÓN</span>
                <div className="flex items-baseline">
                  <span className="text-3xl md:text-4xl font-light text-white">{displayVal}</span>
                  <span className="text-xs text-on-surface-variant ml-1">/ 100</span>
                </div>
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
              </div>
            </div>
            
            <div className="w-full mt-2">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                aria-label="Nivel de ansiedad"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={val === null ? 50 : val}
                value={val === null ? 50 : val}
                onChange={(e) => setVal(parseFloat(e.target.value))}
                className="custom-slider"
              />
            </div>
        </div>

        <button
          onClick={handleComplete}
          disabled={val === null}
          className={`w-full py-3 md:py-4 mt-2 rounded-full font-mono text-[10px] md:text-sm tracking-widest uppercase transition-all duration-300 flex justify-center items-center gap-2 shrink-0 ${
            val !== null 
              ? 'btn-primary' 
              : 'bg-surface border border-border text-on-surface-variant cursor-not-allowed opacity-50'
          }`}
        >
          Iniciar Protocolo
        </button>
      </div>
    </main>
  );
};
