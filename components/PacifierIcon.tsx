export default function PacifierIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Nipple / teat */}
      <ellipse cx="12" cy="3" rx="2" ry="2.5" />
      {/* Neck connector */}
      <rect x="11" y="5" width="2" height="2" />
      {/* Shield */}
      <circle cx="12" cy="12" r="5.5" />
      {/* Centre dot (slightly lighter feel — same color so invisible on solid bg) */}
      {/* Handle ring at bottom */}
      <rect x="10.5" y="18" width="3" height="3" rx="1.5" />
    </svg>
  );
}
