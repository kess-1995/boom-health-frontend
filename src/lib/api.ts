import type {
  BookingsResponse,
  SampleCollectedResponse,
  SampleDeliveredResponse,
  PatientUpdateRequest,
  CollectorBooking,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const COLLECTOR_ID = process.env.NEXT_PUBLIC_COLLECTOR_PARTY_ID ?? "BOOM_HEALTH";

class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...options?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiClientError(
      data.message ?? data.error ?? "Request failed",
      res.status,
      data.error,
      data,
    );
  }

  return data as T;
}

// ---------- Bookings ----------

export function fetchCurrentBookings(params?: {
  limit?: number;
  before_start_at?: string;
  status?: string;
}): Promise<BookingsResponse> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.before_start_at) qs.set("before_start_at", params.before_start_at);
  if (params?.status) qs.set("status", params.status);

  const query = qs.toString() ? `?${qs}` : "";
  return request<BookingsResponse>(
    `/collectors/${COLLECTOR_ID}/bookings/current${query}`,
  );
}

export function fetchPastBookings(params?: {
  limit?: number;
  before_start_at?: string;
  status?: string;
}): Promise<BookingsResponse> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.before_start_at) qs.set("before_start_at", params.before_start_at);
  if (params?.status) qs.set("status", params.status);

  const query = qs.toString() ? `?${qs}` : "";
  return request<BookingsResponse>(
    `/collectors/${COLLECTOR_ID}/bookings/past${query}`,
  );
}

// ---------- Patient Updates ----------

export function updateBookingPatients(
  bookingId: number,
  updates: PatientUpdateRequest[],
): Promise<CollectorBooking> {
  return request<CollectorBooking>(
    `/collectors/${COLLECTOR_ID}/bookings/${bookingId}/patients`,
    {
      method: "PATCH",
      body: JSON.stringify({ updates }),
    },
  );
}

// ---------- Sample Collection / Delivery ----------

export function markSampleCollected(
  bookingId: number,
  collectedAt?: string,
): Promise<SampleCollectedResponse> {
  const body: Record<string, string> = {
    event_id: `evt_sample_collected_booking_${bookingId}`,
  };
  if (collectedAt) body.collected_at = collectedAt;

  return request<SampleCollectedResponse>(
    `/collectors/${COLLECTOR_ID}/bookings/${bookingId}/sample-collected`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export function markSampleDelivered(
  bookingId: number,
  deliveredAt?: string,
): Promise<SampleDeliveredResponse> {
  const body: Record<string, string> = {};
  if (deliveredAt) body.delivered_at = deliveredAt;

  return request<SampleDeliveredResponse>(
    `/collectors/${COLLECTOR_ID}/bookings/${bookingId}/sample-delivered`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

// ---------- Error Helpers ----------

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    switch (error.code) {
      case "missing_patient_national_id":
        return "All members must have Emirates ID before sample collection.";
      case "patient_national_id_conflict":
        return "This member already has a different Emirates ID attached.";
      case "patient_not_in_booking":
        return "One or more members were not found in this booking.";
      case "invalid_booking_state":
        return "This booking can no longer be updated from its current state.";
      case "booking_not_found":
        return "Booking not found or not assigned to this collector.";
      case "patient_not_in_booking":
        return "One or more patients were not found in this booking.";
      case "duplicate_current_patient_id":
        return "Duplicate patient ID in the request.";
      default:
        return error.message;
    }
  }
  return "Something went wrong. Please try again.";
}

export { ApiClientError };
