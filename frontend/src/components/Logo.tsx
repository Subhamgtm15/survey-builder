interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="9" fill="#0f766e" />
        <rect x="8" y="17" width="4" height="7" rx="2" fill="#5eead4" />
        <rect x="14" y="12" width="4" height="12" rx="2" fill="#99f6e4" />
        <rect x="20" y="8" width="4" height="16" rx="2" fill="#ffffff" />
      </svg>
      {showText && (
        <span className="font-display text-xl font-semibold tracking-tight text-stone-900">
          Surveyor
        </span>
      )}
    </span>
  );
}
