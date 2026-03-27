"use client";

import { useEffect, useState, useCallback } from "react";
import type { CollectorBooking } from "@/lib/types";
import { fetchPastBookings, getErrorMessage } from "@/lib/api";
import { BookingCard } from "@/components/booking-card";
import { EmptyState } from "@/components/empty-state";
import { PullToRefresh } from "@/components/pull-to-refresh";

export default function DeliveredPage() {
  const [bookings, setBookings] = useState<CollectorBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPastBookings({ limit: 50 });
      // Filter to only delivered/fulfilled/completed — exclude SAMPLE_COLLECTED
      // and ACTIVE bookings that ended up in past bucket due to end_at < now()
      const delivered = data.items.filter((b) =>
        ["SAMPLE_DELIVERED", "FULFILLED", "COMPLETED"].includes(b.booking_status)
      );
      const sorted = delivered.sort(
        (a, b) => new Date(b.sample_delivered_at ?? 0).getTime() - new Date(a.sample_delivered_at ?? 0).getTime()
      );
      setBookings(sorted);
      setNextCursor(data.next_before_start_at);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchPastBookings({
        limit: 20,
        before_start_at: nextCursor,
      });
      setBookings((prev) => [...prev, ...data.items]);
      setNextCursor(data.next_before_start_at);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PullToRefresh onRefresh={load}>
      <h2 className="mb-4 text-xl text-dark-teal">Delivered</h2>

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
          title="No delivered samples"
          message="Completed deliveries will appear here."
          variant="delivered"
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

          {nextCursor && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full rounded-xl border border-beige px-4 py-3 text-sm text-teal transition-colors hover:bg-beige disabled:opacity-50"
            >
              {loadingMore ? "Loading more..." : "Load more"}
            </button>
          )}
        </div>
      )}
    </PullToRefresh>
  );
}
