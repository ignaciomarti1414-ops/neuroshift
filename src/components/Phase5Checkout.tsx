import React, { useState, useRef, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2, Play, Pause } from 'lucide-react';
import { useNeuroStore } from '../store/useNeuroStore';
import { saveSession } from '../lib/sessionService';

export const Phase5Checkout = () => {
  const [val, setVal] = useState<number | null>(null);
  const [displayVal, setDisplayVal] = useState(50);
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [failsafeActive, setFailsafeActive] = useState(false);
  const { entryVas, currentNBackAccuracy, setMetrics, resetSession, nextPhase, history, setHistory } = useNeuroStore();
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

  const executeSave = async () => {
    if (val === null) return;
    setMetrics('exit', val);

    setIsSaving(true);
    try {
      const sessionPayload = {
        entryVas,
        exitVas: val,
        nBackAccuracy: currentNBackAccuracy !== null ? currentNBackAccuracy : null,
      };
      
      const res = await saveSession(sessionPayload);
      
      if (res) {
          setHistory([...history, res]);
      } else {
          setHistory([...history, { 
            id: crypto.randomUUID(), 
            timestamp: Date.now(), 
            ...sessionPayload 
          }]);
      }

    } catch (err) {
      console.error('Failed to save session to DB:', err);
    } finally {
      setIsSaving(false);
      setSubmitted(true);
      setFailsafeActive(false);
    }
  };

  const handleSubmit = async () => {
    if (val !== null) {
      // Check failsafe condition first
      if (entryVas - val <= 0 && !failsafeActive) {
        setFailsafeActive(true);
        return;
      }
      
      await executeSave();
    }
  };


  const handleFinish = () => {
    resetSession();
  };

  const handleDeepWork = () => {
    nextPhase(); // Go to phase 7 (Deep Work)
  };

  const delta = (val !== null) ? entryVas - val : 0;
  
  // Transform data to simulate an upward "reset level" trend for the chart based on delta
  const resetLevel = Math.min(100, Math.max(0, (delta / entryVas) * 100)) || 50;
  
  const chartData = [
    { name: '0m', fill: 20 },
    { name: '2m', fill: 40 },
    { name: '4m', fill: 35 },
    { name: '6m', fill: 65 },
    { name: '8m', fill: 80 },
    { name: '10m', fill: resetLevel > 0 ? resetLevel : 90 }
  ];

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${circumference * 0.66} ${circumference}`;
  const strokeDashoffset = val !== null ? circumference * 0.66 * (1 - (val / 100)) : circumference * 0.66 * 0.5;

  if (failsafeActive && !submitted) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full h-full animate-fade-in">
         <div className="glass-panel border-[#ff0055]/30 p-8 flex flex-col items-center max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#ff0055]"></div>
            
            <h2 className="text-[#ff0055] font-mono text-lg uppercase tracking-widest mb-6 text-center">
              Alerta Clínica
            </h2>
            
            <p className="text-on-surface text-sm mb-8 text-center leading-relaxed">
              Tu sistema nervioso simpático sigue hiperactivado. Intervención física requerida.
            </p>
            
            <div className="bg-[#ff0055]/10 border border-[#ff0055]/20 rounded-lg p-6 mb-8 w-full">
               <p className="text-white text-center font-mono text-xs uppercase tracking-widest leading-relaxed">
                 Lávate la cara con agua muy fría (Reflejo Vagal) durante 30 segundos.
               </p>
            </div>
            
            <button 
              onClick={executeSave}
              className="w-full py-4 rounded-xl border border-[rgba(255,255,255,0.1)] text-on-surface font-mono tracking-widest uppercase hover:bg-[rgba(255,255,255,0.05)] transition-colors active:scale-95"
            >
              Hecho. Sistema reiniciado.
            </button>
         </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-2 md:p-6 overflow-hidden w-full h-full min-h-0">
      
      {!submitted ? (
        <div className="flex flex-col items-center w-full max-w-md pt-2 h-full justify-between py-2 md:py-6">
          <div className="flex flex-col items-center w-full shrink-0">
            <h2 className="text-xl md:text-3xl font-light text-primary glow-text uppercase tracking-widest mb-1 text-center w-full">
              Sistema Recalibrado
            </h2>
            <p className="text-on-surface-variant font-mono text-[10px] md:text-xs mb-2 md:mb-6 text-center uppercase tracking-widest">
              Evalúa tu nuevo estado base
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
                   className="dial-progress drop-shadow-[0_0_12px_rgba(0,255,157,0.8)]"
                   stroke="var(--color-success)"
                   strokeDasharray={strokeDasharray}
                   strokeDashoffset={strokeDashoffset}
                   style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
                 />
              </svg>
              
              <div className="dial-container w-[55%] aspect-square rounded-full mt-[8%] flex flex-col items-center justify-center z-10 pointer-events-none relative shadow-xl">
                <span className="text-[8px] md:text-[10px] text-success uppercase tracking-widest font-mono mb-0.5">POST-SESIÓN</span>
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
                disabled={isSaving}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={val === null || isSaving}
            className={`w-full py-3 md:py-4 rounded-full font-mono text-[10px] md:text-sm tracking-widest uppercase transition-all duration-300 flex justify-center items-center gap-2 shrink-0 ${
              val !== null 
                ? 'bg-success text-background hover:bg-opacity-90 shadow-[0_0_20px_rgba(0,255,157,0.4)]' 
                : 'bg-surface border border-border text-on-surface-variant cursor-not-allowed opacity-50'
            }`}
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Procesando...' : 'Registrar Delta'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full max-w-md animate-fade-in pb-8">
          <div className="w-full flex items-center mb-6 px-2">
            <h2 className="text-lg md:text-xl font-light text-on-surface tracking-widest uppercase glow-text">
              Resumen de Sesión y Datos
            </h2>
          </div>

          <div className="glass-panel w-full p-6 mb-6">
            <h3 className="text-xs text-on-surface-variant font-mono uppercase tracking-[0.2em] mb-4 text-center">
              Puntuación de Reinicio Neurocognitivo
            </h3>
            <div className="w-full h-[180px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{backgroundColor: "rgba(15,25,40,0.9)", border: "1px solid rgba(0,240,255,0.2)", borderRadius: "12px", backdropFilter: "blur(10px)"}} 
                    itemStyle={{color: "var(--color-primary)"}}
                  />
                  <Area type="step" dataKey="fill" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute right-0 top-1 text-primary text-xl font-mono glow-text pr-2">
                {resetLevel > 0 ? resetLevel.toFixed(0) : 94}%
              </div>
            </div>
          </div>

          <h3 className="w-full text-left font-mono text-sm text-on-surface mb-4 uppercase tracking-widest pl-2">Biometría Post-Sesión</h3>
          
          <div className="grid grid-cols-2 gap-3 w-full mb-8">
            <div className="glass-panel p-3 flex flex-col items-start justify-center text-left hover:-translate-y-1 transition-transform relative overflow-hidden">
               <div className="absolute inset-0 bg-primary/10"></div>
              <span className="text-[10px] text-on-surface-variant font-mono uppercase mb-2 z-10">Dopamina</span>
              <span className="text-sm font-light text-primary glow-text z-10">Normalizada</span>
            </div>
            <div className="glass-panel p-3 flex flex-col items-start justify-center text-left hover:-translate-y-1 transition-transform">
              <span className="text-[10px] text-on-surface-variant font-mono uppercase mb-2">Coherencia</span>
              <span className="text-sm font-light text-success">Óptima</span>
            </div>
          </div>

          <div className="glass-panel w-full p-4 flex items-center justify-between mb-8 cursor-pointer relative overflow-hidden group">
             <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-primary/10 transition-all group-hover:w-full duration-500"></div>
             <div className="flex items-center gap-4 z-10">
               <button 
                 onClick={() => setIsPlaying(!isPlaying)}
                 className="w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex flex-col items-center justify-center text-primary hover:bg-primary/40 transition-colors"
               >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
               </button>
               <div className="flex flex-col">
                 <span className="text-xs text-white">Calma Ambiental</span>
                 <span className="text-[10px] text-on-surface-variant">Guía Post-Sesión</span>
               </div>
             </div>
             
             <div className="flex items-center gap-2 z-10">
                <span className="text-[10px] font-mono text-on-surface-variant">04:15</span>
                <div className="w-12 h-1 bg-surface-bright rounded-full relative">
                   <div className="absolute left-0 top-0 bottom-0 w-3/4 bg-primary rounded-full"></div>
                </div>
                <span className="text-[10px] font-mono text-on-surface-variant">05:00</span>
             </div>
          </div>

          <div className="flex gap-4 w-full">
            <button 
               onClick={handleFinish}
               className="flex-1 py-4 rounded-xl border border-[rgba(255,255,255,0.1)] text-on-surface text-xs font-mono tracking-widest uppercase hover:bg-[rgba(255,255,255,0.05)] transition-colors active:scale-95"
            >
              Salir
            </button>
            <button 
               onClick={handleDeepWork}
               className="flex-[2] py-4 rounded-xl bg-primary text-background font-mono text-xs tracking-widest uppercase hover:bg-opacity-90 shadow-[0_0_20px_rgba(0,255,157,0.4)] transition-colors active:scale-95"
            >
              Entrar a Deep Work
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

