"use client";

import type { BookingStatus } from "@/lib/types";

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string }> = {
  CREATED: { label: "New", bg: "bg-blue-100", text: "text-blue-800" },
  ACTIVE: { label: "Upcoming", bg: "bg-amber-100", text: "text-amber-800" },
  SAMPLE_COLLECTED: { label: "Collected", bg: "bg-teal/10", text: "text-teal" },
  SAMPLE_DELIVERED: { label: "Delivered", bg: "bg-emerald-100", text: "text-emerald-800" },
  FULFILLED: { label: "Fulfilled", bg: "bg-green-100", text: "text-green-800" },
  COMPLETED: { label: "Completed", bg: "bg-green-100", text: "text-green-800" },
  CANCELLED: { label: "Cancelled", bg: "bg-red-100", text: "text-red-800" },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.ACTIVE;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-normal ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
