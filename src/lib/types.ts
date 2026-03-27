export type BookingStatus =
  | "CREATED"
  | "ACTIVE"
  | "SAMPLE_COLLECTED"
  | "SAMPLE_DELIVERED"
  | "FULFILLED"
  | "COMPLETED"
  | "CANCELLED";

export type TestItem = {
  product_uuid: string;
  display_name: string;
  product_type: string;
  price_aed_fils: number;
};

export type Test = {
  test_ref: string;
  kind: string;
  product_uuid: string;
  display_name: string;
  addons: unknown[];
  total_price_aed_fils: number;
  items: TestItem[];
};

export type Patient = {
  patient_id: string;
  name: string | null;
  age: number | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  national_id: string | null;
  tests_count: number;
  tests?: Test[];
};

export type Customer = {
  customer_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

export type Location = {
  address_id: string;
  line1: string | null;
  building_name: string | null;
  floor_number: string | null;
  line2: string | null;
  area: string | null;
  city: string | null;
  emirate: string | null;
  country: string | null;
  latitude: string | null;
  longitude: string | null;
  formatted: string | null;
};

export type CollectorBooking = {
  booking_id: number;
  order_id: string;
  booking_status: BookingStatus;
  order_status: string;
  resource_type: string;
  resource_id: string;
  start_at: string | null;
  end_at: string | null;
  created_at: string | null;
  sample_collected_at: string | null;
  sample_delivered_at: string | null;
  sample_collected_by_party_id: string | null;
  sample_delivered_by_party_id: string | null;
  lab_party_id?: string | null;
  amount_expected_aed_fils: number | null;
  amount_captured_aed_fils: number | null;
  currency_expected: string | null;
  currency_captured: string | null;
  paid_at: string | null;
  patient_count: number;
  all_patients_identified: boolean;
  missing_patient_ids: string[];
  patients: Patient[];
  customer?: Customer;
  location?: Location;
};

export type Collector = {
  party_id: string;
  display_name: string;
};

export type BookingsResponse = {
  collector: Collector;
  bucket: "current" | "past";
  items: CollectorBooking[];
  next_before_start_at: string | null;
};

export type SampleCollectedResponse = {
  status: string;
  event: string;
  booking_id: number;
  order_id: string;
  booking_status: BookingStatus;
  sample_collected_at: string;
  sample_collected_by_party_id: string;
  collector: Collector;
  workflow_run_id: string;
  temporal_workflow_id: string;
  temporal_run_id: string | null;
  workflow_status: string;
};

export type SampleDeliveredResponse = {
  status: string;
  event: string;
  booking_id: number;
  order_id: string;
  booking_status: BookingStatus;
  sample_delivered_at: string;
  sample_delivered_by_party_id: string;
  collector: Collector;
};

export type PatientUpdateRequest = {
  current_patient_id: string;
  new_patient_id?: string;
  name?: string;
  age?: number;
  gender?: string;
  email?: string;
  national_id?: string;
};

export type ApiError = {
  error: string;
  message?: string;
  missing_patient_ids?: string[];
};
