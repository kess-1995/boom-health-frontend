"use client";

import { useEffect, useState, useCallback } from "react";
import type { CollectorBooking } from "@/lib/types";
import { fetchCurrentBookings, getErrorMessage } from "@/lib/api";
import { groupBookingsByDate } from "@/lib/date-utils";
import { useSetBookingCounts } from "@/lib/booking-counts-context";
import { BookingCard } from "@/components/booking-card";
import { EmptyState } from "@/components/empty-state";
import { PullToRefresh } from "@/components/pull-to-refresh";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<CollectorBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setUpcomingCount } = useSetBookingCounts();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCurrentBookings({ limit: 50, status: "ACTIVE" });
      const sorted = [...data.items].sort(
        (a, b) => new Date(a.start_at ?? 0).getTime() - new Date(b.start_at ?? 0).getTime()
      );
      setBookings(sorted);
      setUpcomingCount(sorted.length);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groups = groupBookingsByDate(bookings);

  return (
    <PullToRefresh onRefresh={load}>
      <h2 className="mb-4 text-xl text-dark-teal">Upcoming</h2>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={load} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {loading && bookings.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl bg-beige p-4">
              <div className="h-4 w-2/3 rounded bg-teal/10" />
              <div className="mt-2 h-3 w-1/3 rounded bg-teal/10" />
              <div className="mt-3 h-3 w-1/2 rounded bg-teal/10" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No upcoming bookings"
          message="New bookings will appear here when customers place orders."
          variant="upcoming"
        />
      ) : (
        <div>
          {groups.map((group) => (
            <div key={group.label}>
              <h3 className="sticky top-[57px] z-10 -mx-4 bg-cream px-4 py-2 text-xs uppercase tracking-wider text-teal/60">
                {group.label}
              </h3>
              {group.bookings.map((booking) => (
                <BookingCard key={booking.booking_id} booking={booking} variant="upcoming" />
              ))}
            </div>
          ))}
        </div>
      )}
    </PullToRefresh>
  );
}
