export const LogoIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* C Shape */}
    <path
      d="M 85 25 A 45 45 0 1 0 85 95 L 75 80 A 27 27 0 1 1 75 40 Z"
      fill="currentColor"
    />
    {/* Wave Shape */}
    <path
      d="M 50 60 L 58 40 L 72 80 L 86 40 L 96 60"
      stroke="currentColor"
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
