// Showroom hours per the Contact page: "By appointment only, 10am – 7pm".
// Appointments are booked in 1-hour slots, so the last bookable start hour
// is 18 (6–7pm) — booking at 19 would run past closing.
export const APPOINTMENT_OPEN_HOUR = 10;
export const APPOINTMENT_CLOSE_HOUR = 19;

export function bookableHours(): number[] {
  const hours: number[] = [];
  for (let h = APPOINTMENT_OPEN_HOUR; h < APPOINTMENT_CLOSE_HOUR; h++) hours.push(h);
  return hours;
}

export function formatHourRange(hour: number): string {
  const label = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}${period}`;
  };
  return `${label(hour)} – ${label(hour + 1)}`;
}

export const APPOINTMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending Confirmation',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

export const APPOINTMENT_STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-stone-100 text-stone-700',
};
