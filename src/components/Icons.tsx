// Minimal SVG icons — more sophisticated than emoji, consistent with the star-diary aesthetic

export function StarLogo({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 2.8c1.1 4.1 2.4 5.4 6.5 6.5-4.1 1.1-5.4 2.4-6.5 6.5-1.1-4.1-2.4-5.4-6.5-6.5 4.1-1.1 5.4-2.4 6.5-6.5Z"
        fill="currentColor"
        opacity={0.92}
      />
      <path
        d="M18.4 13.2c.42 1.58.93 2.09 2.5 2.5-1.57.42-2.08.93-2.5 2.5-.42-1.57-.93-2.08-2.5-2.5 1.57-.41 2.08-.92 2.5-2.5Z"
        fill="currentColor"
        opacity={0.48}
      />
      <path
        d="M6.1 15.1c.34 1.26.75 1.67 2 2-1.25.34-1.66.75-2 2-.34-1.25-.75-1.66-2-2 1.25-.33 1.66-.74 2-2Z"
        fill="currentColor"
        opacity={0.38}
      />
      <path
        d="M4.2 11.5c3.25 2.6 8.35 3.08 13.8 1.18M19.7 10.1C16.6 7.6 11.72 7.02 6.38 8.55"
        stroke="currentColor"
        strokeWidth={1.15}
        strokeLinecap="round"
        opacity={0.46}
      />
    </svg>
  );
}

export function StarOutline({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
    >
      <path
        d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5L8 14l-6-4.5h7.5L12 2z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarFilled({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5L8 14l-6-4.5h7.5L12 2z" />
    </svg>
  );
}

export function CalendarIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function SparkleIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      className={className}
    >
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
      <path d="M18 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity={0.5} />
    </svg>
  );
}

export function CompassIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

export function GalaxyIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      className={className}
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity={0.3} />
      <ellipse cx="12" cy="12" rx="9" ry="3" opacity={0.4} transform="rotate(-30 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3" opacity={0.25} transform="rotate(30 12 12)" />
      <circle cx="12" cy="12" r="9" opacity={0.15} />
    </svg>
  );
}
