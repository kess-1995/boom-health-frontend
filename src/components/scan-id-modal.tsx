"use client";

import { useState, useRef, useCallback } from "react";

type ScanMode = "select" | "upload" | "camera" | "manual";
type DocType = "emirates_id" | "passport";

export function ScanIdModal({
  patientName,
  onSubmit,
  onClose,
}: {
  patientName: string;
  onSubmit: (nationalId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<ScanMode>("select");
  const [docType, setDocType] = useState<DocType>("emirates_id");
  const [manualId, setManualId] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError("Unable to access camera. Please use file upload or enter manually.");
      setMode("manual");
    }
  }, []);

  const handleSelectDoc = (type: DocType) => {
    setDocType(type);
    setMode("upload");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitImage = async () => {
    if (!capturedImage) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scan-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedImage, docType }),
      });
      const data = await res.json();

      if (!res.ok || !data.national_id) {
        // Fall back to manual entry if scan fails or returns no ID
        setManualId(data.national_id ?? "");
        setMode("manual");
        setError(
          data.national_id
            ? null
            : "Could not read ID from the image. Please verify or enter manually.",
        );
        return;
      }

      // Scan succeeded — pre-fill and let the user confirm
      if (data.confidence === "high") {
        // High confidence: submit directly
        await onSubmit(data.national_id);
        onClose();
      } else {
        // Medium/low confidence: let user verify in manual mode
        setManualId(data.national_id);
        setMode("manual");
        setError("Please verify the extracted ID number before saving.");
      }
    } catch {
      setMode("manual");
      setError("Failed to process image. Please enter the ID manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit(manualId.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save ID.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white pb-20 sm:rounded-2xl sm:pb-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-beige p-4">
          <div>
            <h2 className="text-lg font-semibold text-dark-teal">Scan ID Document</h2>
            <p className="text-xs text-teal/70">For: {patientName}</p>
          </div>
          <button onClick={handleClose} className="rounded-full p-2 text-teal/50 hover:bg-beige">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {error}
            </div>
          )}

          {/* Document Type Selection */}
          {mode === "select" && (
            <div className="space-y-3">
              <p className="text-sm text-teal/70">Select document type:</p>
              <button
                onClick={() => handleSelectDoc("emirates_id")}
                className="flex w-full items-center gap-3 rounded-xl border-2 border-beige p-4 text-left transition-colors hover:border-teal"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10">
                  <svg className="h-5 w-5 text-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-dark-teal">Emirates ID</p>
                  <p className="text-xs text-teal/70">Scan the front of the Emirates ID card</p>
                </div>
              </button>
              <button
                onClick={() => handleSelectDoc("passport")}
                className="flex w-full items-center gap-3 rounded-xl border-2 border-beige p-4 text-left transition-colors hover:border-teal"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10">
                  <svg className="h-5 w-5 text-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9 9 0 0 1 3 12c0-1.47.353-2.856.978-4.082" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-dark-teal">Passport</p>
                  <p className="text-xs text-teal/70">Scan the data page of the passport</p>
                </div>
              </button>
              <button
                onClick={() => setMode("manual")}
                className="w-full py-2 text-center text-sm text-teal/70 hover:text-teal"
              >
                Enter ID manually instead
              </button>
            </div>
          )}

          {/* Upload Mode (Desktop Testing) */}
          {mode === "upload" && (
            <div className="space-y-3">
              <p className="text-sm text-teal/70">
                {docType === "emirates_id"
                  ? "Upload a photo of the Emirates ID card"
                  : "Upload a photo of the passport data page"}
              </p>
              {!capturedImage ? (
                <>
                  <button
                    onClick={handleUploadClick}
                    className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-teal/30 bg-cream px-4 py-8 text-sm font-medium text-teal transition-colors hover:border-teal hover:bg-beige"
                  >
                    <svg className="h-8 w-8 text-teal/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    Click to upload image or PDF
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleUploadedFile}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setMode("camera");
                        setTimeout(startCamera, 100);
                      }}
                      className="flex-1 rounded-lg border border-teal/30 px-4 py-2.5 text-sm font-medium text-teal"
                    >
                      Use Camera
                    </button>
                    <button
                      onClick={() => setMode("manual")}
                      className="flex-1 rounded-lg border border-teal/30 px-4 py-2.5 text-sm font-medium text-teal"
                    >
                      Enter Manually
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <img
                    src={capturedImage}
                    alt="Uploaded ID"
                    className="w-full rounded-xl"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCapturedImage(null)}
                      className="flex-1 rounded-lg border border-teal/30 px-4 py-2.5 text-sm font-medium text-teal"
                    >
                      Change
                    </button>
                    <button
                      onClick={handleSubmitImage}
                      disabled={loading}
                      className="flex-1 rounded-lg bg-teal px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {loading ? "Scanning with AI..." : "Scan ID"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Camera / Capture */}
          {mode === "camera" && (
            <div className="space-y-3">
              <p className="text-sm text-teal/70">
                {docType === "emirates_id"
                  ? "Position the Emirates ID card within the frame"
                  : "Position the passport data page within the frame"}
              </p>
              {!capturedImage ? (
                <div className="relative overflow-hidden rounded-xl bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="absolute inset-4 rounded-lg border-2 border-white/40" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-full bg-white/20 p-3 backdrop-blur-sm"
                    >
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                      </svg>
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="rounded-full bg-white p-4 shadow-lg"
                    >
                      <svg className="h-8 w-8 text-teal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <img
                    src={capturedImage}
                    alt="Captured ID"
                    className="w-full rounded-xl"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCapturedImage(null);
                        startCamera();
                      }}
                      className="flex-1 rounded-lg border border-teal/30 px-4 py-2.5 text-sm font-medium text-teal"
                    >
                      Retake
                    </button>
                    <button
                      onClick={handleSubmitImage}
                      disabled={loading}
                      className="flex-1 rounded-lg bg-teal px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {loading ? "Processing..." : "Use Photo"}
                    </button>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {/* Manual Entry */}
          {mode === "manual" && (
            <div className="space-y-3">
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured ID"
                  className="h-32 w-full rounded-xl object-cover"
                />
              )}
              <label className="block text-sm font-medium text-dark-teal">
                {docType === "passport" ? "Passport Number" : "Emirates ID Number"}
              </label>
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder={docType === "passport" ? "e.g. AB1234567" : "e.g. 784-1999-1234567-1"}
                className="w-full rounded-lg border border-beige bg-cream px-4 py-3 text-sm text-dark-teal placeholder:text-teal/40 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                autoFocus
              />
              <button
                onClick={handleManualSubmit}
                disabled={!manualId.trim() || loading}
                className="w-full rounded-lg bg-teal px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-dark-teal disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save ID"}
              </button>
              {mode === "manual" && !capturedImage && (
                <button
                  onClick={() => setMode("select")}
                  className="w-full py-2 text-center text-sm text-teal/70 hover:text-teal"
                >
                  Back to scan options
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
