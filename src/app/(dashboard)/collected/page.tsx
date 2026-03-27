"use client";

import { useEffect, useState, useCallback } from "react";
import type { CollectorBooking } from "@/lib/types";
import { fetchCurrentBookings, fetchPastBookings, getErrorMessage } from "@/lib/api";
import { useSetBookingCounts } from "@/lib/booking-counts-context";
import { BookingCard } from "@/components/booking-card";
import { EmptyState } from "@/components/empty-state";
import { PullToRefresh } from "@/components/pull-to-refresh";

export default function CollectedPage() {
  const [bookings, setBookings] = useState<CollectorBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setCollectedCount } = useSetBookingCounts();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // SAMPLE_COLLECTED bookings can be in either bucket —
      // the backend moves bookings to "past" when end_at < now(),
      // even if they haven't been delivered yet.
      const [currentData, pastData] = await Promise.all([
        fetchCurrentBookings({ limit: 50, status: "SAMPLE_COLLECTED" }),
        fetchPastBookings({ limit: 50, status: "SAMPLE_COLLECTED" }),
      ]);
      const all = [...currentData.items, ...pastData.items];
      const sorted = all.sort(
        (a, b) => new Date(a.sample_collected_at ?? 0).getTime() - new Date(b.sample_collected_at ?? 0).getTime()
      );
      setBookings(sorted);
      setCollectedCount(sorted.length);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PullToRefresh onRefresh={load}>
      <h2 className="mb-4 text-xl text-dark-teal">Collected</h2>

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
          title="No collected samples"
          message="Samples awaiting lab delivery will appear here."
          variant="collected"
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.booking_id}
              booking={booking}
              showTimestamps
            />
          ))}
        </div>
      )}
    </PullToRefresh>
  );
}
