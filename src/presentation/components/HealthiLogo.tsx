interface HealthiLogoProps {
  size?: number;
  className?: string;
  /** Show the "Healthi" wordmark next to the icon */
  withText?: boolean;
}

/**
 * Healthi brand mark: a heart-shaped leaf with a pulse line, drawn as inline SVG
 * (no external asset, works offline and inside the APK).
 */
export function HealthiLogo({ size = 40, className = '', withText = false }: HealthiLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Healthi" className="flex-shrink-0">
        <defs>
          <linearGradient id="healthi-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#healthi-g)" />
        <path
          d="M32 50c-9-6.5-17-12.6-17-21.2C15 23.4 19 19 24.3 19c3.3 0 6 1.8 7.7 4.4C33.7 20.8 36.4 19 39.7 19 45 19 49 23.4 49 28.8 49 37.4 41 43.5 32 50z"
          fill="#ffffff"
          fillOpacity="0.95"
        />
        <path
          d="M18 32h8l3-6 5 12 3-6h9"
          fill="none"
          stroke="#10b981"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withText && (
        <span className="font-bold tracking-tight text-text" style={{ fontSize: size * 0.55 }}>
          Health<span className="text-accent">i</span>
        </span>
      )}
    </span>
  );
}
