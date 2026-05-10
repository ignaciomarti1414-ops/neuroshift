import { useEffect } from 'react';
import { Header } from './components/Header';
import { Phase1Entry } from './components/Phase1Entry';
import { Phase2Friction } from './components/Phase2Friction';
import { Phase3Coherence } from './components/Phase3Coherence';
import { Phase4ATetris } from './components/Phase4ATetris';
import { Phase4BNBack } from './components/Phase4BNBack';
import { Phase5Checkout } from './components/Phase5Checkout';
import { Phase6DeepWork } from './components/Phase6DeepWork';
import { Onboarding } from './components/Onboarding';
import { Login } from './components/Login';
import { useAuth } from './lib/AuthContext';
import { useAudioEngine } from './lib/useAudioEngine';
import { useNeuroStore } from './store/useNeuroStore';
import { useCeremonialSounds } from './hooks/useCeremonialSounds';
import { Activity } from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();
  const {
    hasSeenOnboarding,
    phase,
    entryVas,
    audioConfig,
    history,
    resetSession,
    setAudioConfig
  } = useNeuroStore();

  const { isInitialized, initAudio, stopAudio, setFrequencySweep, setNoiseType } = useAudioEngine();
  const { setAudioEnabled } = useCeremonialSounds();

  useEffect(() => {
    setAudioEnabled(audioConfig.enabled);
  }, [audioConfig.enabled, setAudioEnabled]);

  // Audio Control
  useEffect(() => {
    if (audioConfig.enabled && !isInitialized && phase > 1) {
      initAudio(audioConfig.noiseType);
    } else if (!audioConfig.enabled && isInitialized) {
      stopAudio();
    }
  }, [audioConfig.enabled, isInitialized, phase, initAudio, stopAudio, audioConfig.noiseType]);

  useEffect(() => {
    if (isInitialized) {
      setNoiseType(audioConfig.noiseType);
    }
  }, [audioConfig.noiseType, isInitialized, setNoiseType]);

  // Frequency Sweep based on Phase
  useEffect(() => {
    if (isInitialized) {
      if (phase === 3) {
        setFrequencySweep(10, 15); // Ramp down to Alpha (Relaxation) over 15s
      } else {
        setFrequencySweep(audioConfig.deepWorkHz, 2); // Selected Wave
      }
    }
  }, [phase, isInitialized, setFrequencySweep, audioConfig.deepWorkHz]);

  const toggleAudio = () => setAudioConfig({ enabled: !audioConfig.enabled });

  const handleReset = () => {
    resetSession();
  };

  const getRecommendedPhase3Duration = () => {
    return 180;
  };

  const recommendedDuration = getRecommendedPhase3Duration();

  if (loading) {
    return (
      <div className="flex flex-col min-h-[100dvh] items-center justify-center p-4 gap-4">
        <Activity className="w-12 h-12 text-primary animate-pulse" />
        <span className="text-sm font-mono text-on-surface-variant uppercase tracking-widest animate-pulse">
          Cargando tu sesión...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }
  
  if (!hasSeenOnboarding) {
    return <Onboarding />;
  }

  if (phase === 7) {
    return <Phase6DeepWork />;
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full p-2 md:p-8 overflow-hidden bg-background">
      <Header phase={phase} />

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 min-h-0 mt-2 md:mt-0">
        
        {/* Main Content Area */}
        <section className={`col-span-1 h-full min-h-0 ${phase !== 1 ? 'md:col-span-8' : 'md:col-span-12'} glass flex flex-col overflow-hidden relative`}>
          {phase === 1 && <Phase1Entry />}
          {phase === 2 && <Phase2Friction onCancel={handleReset} />}
          {phase === 3 && <Phase3Coherence />}
          {phase === 4 && <Phase4ATetris />}
          {phase === 5 && <Phase4BNBack />}
          {phase === 6 && <Phase5Checkout />}
        </section>

        {/* Aside Panel */}
        {(phase > 1 && phase < 7) && (
          <aside className="col-span-1 md:col-span-4 flex-col gap-4 hidden md:flex min-h-0 h-full overflow-y-auto">
            <div className="glass-panel p-6 flex-1 flex flex-col">
              <h3 className="text-xs font-mono text-on-surface-variant uppercase tracking-widest mb-6 border-b border-border pb-4">
                Telemetría de Sesión
              </h3>
              
              <div className="space-y-6 flex-1">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-on-surface">Nivel base inicial (VAS)</span>
                    <span className="text-sm font-mono text-primary">{entryVas?.toFixed(1) || '--'} / 100</span>
                  </div>
                  <div className="w-full bg-surface-bright h-1.5 rounded-full relative">
                    {entryVas !== null && (
                      <div 
                        className="absolute top-0 bottom-0 bg-primary rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,180,255,0.5)]"
                        style={{ width: `${entryVas}%` }}
                      ></div>
                    )}
                  </div>
                </div>

                <div className="pt-6">
                  <span className="block text-[10px] text-on-surface-variant uppercase mb-4 tracking-widest">
                    Siguiente Módulo: {phase === 2 ? `Coherencia (${recommendedDuration}s)` : phase === 3 ? 'Tetris Clínico' : phase === 4 ? 'Carga Ejecutiva' : phase === 5 ? 'Checkout' : 'Completado'}
                  </span>
                  
                  {/* Miniature abstract representation */}
                  <div className="grid grid-cols-4 gap-2 w-full aspect-square border-t border-border pt-4">
                    {Array(16).fill(0).map((_, i) => (
                      <div 
                        key={i} 
                        className={`rounded-sm border border-border/50 transition-colors ${
                           (i % 3 === 0 && phase > 2) ? 'bg-primary/20 shadow-[0_0_8px_rgba(0,180,255,0.4)]' : 'bg-surface-bright/30'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-4 md:p-6 mb-4 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isInitialized ? 'bg-primary/20' : 'bg-surface-dim'}`}>
                    <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-primary animate-pulse shadow-[0_0_10px_rgba(0,180,255,0.8)]' : 'bg-surface-bright'}`}></div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-white uppercase tracking-widest">Motor Neural</p>
                    <p className="text-[10px] text-on-surface-variant font-mono">Binaural + Ruido</p>
                  </div>
                </div>
                <button
                  onClick={toggleAudio}
                  aria-pressed={audioConfig.enabled}
                  aria-label={`Motor Neural ${audioConfig.enabled ? 'activo' : 'desactivado'}`}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-colors ${audioConfig.enabled ? 'bg-primary text-background shadow-[0_0_15px_rgba(0,180,255,0.4)]' : 'bg-surface-dim text-on-surface hover:bg-surface-bright'}`}
                >
                  {audioConfig.enabled ? 'ACTIVO' : 'OFF'}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-variant mb-2 block">Espectro de Ruido</span>
                  <div className="flex bg-surface-dim p-1 rounded-lg">
                    {[{id: 'white', label: 'Bl'}, {id: 'pink', label: 'Rs'}, {id: 'brown', label: 'Ma'}, {id: 'green', label: 'Ve'}, {id: 'grey', label: 'Gr'}].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setAudioConfig({ noiseType: type.id as any })}
                        className={`flex-1 text-[9px] font-mono py-1.5 rounded transition-all ${
                          audioConfig.noiseType === type.id ? 'bg-surface text-primary border border-primary/30' : 'text-on-surface-variant hover:text-white'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-variant mb-2 block">Onda Binaural</span>
                  <div className="flex bg-surface-dim p-1 rounded-lg">
                    {[{hz: 40, label: 'Gamma'}, {hz: 15, label: 'Beta'}, {hz: 10, label: 'Alpha'}, {hz: 6, label: 'Theta'}].map(wave => (
                      <button
                        key={wave.hz}
                        onClick={() => setAudioConfig({ deepWorkHz: wave.hz })}
                        className={`flex-1 text-[9px] font-mono py-1.5 rounded transition-all flex flex-col items-center ${
                          audioConfig.deepWorkHz === wave.hz ? 'bg-surface text-primary border border-primary/30' : 'text-on-surface-variant hover:text-white'
                        }`}
                      >
                        <span>{wave.hz}Hz</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
