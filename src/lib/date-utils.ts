import type { CollectorBooking } from "./types";

const TZ = "Asia/Dubai";

function getDubaiDateStr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-CA", { timeZone: TZ });
}

function getTodayStr(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function getDateLabel(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  const bookingDate = getDubaiDateStr(dateStr);
  if (bookingDate === getTodayStr()) return "Today";
  if (bookingDate === getTomorrowStr()) return "Tomorrow";
  return new Date(dateStr).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
}

export function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const bookingDate = getDubaiDateStr(dateStr);
  if (bookingDate === getTodayStr()) return "Today";
  if (bookingDate === getTomorrowStr()) return "Tomorrow";
  const now = new Date();
  const target = new Date(dateStr);
  const sameYear =
    now.toLocaleDateString("en-CA", { timeZone: TZ }).slice(0, 4) ===
    target.toLocaleDateString("en-CA", { timeZone: TZ }).slice(0, 4);
  if (sameYear) {
    return target.toLocaleDateString("en-AE", {
      day: "numeric",
      month: "short",
      timeZone: TZ,
    });
  }
  return target.toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
}

export function groupBookingsByDate(
  bookings: CollectorBooking[],
): { label: string; bookings: CollectorBooking[] }[] {
  const groups: { label: string; bookings: CollectorBooking[] }[] = [];
  for (const booking of bookings) {
    const label = getDateLabel(booking.start_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.bookings.push(booking);
    } else {
      groups.push({ label, bookings: [booking] });
    }
  }
  return groups;
}
