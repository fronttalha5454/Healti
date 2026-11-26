import logoUrl from '../../assets/healthi-logo.png';

interface HealthiLogoProps {
  size?: number;
  className?: string;
  /** Show the "Healthi" wordmark next to the icon */
  withText?: boolean;
}

/** Healthi brand mark (the app icon), optionally with the wordmark. */
export function HealthiLogo({ size = 40, className = '', withText = false }: HealthiLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={logoUrl}
        width={size}
        height={size}
        alt="Healthi"
        className="flex-shrink-0 rounded-[22%]"
        draggable={false}
      />
      {withText && (
        <span className="font-bold tracking-tight text-text" style={{ fontSize: size * 0.55 }}>
          Health<span className="text-accent">i</span>
        </span>
      )}
    </span>
  );
}
