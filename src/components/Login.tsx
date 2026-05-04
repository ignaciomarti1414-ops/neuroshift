import { useAuth } from '../lib/AuthContext';
import { LogoIcon } from './LogoIcon';

export const Login = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex flex-col h-[100dvh] items-center justify-center p-4 w-full bg-background overflow-hidden">
      <div className="glass-panel p-8 md:p-12 max-w-md w-full flex flex-col items-center">
        <div className="relative mb-4 md:mb-6">
           <div className="absolute inset-0 bg-primary/20 blur-[20px] rounded-full"></div>
           <LogoIcon className="w-16 h-16 md:w-20 md:h-20 text-primary relative z-10" />
        </div>
        <h1 className="text-2xl md:text-3xl font-light tracking-wide mb-1 md:mb-2 text-center text-on-surface">NeuroShift</h1>
        <p className="text-on-surface-variant font-mono text-[10px] md:text-xs mb-8 md:mb-12 text-center uppercase tracking-widest leading-relaxed">
          Intervención Clínica Digital <br/> Para Reset de Dopamina
        </p>
        
        <button
          onClick={signInWithGoogle}
          className="btn-primary"
        >
          Acceder con Google
        </button>
      </div>
    </div>
  );
};
