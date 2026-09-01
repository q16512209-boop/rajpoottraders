import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = store.recordInstallmentPayment({
      planId: body.planId,
      installmentNo: Number(body.installmentNo),
      amountPaid: Number(body.amountPaid),
      collectedBy: body.collectedBy,
      collectorRole: "FIELD_RECOVERY",
      notes: body.notes,
    });

    return NextResponse.json({ success: true, ...res });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Recovery logging failed" }, { status: 500 });
  }
}