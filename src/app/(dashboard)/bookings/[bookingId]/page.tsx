"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { CollectorBooking, Patient } from "@/lib/types";
import {
  fetchCurrentBookings,
  updateBookingPatients,
  markSampleCollected,
  markSampleDelivered,
  getErrorMessage,
} from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import { PatientCard } from "@/components/patient-card";
import { ScanIdModal } from "@/components/scan-id-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Toast } from "@/components/toast";

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  });
}

function formatAmount(fils: number | null): string {
  if (fils == null) return "—";
  return `AED ${(fils / 100).toFixed(2)}`;
}

function getUaeNow(): string {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Dubai" }).replace(" ", "T") + "+04:00";
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = Number(params.bookingId);

  const [booking, setBooking] = useState<CollectorBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [scanPatient, setScanPatient] = useState<Patient | null>(null);
  const [confirmAction, setConfirmAction] = useState<"collect" | "deliver" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch current bookings and find the matching one
      const currentData = await fetchCurrentBookings({ limit: 200 });
      const found = currentData.items.find((b) => b.booking_id === bookingId);
      if (found) {
        setBooking(found);
      } else {
        // Try past bookings
        const { fetchPastBookings } = await import("@/lib/api");
        const pastData = await fetchPastBookings({ limit: 200 });
        const pastFound = pastData.items.find((b) => b.booking_id === bookingId);
        if (pastFound) {
          setBooking(pastFound);
        } else {
          setError("Booking not found.");
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveId = async (nationalId: string) => {
    if (!booking || !scanPatient) return;
    await updateBookingPatients(booking.booking_id, [
      { current_patient_id: scanPatient.patient_id, national_id: nationalId },
    ]);
    setToast({ message: "Emirates ID saved successfully", type: "success" });
    await load();
  };

  const handleCollect = async () => {
    if (!booking) return;
    setActionLoading(true);
    try {
      await markSampleCollected(booking.booking_id, getUaeNow());
      setToast({ message: "Sample marked as collected", type: "success" });
      setConfirmAction(null);
      router.push("/collected");
    } catch (err) {
      setToast({ message: getErrorMessage(err), type: "error" });
      setConfirmAction(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (!booking) return;
    setActionLoading(true);
    try {
      await markSampleDelivered(booking.booking_id, getUaeNow());
      setToast({ message: "Sample marked as delivered", type: "success" });
      setConfirmAction(null);
      router.push("/delivered");
    } catch (err) {
      setToast({ message: getErrorMessage(err), type: "error" });
      setConfirmAction(null);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse rounded-xl bg-beige p-4">
          <div className="h-5 w-1/2 rounded bg-teal/10" />
          <div className="mt-3 h-4 w-1/3 rounded bg-teal/10" />
        </div>
        <div className="animate-pulse rounded-xl bg-beige p-4">
          <div className="h-4 w-2/3 rounded bg-teal/10" />
          <div className="mt-2 h-4 w-1/2 rounded bg-teal/10" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-8 text-center">
        <p className="text-sm text-red-700">{error ?? "Booking not found"}</p>
        <button
          onClick={() => router.push("/bookings")}
          className="mt-3 text-sm font-medium text-teal underline"
        >
          Back to bookings
        </button>
      </div>
    );
  }

  const canCollect = booking.all_patients_identified && booking.booking_status === "ACTIVE";
  const canDeliver = booking.booking_status === "SAMPLE_COLLECTED";
  const isTerminal = ["SAMPLE_DELIVERED", "FULFILLED", "COMPLETED", "CANCELLED"].includes(booking.booking_status);

  return (
    <div className="space-y-4 pb-4">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-teal"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back
      </button>

      {/* Booking Info */}
      <div className="border-b border-beige pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-teal/60">Order</p>
            <p className="font-mono text-sm text-dark-teal">{booking.order_id}</p>
          </div>
          <StatusBadge status={booking.booking_status} />
        </div>

        <div className="mt-4">
          <p className="text-xs text-teal/60">Scheduled</p>
          <p className="text-sm text-dark-teal">
            {formatDateTime(booking.start_at)}
          </p>
        </div>

        {/* Timestamps */}
        {booking.sample_collected_at && (
          <div className="mt-3 rounded-lg bg-teal/5 px-3 py-2">
            <p className="text-xs text-teal/70">
              <span className="text-teal">Collected:</span>{" "}
              {formatDateTime(booking.sample_collected_at)}
            </p>
          </div>
        )}
        {booking.sample_delivered_at && (
          <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2">
            <p className="text-xs text-emerald-700">
              <span>Delivered:</span>{" "}
              {formatDateTime(booking.sample_delivered_at)}
            </p>
          </div>
        )}
      </div>

      {/* Location & Contact */}
      {(booking.location || booking.customer?.phone) && (
        <div className="border-b border-beige pb-4">
          {booking.location?.formatted && (
            <div className="mb-3">
              <p className="text-xs text-teal/60">Location</p>
              <p className="mt-0.5 text-sm text-dark-teal">{booking.location.formatted}</p>
              {booking.location.latitude && booking.location.longitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${booking.location.latitude},${booking.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-teal/10 px-3 py-2 text-xs text-teal transition-colors active:bg-teal/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                  </svg>
                  Open in Google Maps
                </a>
              )}
            </div>
          )}

          {booking.customer?.phone && (
            <div>
              <p className="text-xs text-teal/60">Customer Phone</p>
              <a
                href={`tel:${booking.customer.phone}`}
                className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-dark-teal"
              >
                <svg className="h-4 w-4 text-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                {booking.customer.phone}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Patients */}
      <div>
        <h3 className="mb-3 text-sm text-dark-teal">
          Members ({booking.patient_count})
        </h3>
        <div className="space-y-3">
          {booking.patients.map((patient) => (
            <PatientCard
              key={patient.patient_id}
              patient={patient}
              onScanId={() => setScanPatient(patient)}
              disabled={isTerminal}
            />
          ))}
        </div>
      </div>

      {/* Warning for missing IDs */}
      {!booking.all_patients_identified && !isTerminal && (
        <div className="rounded-xl bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            All members must have Emirates ID before sample collection.
          </p>
          <p className="mt-1 text-xs text-amber-700">
            {booking.missing_patient_ids.length} member{booking.missing_patient_ids.length !== 1 ? "s" : ""} missing ID
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {!isTerminal && (
        <div className="space-y-3 pt-2">
          {booking.booking_status === "ACTIVE" && (
            <button
              onClick={() => setConfirmAction("collect")}
              disabled={!canCollect}
              className="w-full rounded-xl bg-teal px-4 py-4 text-base font-normal text-white shadow-sm transition-colors hover:bg-dark-teal disabled:cursor-not-allowed disabled:bg-teal/30"
            >
              Mark Sample Collected
            </button>
          )}
          {canDeliver && (
            <button
              onClick={() => setConfirmAction("deliver")}
              className="w-full rounded-xl bg-emerald-600 px-4 py-4 text-base font-normal text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              Mark Sample Delivered
            </button>
          )}
        </div>
      )}

      {/* Scan ID Modal */}
      {scanPatient && (
        <ScanIdModal
          patientName={scanPatient.name ?? "Unknown Patient"}
          onSubmit={handleSaveId}
          onClose={() => setScanPatient(null)}
        />
      )}

      {/* Confirm Dialogs */}
      {confirmAction === "collect" && (
        <ConfirmDialog
          title="Confirm Sample Collection"
          message="This will mark the sample as collected with the current timestamp. This action cannot be undone."
          confirmLabel="Yes, Mark Collected"
          loading={actionLoading}
          onConfirm={handleCollect}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === "deliver" && (
        <ConfirmDialog
          title="Confirm Sample Delivery"
          message="This will mark the sample as delivered to the lab with the current timestamp. This action cannot be undone."
          confirmLabel="Yes, Mark Delivered"
          loading={actionLoading}
          onConfirm={handleDeliver}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
