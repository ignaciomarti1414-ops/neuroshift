import { useState } from 'react';
import { User, Flame } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { LogoIcon } from './LogoIcon';
import { ProfileDashboard } from './ProfileDashboard';
import { useNeuroStore } from '../store/useNeuroStore';

export const Header = ({ phase }: { phase: number }) => {
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const streak = useNeuroStore((state) => state.streak);

  const getPhaseName = () => {
    switch (phase) {
      case 1: return 'ENTRY';
      case 2: return 'FRICTION';
      case 3: return 'COHERENCE';
      case 4: return 'WORKSPACE';
      case 5: return 'EXECUTIVE';
      case 6: return 'CHECKOUT';
      default: return 'PHASE';
    }
  };

  return (
    <>
      <header className="flex justify-between items-center mb-0 md:mb-6 shrink-0 h-10 md:h-auto px-1 md:px-0 mt-2 md:mt-0">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <LogoIcon className="w-5 h-5 md:w-6 h-6 text-background" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm md:text-xl font-bold tracking-tight uppercase leading-none md:leading-normal">NeuroShift</h1>
            <span className="text-[8px] md:text-[10px] text-primary font-mono tracking-widest hidden md:inline-block">PROTOCOL 4.2.1</span>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-4">
          {streak > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#ff6b35]/10 border border-[#ff6b35]/20" title={`Racha: ${streak} días`}>
              <Flame className="w-3 h-3 text-[#ff6b35]" />
              <span className="text-[10px] font-mono text-[#ff6b35] font-bold">{streak}</span>
            </div>
          )}
          <div className="flex items-center gap-1 md:gap-2">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center gap-1 md:gap-2">
                <div className={`step-pill ${step < phase ? 'completed' : step === phase ? 'active' : ''}`}></div>
              </div>
            ))}
          </div>
          <span className="text-[10px] md:text-xs font-mono text-on-surface-variant md:mx-4 w-auto md:w-32 hidden sm:inline-block ml-1">
            PHASE {phase}: {getPhaseName()}
          </span>
          {user && (
            <button
              onClick={() => setShowProfile(true)}
              className="p-1.5 md:p-2 text-on-surface hover:text-primary transition-colors focus:outline-none bg-surface-dim border border-[rgba(255,255,255,0.05)] rounded-full"
              title="Clinical Profile"
            >
              <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          )}
        </div>
      </header>

      {showProfile && <ProfileDashboard onClose={() => setShowProfile(false)} />}
    </>
  );
};

