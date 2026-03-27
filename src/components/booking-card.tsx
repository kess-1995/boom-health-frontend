"use client";

import { useRouter } from "next/navigation";
import type { CollectorBooking } from "@/lib/types";
import { formatLabName } from "@/lib/format-utils";
import { formatRelativeDate } from "@/lib/date-utils";
import { StatusBadge } from "./status-badge";

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("en-AE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  });
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dubai",
  });
}

export function BookingCard({
  booking,
  showTimestamps = false,
  variant = "history",
}: {
  booking: CollectorBooking;
  showTimestamps?: boolean;
  variant?: "upcoming" | "history";
}) {
  const memberNames = booking.patients
    .map((p) => p.name ?? "Unknown")
    .join(", ");

  const missingIds = booking.patients.filter((p) => !p.national_id).length;
  const labName = formatLabName(booking.lab_party_id);

  const dateDisplay =
    variant === "upcoming"
      ? `${formatRelativeDate(booking.start_at)} · ${formatTime(booking.start_at)}`
      : `${formatDate(booking.start_at)} · ${formatTime(booking.start_at)}`;

  // Collect unique test names across all patients
  const allTestNames = Array.from(
    new Set(
      booking.patients.flatMap((p) => p.tests?.map((t) => t.display_name) ?? [])
    )
  );
  const testSummary =
    allTestNames.length <= 2
      ? allTestNames.join(", ")
      : `${allTestNames.slice(0, 2).join(", ")} +${allTestNames.length - 2} more`;

  const hasNav = booking.location?.latitude && booking.location?.longitude;
  const hasPhone = booking.customer?.phone;
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/bookings/${booking.booking_id}`)}
      className="block cursor-pointer border-b border-beige py-4 transition-colors active:bg-beige/30"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base text-dark-teal">
            {memberNames}
          </p>
          <p className="mt-0.5 text-xs text-teal/70">
            {dateDisplay}
          </p>
        </div>
        <StatusBadge status={booking.booking_status} />
      </div>

      {(labName || testSummary) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-teal/50">
          {labName && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
              {labName}
            </span>
          )}
          {labName && testSummary && <span className="text-teal/30">·</span>}
          {testSummary && <span>{testSummary}</span>}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 text-xs text-teal/70">
        <span className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          {booking.patient_count} member{booking.patient_count !== 1 ? "s" : ""}
        </span>
        {missingIds > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {missingIds} ID missing
          </span>
        )}
      </div>

      {/* Quick Actions */}
      {(hasNav || hasPhone) && (
        <div className="mt-3 flex gap-2" onClick={(e) => e.preventDefault()}>
          {hasNav && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${booking.location!.latitude},${booking.location!.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal/10 px-3 py-1.5 text-xs text-teal transition-colors active:bg-teal/20"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
              Navigate
            </a>
          )}
          {hasPhone && (
            <a
              href={`tel:${booking.customer!.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal/10 px-3 py-1.5 text-xs text-teal transition-colors active:bg-teal/20"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
              Call
            </a>
          )}
        </div>
      )}

      {showTimestamps && (
        <div className="mt-2 space-y-0.5 text-xs text-teal/70">
          {booking.sample_collected_at && (
            <p>
              Collected: {formatDate(booking.sample_collected_at)} at {formatTime(booking.sample_collected_at)}
            </p>
          )}
          {booking.sample_delivered_at && (
            <p>
              Delivered: {formatDate(booking.sample_delivered_at)} at {formatTime(booking.sample_delivered_at)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
