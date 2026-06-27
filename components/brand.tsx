// Brand bits for the AWS Student Builder Group swag app — a pixel mosaic ribbon
// and a microchip logo, echoing the group's banner aesthetic.

const PATTERN = ["pink", "panel", "yellow", "panel", "pink", "yellow", "panel", "pink", "panel", "yellow", "pink", "panel", "yellow", "panel"];

export function Mosaic({ className = "" }: { className?: string }) {
  const squares = Array.from({ length: 80 }, (_, i) => PATTERN[i % PATTERN.length]);
  return (
    <div className={`flex h-2.5 w-full overflow-hidden ${className}`} aria-hidden>
      {squares.map((c, i) => (
        <span key={i} className="h-2.5 w-2.5 shrink-0" style={{ background: `var(--${c})` }} />
      ))}
    </div>
  );
}

export function ChipLogo({ size = 28 }: { size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-md bg-pink text-[var(--background)]"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 24 24" fill="none">
        {/* pins */}
        {[9, 11.25, 13.5].map((x) => (
          <g key={x}>
            <rect x={x} y="3.5" width="1.5" height="3" fill="currentColor" />
            <rect x={x} y="17" width="1.5" height="3" fill="currentColor" />
          </g>
        ))}
        {[9, 11.25, 13.5].map((y) => (
          <g key={y}>
            <rect x="3.5" y={y} width="3" height="1.5" fill="currentColor" />
            <rect x="17" y={y} width="3" height="1.5" fill="currentColor" />
          </g>
        ))}
        {/* chip body */}
        <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" fill="currentColor" />
        <rect x="10" y="10" width="4" height="4" rx="0.5" fill="var(--pink)" />
      </svg>
    </span>
  );
}
