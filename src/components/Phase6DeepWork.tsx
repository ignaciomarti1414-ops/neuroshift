import { useState, useEffect, useRef } from 'react';
import { useNeuroStore } from '../store/useNeuroStore';
import { Settings2, Volume2, Headphones } from 'lucide-react';

const DURATIONS = [25 * 60, 45 * 60, 90 * 60];

export const Phase6DeepWork = () => {
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0]);
  const [timeLeft, setTimeLeft] = useState(DURATIONS[0]);
  const [isActive, setIsActive] = useState(false);
  const [focusBroken, setFocusBroken] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  const { setAudioConfig, audioConfig, resetSession } = useNeuroStore();
  const timerRef = useRef<number>();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        setFocusBroken(true);
        setIsActive(false);
        setAudioConfig({ enabled: false });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, setAudioConfig]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setAudioConfig({ enabled: false });
    }
    return () => clearTimeout(timerRef.current);
  }, [isActive, timeLeft, setAudioConfig]);

  const handleStart = () => {
    setIsActive(true);
    setAudioConfig({ enabled: true });
    setShowConfig(false);
  };

  const handleResume = () => {
    setFocusBroken(false);
    setIsActive(true);
    setAudioConfig({ enabled: true });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 bg-background flex flex-col items-center justify-center z-50 p-6 overflow-hidden">
      
      {/* Dynamic Background */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isActive ? 'opacity-20' : 'opacity-0'}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="absolute top-6 right-6 z-50">
         {!isActive && !focusBroken && timeLeft === selectedDuration && (
           <button 
             onClick={() => setShowConfig(!showConfig)}
             className="p-3 rounded-full bg-surface-dim text-on-surface hover:text-primary transition-colors border border-[rgba(255,255,255,0.05)]"
           >
             <Settings2 className="w-5 h-5" />
           </button>
         )}
      </div>

      {!isActive && !focusBroken && timeLeft === selectedDuration && (
        <div className="flex flex-col items-center animate-fade-in z-10 w-full max-w-md">
          <h2 className="text-on-surface font-mono text-xl tracking-[0.3em] uppercase mb-2 glow-text">Búnker de Imersión</h2>
          <p className="text-on-surface-variant font-mono text-[10px] uppercase tracking-widest mb-12">Aislamiento cognitivo activado</p>
          
          <div className="flex gap-4 mb-16">
            {DURATIONS.map(d => (
              <button
                key={d}
                onClick={() => { setSelectedDuration(d); setTimeLeft(d); }}
                className={`w-20 h-20 rounded-full flex flex-col items-center justify-center font-mono text-sm transition-all border ${
                  selectedDuration === d 
                    ? 'border-primary text-primary shadow-[inset_0_0_20px_rgba(0,240,255,0.2),0_0_15px_rgba(0,240,255,0.4)] scale-110' 
                    : 'border-[rgba(255,255,255,0.1)] text-on-surface-variant hover:border-[rgba(255,255,255,0.3)]'
                }`}
              >
                {d / 60}m
              </button>
            ))}
          </div>

          <button 
            onClick={handleStart}
            className="w-full py-4 rounded-xl bg-primary text-background font-mono text-sm tracking-widest uppercase hover:bg-opacity-90 shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all active:scale-95"
          >
            Entrar al Búnker
          </button>

          {/* Config Panel */}
          {showConfig && (
            <div className="mt-8 w-full glass-panel p-6 animate-slide-up relative">
              <h3 className="text-xs font-mono text-on-surface-variant uppercase tracking-[0.2em] mb-6">Calibración Sensorial</h3>
              
              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-on-surface">Estimulación Binaural</span>
                    <span className="text-primary text-[10px] font-mono">{audioConfig.deepWorkHz} Hz</span>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {[{hz: 40, label: 'Gamma'}, {hz: 15, label: 'Beta'}, {hz: 10, label: 'Alpha'}, {hz: 6, label: 'Theta'}].map(wave => (
                      <button
                        key={wave.hz}
                        onClick={() => setAudioConfig({ deepWorkHz: wave.hz })}
                        className={`flex-1 py-3 text-[10px] font-mono rounded ${
                          audioConfig.deepWorkHz === wave.hz 
                            ? 'bg-primary text-background' 
                            : 'bg-surface-dim text-on-surface-variant hover:bg-[rgba(255,255,255,0.1)]'
                        }`}
                      >
                        {wave.label} <br/><span className="opacity-70">{wave.hz}Hz</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface mb-2 block">Ruido de Fondo</span>
                  <div className="flex bg-surface-dim p-1 rounded-lg">
                    {[{id: 'white', label: 'Blanco'}, {id: 'pink', label: 'Rosa'}, {id: 'brown', label: 'Marrón'}, {id: 'green', label: 'Verde'}].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setAudioConfig({ noiseType: type.id as any })}
                        className={`flex-1 text-[10px] uppercase tracking-widest py-2 rounded-md transition-all ${
                          audioConfig.noiseType === type.id ? 'bg-surface text-primary border border-primary/30' : 'text-on-surface-variant'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="w-3 h-3 text-on-surface-variant" />
                    <span className="text-[10px] uppercase tracking-widest text-on-surface">Volumen</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05" 
                    value={audioConfig.volume}
                    onChange={(e) => setAudioConfig({ volume: parseFloat(e.target.value) })}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isActive && (
        <div className="flex flex-col items-center z-10 w-full h-full justify-center group">
          <div className="relative flex items-center justify-center mb-8">
             <svg className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] -rotate-90 pointer-events-none opacity-20">
               <circle cx="50%" cy="50%" r="48%" stroke="var(--color-primary)" strokeWidth="2" fill="none" strokeDasharray="4 8" />
             </svg>
             <svg className="absolute w-[280px] h-[280px] md:w-[380px] md:h-[380px] -rotate-90 pointer-events-none">
               <circle cx="50%" cy="50%" r="48%" stroke="var(--color-surface-dim)" strokeWidth="4" fill="none" />
               <circle 
                 cx="50%" cy="50%" r="48%" 
                 stroke="var(--color-primary)" 
                 strokeWidth="4" fill="none" 
                 strokeLinecap="round"
                 style={{ 
                   strokeDasharray: '800', 
                   strokeDashoffset: 800 - (800 * (timeLeft / selectedDuration)),
                   transition: 'stroke-dashoffset 1s linear'
                 }} 
               />
             </svg>
             <span className="text-6xl md:text-8xl font-thin tracking-tighter leading-none select-none text-white glow-text">
               {formatTime(timeLeft)}
             </span>
          </div>

          <div className="flex items-center gap-3 text-primary/60 bg-surface-dim/30 px-4 py-2 rounded-full border border-primary/10">
            <Headphones className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-widest">
              Estimulación {audioConfig.deepWorkHz >= 30 ? 'Gamma' : audioConfig.deepWorkHz >= 13 ? 'Beta' : audioConfig.deepWorkHz >= 8 ? 'Alpha' : 'Theta'} a {audioConfig.deepWorkHz}Hz
            </span>
          </div>
        </div>
      )}

      {focusBroken && (
        <div className="flex flex-col items-center max-w-md w-full z-10 glass p-8 rounded-2xl border border-error/30 shadow-[0_0_50px_rgba(255,0,85,0.15)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-error animate-pulse"></div>
          
          <h2 className="text-error font-mono text-2xl uppercase tracking-widest mb-4 text-center glow-text">
            Enfoque Roto
          </h2>
          <p className="text-on-surface-variant font-mono text-xs mb-10 text-center leading-relaxed">
            Has abandonado el búnker. El trabajo profundo requiere atención ininterrumpida. La neuroplasticidad se suspende.
          </p>
          
          <div className="flex gap-4 w-full">
             <button 
               onClick={resetSession}
               className="flex-1 py-4 border border-[rgba(255,255,255,0.1)] text-on-surface text-[10px] font-mono uppercase tracking-widest rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-colors"
             >
               Abortar
             </button>
             <button 
               onClick={handleResume}
               className="flex-[2] py-4 bg-error/10 border border-error/50 text-error text-[10px] font-mono uppercase tracking-widest rounded-xl hover:bg-error/20 transition-colors shadow-[0_0_20px_rgba(255,0,85,0.2)]"
             >
               Reanudar
             </button>
          </div>
        </div>
      )}

      {timeLeft === 0 && !isActive && (
         <div className="flex flex-col items-center z-10 glass p-10 rounded-3xl border border-success/30 shadow-[0_0_60px_rgba(0,255,157,0.1)]">
           <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mb-6">
              <div className="w-10 h-10 bg-success rounded-full animate-pulse shadow-[0_0_20px_rgba(0,255,157,0.6)]" />
           </div>
           
           <h2 className="text-success font-mono text-2xl uppercase tracking-[0.2em] mb-2 text-center shadow-success">
              Inmersión Completada
           </h2>
           <p className="text-on-surface-variant font-mono text-xs uppercase tracking-widest mb-10">
              Protocolo finalizado con éxito
           </p>

           <button 
               onClick={resetSession}
               className="w-full max-w-xs py-4 bg-success/10 border border-success/50 text-success text-[10px] font-mono uppercase tracking-[0.2em] rounded-xl hover:bg-success/20 transition-colors shadow-[0_0_20px_rgba(0,255,157,0.2)] active:scale-95"
             >
               Terminar Protocolo Final
           </button>
         </div>
      )}
      
    </div>
  );
};
