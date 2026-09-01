import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  const clean = q.trim().toLowerCase();
  const plans = store.getPlans();
  const match = plans.find(
    (p) =>
      p.planNumber.toLowerCase() === clean ||
      p.customerCnic.includes(clean) ||
      p.customerPhone.includes(clean) ||
      p.tamperProofHash.toLowerCase().includes(clean) ||
      p.schedule.some((s) => s.receiptId?.toLowerCase() === clean)
  );

  if (!match) {
    return NextResponse.json({ found: false, message: "No record found" }, { status: 404 });
  }

  return NextResponse.json({
    found: true,
    plan: {
      planNumber: match.planNumber,
      customerName: match.customerName,
      productTitle: match.productTitle,
      imeiSerial: match.imeiSerial,
      monthlyInstallment: match.monthlyInstallment,
      accumulatedShortArrears: match.accumulatedShortArrears,
      status: match.status,
      tamperProofHash: match.tamperProofHash,
    },
  });
}