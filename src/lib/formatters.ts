/**
 * Format currency in Pakistani Rupees (PKR)
 */
export function formatPKR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "Rs. 0";
  return `Rs. ${Math.round(amount).toLocaleString("en-PK")}`;
}

/**
 * Format ISO date string into readable English & Urdu formats
 */
export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "-";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "-";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format CNIC to standard format: 35201-1234567-1
 */
export function formatCNIC(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
}

/**
 * Phone number formatter for Pakistan: 0300-1234567
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

/**
 * Status color helper for badges
 */
export function getStatusBadgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case "PAID":
    case "SETTLED":
    case "ACTIVE":
    case "APPROVED":
    case "VERIFIED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20";
    case "PENDING":
    case "DUE":
    case "SUBMITTED":
      return "bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20";
    case "OVERDUE":
    case "DEFUALTER":
    case "REJECTED":
    case "HIGH_RISK":
      return "bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20";
    case "SHORT_PAID":
    case "PARTIAL":
      return "bg-orange-50 text-orange-700 border-orange-200 ring-orange-600/20";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200 ring-slate-600/20";
  }
}
