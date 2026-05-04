import { X, LogOut, Settings2, Trash2 } from 'lucide-react';
import { useNeuroStore } from '../store/useNeuroStore';
import { useAuth } from '../lib/AuthContext';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface ProfileDashboardProps {
  onClose: () => void;
}

export const ProfileDashboard = ({ onClose }: ProfileDashboardProps) => {
  const { user, logout } = useAuth();
  const { audioConfig, setAudioConfig, history, purgeData, nBackLevel } = useNeuroStore();

  const handleLogout = () => {
    logout();
    onClose();
  };

  // Delta Anxiety = entryVas - exitVas
  const chartData = history.slice(-10).map((session, i) => ({
    name: `S${i + 1}`,
    delta: Math.max(0, session.entryVas - session.exitVas)
  }));

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end">
      <div className="w-full md:w-[400px] h-full bg-surface border-l border-[rgba(255,255,255,0.05)] shadow-2xl flex flex-col animate-fade-in relative">
        <div className="p-6 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center">
          <div className="flex items-center gap-3">
             <Settings2 className="w-5 h-5 text-primary" />
             <h2 className="text-lg font-light tracking-widest uppercase">Perfil Clínico</h2>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          
          <section>
            <h3 className="text-xs font-mono text-on-surface-variant tracking-[0.2em] uppercase mb-4">Telemetría del Paciente</h3>
            <div className="glass-panel p-4 mb-2">
               <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">Calibración Actual</span>
               <span className="text-xl font-light text-primary">{nBackLevel}-Back</span>
            </div>
            
            <div className="glass-panel p-4 h-48 flex flex-col relative overflow-hidden">
               <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-4 z-10 relative">Delta Longitudinal (Últimas 10 sesiones)</span>
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
                          formatter={(value) => [`${value} pts`, 'Reducción de Ansiedad']}
                          labelStyle={{display: 'none'}}
                          cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                        />
                        <Area type="monotone" dataKey="delta" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorDelta)" />
                      </AreaChart>
                    </ResponsiveContainer>
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-on-surface-variant/50">
                      No hay datos de sesión disponibles
                   </div>
                 )}
               </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-mono text-on-surface-variant tracking-[0.2em] uppercase mb-4">Calibración Sensorial</h3>
            
            <div className="flex flex-col gap-3">
              <div className="glass-panel p-4 flex flex-col gap-3">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">Generación de Ruido</span>
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
              </div>
              
              <div className="glass-panel p-4 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">Respuesta Háptica</span>
                <button
                  onClick={() => setAudioConfig({ haptics: !audioConfig.haptics })}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${audioConfig.haptics ? 'bg-primary' : 'bg-surface-dim'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${audioConfig.haptics ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </section>
          
          <div className="mt-auto pt-8 flex flex-col gap-2">
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
