export default function HGMonogram({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo-mark.png" alt="Holy Grail" className={`${className ?? ''} object-contain`} />
  );
}
