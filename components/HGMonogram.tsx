export default function HGMonogram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="14.5" />
      <path d="M9 10.5v11M9 16h5.5M14.5 10.5v11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 11.2c-1.1-.7-2.2-1-3.2-.6-1.6.6-2.3 2.6-2.3 5.4s.7 4.8 2.3 5.4c1 .4 2.1.1 3.2-.6v-4.3h-2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
