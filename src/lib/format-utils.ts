export function formatLabName(labPartyId: string | null | undefined): string | null {
  if (!labPartyId) return null;
  const stripped = labPartyId.replace(/^LAB_/i, "");
  return stripped
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
