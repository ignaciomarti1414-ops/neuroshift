import { X, LogOut, Settings2, Trash2, Trophy, Clock } from 'lucide-react';
import { useNeuroStore, ACHIEVEMENTS_CONFIG } from '../store/useNeuroStore';
import { useAuth } from '../lib/AuthContext';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';

interface ProfileDashboardProps {
  onClose: () => void;
}

export const ProfileDashboard = ({ onClose }: ProfileDashboardProps) => {
  const { user, logout } = useAuth();
  const {
    audioConfig,
    setAudioConfig,
    history,
    purgeData,
    nBackLevel,
    streak,
    lastSessionDate,
    achievements,
    coherenceDuration,
    setCoherenceDuration,
    deepWorkSessions,
  } = useNeuroStore();

  const handleLogout = () => {
    logout();
    onClose();
  };

  const chartData = history.slice(-10).map((session, i) => ({
    name: `S${i + 1}`,
    delta: Math.max(0, session.entryVas - session.exitVas),
    entry: session.entryVas,
    exit: session.exitVas,
  }));

  const weeklyData = (() => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const today = new Date();
    const data = days.map((day, i) => {
      const dayOfWeek = (i + 1) % 7;
      const hasSession = history.some((s) => {
        const d = new Date(s.timestamp);
        return d.getDay() === dayOfWeek;
      });
      return { day, sesiones: hasSession ? 1 : 0 };
    });
    return data;
  })();

  const unlockedAchievements = ACHIEVEMENTS_CONFIG.filter((a) => achievements[a.id] !== null && achievements[a.id] !== undefined);
  const lockedAchievements = ACHIEVEMENTS_CONFIG.filter((a) => achievements[a.id] === null || achievements[a.id] === undefined);

  const coherenceOptions = [
    { value: 60, label: '1 min' },
    { value: 120, label: '2 min' },
    { value: 180, label: '3 min' },
    { value: 240, label: '4 min' },
    { value: 300, label: '5 min' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end">
      <div className="w-full md:w-[420px] h-full bg-surface border-l border-[rgba(255,255,255,0.05)] shadow-2xl flex flex-col animate-fade-in relative overflow-hidden">
        <div className="p-6 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center">
          <div className="flex items-center gap-3">
             <Settings2 className="w-5 h-5 text-primary" />
             <h2 className="text-lg font-light tracking-widest uppercase">Perfil Clínico</h2>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-white transition-colors" aria-label="Cerrar panel">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

          {streak > 0 && (
            <section className="glass-panel p-4 border border-[#ff6b35]/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#ff6b35]/20 flex items-center justify-center">
                  <span className="text-lg">🔥</span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block">Racha Actual</span>
                  <span className="text-xl font-light text-[#ff6b35]">{streak} días</span>
                </div>
              </div>
              {lastSessionDate && (
                <p className="text-[10px] text-on-surface-variant/60 font-mono">
                  Última sesión: {new Date(lastSessionDate).toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              )}
            </section>
          )}

          <section>
            <h3 className="text-xs font-mono text-on-surface-variant tracking-[0.2em] uppercase mb-4">Telemetría</h3>

            <div className="flex gap-2 mb-3">
              <div className="glass-panel p-3 flex-1">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">N-Back</span>
                <span className="text-lg font-light text-primary">{nBackLevel}-Back</span>
              </div>
              <div className="glass-panel p-3 flex-1">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">Deep Work</span>
                <span className="text-lg font-light text-primary">{deepWorkSessions}</span>
              </div>
            </div>

            <div className="glass-panel p-4 h-44 flex flex-col relative overflow-hidden">
               <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-3 z-10 relative">Delta de Ansiedad (Últimas 10 sesiones)</span>
               <div className="flex-1 w-full relative z-10">
                 {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorDelta" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.6}/>
                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="none" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                        <YAxis hide domain={[0, 'dataMax + 10']} />
                        <Tooltip
                          contentStyle={{backgroundColor: "rgba(15,25,40,0.9)", border: "1px solid rgba(0,240,255,0.2)", borderRadius: "8px", backdropFilter: "blur(10px)", color: "white", fontSize: "12px", fontFamily: "monospace"}}
                          itemStyle={{color: "var(--color-primary)"}}
                          formatter={(value) => [`${value} pts`, 'Reducción']}
                          labelStyle={{display: 'none'}}
                          cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                        />
                        <Area type="monotone" dataKey="delta" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorDelta)" />
                      </AreaChart>
                    </ResponsiveContainer>
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-on-surface-variant/50">
                      Sin datos
                   </div>
                 )}
               </div>
            </div>
          </section>

          {unlockedAchievements.length > 0 && (
            <section>
              <h3 className="text-xs font-mono text-on-surface-variant tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
                <Trophy className="w-3 h-3" /> Logros
              </h3>
              <div className="flex flex-col gap-2">
                {unlockedAchievements.map((a) => (
                  <div key={a.id} className="glass-panel p-3 flex items-center gap-3 border border-success/20 bg-success/5">
                    <span className="text-lg">{a.icon}</span>
                    <div className="flex-1">
                      <span className="text-xs text-white block">{a.name}</span>
                      <span className="text-[10px] text-on-surface-variant">{a.description}</span>
                    </div>
                    <span className="text-[8px] text-success/60 font-mono">
                      {a.unlockedAt ? new Date(a.unlockedAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-xs font-mono text-on-surface-variant tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
              <Clock className="w-3 h-3" /> Configuración
            </h3>

            <div className="glass-panel p-4 flex flex-col gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 block">Duración Coherencia</span>
                <div className="flex gap-2">
                  {coherenceOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setCoherenceDuration(opt.value)}
                      className={`flex-1 py-2 text-[10px] font-mono rounded transition-all border ${
                        coherenceDuration === opt.value
                          ? 'bg-primary text-background border-primary/30'
                          : 'border-[rgba(255,255,255,0.1)] text-on-surface-variant hover:border-primary/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">Respuesta Háptica</span>
                <button
                  onClick={() => setAudioConfig({ haptics: !audioConfig.haptics })}
                  aria-pressed={audioConfig.haptics}
                  aria-label={`Respuesta háptica ${audioConfig.haptics ? 'activada' : 'desactivada'}`}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${audioConfig.haptics ? 'bg-primary' : 'bg-surface-dim'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${audioConfig.haptics ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-mono text-on-surface-variant tracking-[0.2em] uppercase mb-3">Ruido de Fondo</h3>
            <div className="flex bg-surface-dim p-1 rounded-lg">
              {[{id: 'white', label: 'Blanco'}, {id: 'pink', label: 'Rosa'}, {id: 'brown', label: 'Marrón'}, {id: 'green', label: 'Verde'}, {id: 'grey', label: 'Gris'}].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setAudioConfig({ noiseType: type.id as any })}
                  className={`flex-1 text-[10px] uppercase tracking-widest py-2 rounded-md transition-all ${
                    audioConfig.noiseType === type.id ? 'bg-primary text-background font-bold' : 'text-on-surface-variant hover:bg-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </section>

          <div className="mt-auto pt-4 flex flex-col gap-2 border-t border-[rgba(255,255,255,0.05)]">
            <button
               onClick={purgeData}
               className="w-full py-3 rounded-xl border border-[rgba(255,0,85,0.2)] text-[#ff0055] text-xs font-mono tracking-widest uppercase hover:bg-[rgba(255,0,85,0.1)] transition-colors flex justify-center items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Purgar Datos Locales
            </button>
            <button
               onClick={handleLogout}
               className="w-full py-3 rounded-xl bg-surface-dim text-on-surface text-xs font-mono tracking-widest uppercase hover:bg-[rgba(255,255,255,0.05)] transition-colors flex justify-center items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Finalizar Sesión
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
