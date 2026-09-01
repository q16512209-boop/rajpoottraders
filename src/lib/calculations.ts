export interface InstallmentBreakdown {
  cashPrice: number;
  downPayment: number;
  financedAmount: number;
  markupRatePct: number;
  totalMarkup: number;
  totalPayable: number;
  durationMonths: number;
  monthlyInstallment: number;
}

/**
 * Computes hire-purchase markup and monthly installment breakdown
 */
export function calculateInstallmentBreakdown(
  cashPrice: number,
  downPayment: number,
  durationMonths: number,
  markupRatePct: number = 25 // default 25% annual or flat markup per agreement
): InstallmentBreakdown {
  const financed = Math.max(0, cashPrice - downPayment);
  // Markup calculated on financed principal across tenure
  const totalMarkup = Math.round((financed * (markupRatePct / 100) * durationMonths) / 12);
  const totalPayable = financed + totalMarkup;
  const monthlyInstallment = durationMonths > 0 ? Math.ceil(totalPayable / durationMonths) : 0;

  return {
    cashPrice,
    downPayment,
    financedAmount: financed,
    markupRatePct,
    totalMarkup,
    totalPayable,
    durationMonths,
    monthlyInstallment,
  };
}

export interface PaymentAllocationResult {
  paidAmount: number;
  allocatedLateFee: number;
  allocatedPastShort: number;
  allocatedPrincipal: number;
  newPendingLateFee: number;
  newShortArrears: number;
  excessAdvanceCredit: number;
  status: "PAID" | "SHORT_PAID" | "OVERPAID";
  summary: string;
}

/**
 * Core Waterfall Deduction Engine:
 * Deducts payment strictly in priority:
 * 1. Late Penalties
 * 2. Past Short Arrears
 * 3. Standard Principal EMI
 * Rolls unpaid deficit into accumulated arrears.
 */
export function allocateInstallmentPayment(
  paidAmount: number,
  currentDuePrincipal: number,
  pendingLateFee: number = 0,
  pastShortArrears: number = 0
): PaymentAllocationResult {
  let remaining = paidAmount;

  // 1. Settle Late Penalties first
  const allocatedLateFee = Math.min(remaining, pendingLateFee);
  remaining -= allocatedLateFee;
  const newPendingLateFee = pendingLateFee - allocatedLateFee;

  // 2. Settle Past Short Arrears
  const allocatedPastShort = Math.min(remaining, pastShortArrears);
  remaining -= allocatedPastShort;
  const remainingPastShort = pastShortArrears - allocatedPastShort;

  // 3. Settle Current Principal EMI
  const allocatedPrincipal = Math.min(remaining, currentDuePrincipal);
  remaining -= allocatedPrincipal;

  // 4. Calculate any shortfall on current principal
  const currentShortfall = Math.max(0, currentDuePrincipal - allocatedPrincipal);
  const newShortArrears = remainingPastShort + currentShortfall;
  const excessAdvanceCredit = Math.max(0, remaining);

  let status: "PAID" | "SHORT_PAID" | "OVERPAID" = "PAID";
  if (newShortArrears > 0 || newPendingLateFee > 0) {
    status = "SHORT_PAID";
  } else if (excessAdvanceCredit > 0) {
    status = "OVERPAID";
  }

  const summary =
    status === "SHORT_PAID"
      ? `Short payment: Paid Rs. ${paidAmount.toLocaleString()} vs total obligation. Remaining arrears Rs. ${newShortArrears.toLocaleString()} rolled into account.`
      : status === "OVERPAID"
      ? `Full payment with Rs. ${excessAdvanceCredit.toLocaleString()} advance credit.`
      : `Full installment of Rs. ${paidAmount.toLocaleString()} settled cleanly.`;

  return {
    paidAmount,
    allocatedLateFee,
    allocatedPastShort,
    allocatedPrincipal,
    newPendingLateFee,
    newShortArrears,
    excessAdvanceCredit,
    status,
    summary,
  };
}
