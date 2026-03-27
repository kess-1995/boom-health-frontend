"use client";

import type { Patient } from "@/lib/types";

export function PatientCard({
  patient,
  onScanId,
  disabled,
}: {
  patient: Patient;
  onScanId: (patientId: string) => void;
  disabled?: boolean;
}) {
  const hasId = !!patient.national_id;

  return (
    <div className="rounded-xl border border-beige bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-dark-teal">
            {patient.name ?? "Unknown Patient"}
          </p>
          <p className="mt-0.5 text-xs text-teal/70">
            {patient.age != null ? `${patient.age} yrs` : "—"}
            {patient.gender ? ` · ${patient.gender}` : ""}
          </p>
        </div>
        {hasId ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            ID Verified
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            ID Missing
          </span>
        )}
      </div>

      {hasId ? (
        <p className="mt-3 rounded-lg bg-cream px-3 py-2 font-mono text-sm text-dark-teal">
          {patient.national_id}
        </p>
      ) : (
        <button
          onClick={() => onScanId(patient.patient_id)}
          disabled={disabled}
          className="mt-3 w-full rounded-lg border-2 border-dashed border-teal/30 bg-cream px-4 py-3 text-sm font-medium text-teal transition-colors hover:border-teal hover:bg-beige disabled:opacity-50"
        >
          <svg className="mx-auto mb-1 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
          Scan Emirates ID / Passport
        </button>
      )}

      {/* Tests */}
      {patient.tests && patient.tests.length > 0 && (
        <div className="mt-3 border-t border-beige pt-3">
          <p className="mb-1.5 text-xs text-teal/50">Tests ({patient.tests.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {patient.tests.map((test) => (
              <span
                key={test.test_ref}
                className="rounded-md bg-beige px-2 py-1 text-xs text-teal"
              >
                {test.display_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
