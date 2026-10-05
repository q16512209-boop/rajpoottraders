import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/db/mongoose";
import { Plan } from "@/models/Plan";
import { Installment } from "@/models/Installment";
import { CashLedger } from "@/models/CashLedger";
import { getDatabase } from "@/lib/db/mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const batches = body.batches || body.queue || [];

    if (!Array.isArray(batches) || batches.length === 0) {
      return NextResponse.json(
        { success: false, error: "No offline collection batches provided." },
        { status: 400 }
      );
    }

    await connectMongoose();
    const db = await getDatabase();

    let syncedCount = 0;
    let duplicateCount = 0;
    let totalAmount = 0;
    const results: Array<{ uuid: string; planNumber: string; status: string; amount: number }> = [];

    for (const item of batches) {
      const clientUUID = item.clientUUID || item.tempId || `OFFLINE-${item.collectedBy || "officer"}-${item.planId}-${Date.now()}`;
      const amount = Number(item.amount) || 0;

      if (!item.planId && !item.planNumber) {
        continue;
      }

      // 1. Anti-Duplicate Check: Is this clientUUID already recorded in Installment or CashLedger?
      const existingInstallment = await Installment.findOne({
        $or: [{ clientUUID }, { receiptId: clientUUID }, { id: clientUUID }],
      });

      if (existingInstallment) {
        duplicateCount++;
        results.push({
          uuid: clientUUID,
          planNumber: item.planNumber || existingInstallment.planNumber,
          status: "ALREADY_SYNCED_SKIPPED",
          amount,
        });
        continue;
      }

      // 2. Fetch Plan
      const plan = await Plan.findOne({
        $or: [{ id: item.planId }, { planNumber: item.planNumber }, { planNumber: item.planId }],
      });

      if (!plan) {
        results.push({
          uuid: clientUUID,
          planNumber: item.planNumber || item.planId,
          status: "PLAN_NOT_FOUND",
          amount,
        });
        continue;
      }

      // 3. Apply payment to next pending/short installment in schedule
      let remainingToApply = amount;
      let targetInstallmentNo = 1;
      let installmentExpected = plan.monthlyInstallment || 500;

      for (const inst of plan.schedule) {
        if (remainingToApply <= 0) break;
        if (inst.status !== "PAID") {
          targetInstallmentNo = inst.installmentNo;
          installmentExpected = inst.totalDue;
          const dueLeft = inst.totalDue - (inst.amountPaid || 0);
          const payThis = Math.min(remainingToApply, dueLeft);
          inst.amountPaid = (inst.amountPaid || 0) + payThis;
          inst.paidDate = item.collectedAt || new Date().toISOString().split("T")[0];
          inst.collectedBy = item.officerName || item.collectedBy || "Field Recovery";
          inst.receiptId = clientUUID;
          inst.clientUUID = clientUUID;

          if (inst.amountPaid >= inst.totalDue) {
            inst.status = "PAID";
          } else {
            inst.status = "SHORT_PAID";
          }
          remainingToApply -= payThis;
        }
      }

      // 4. Recalculate plan arrears and completion status
      const totalPaidSoFar = plan.schedule.reduce((acc, s) => acc + (s.amountPaid || 0), 0);
      const totalExpectedSoFar = plan.schedule
        .filter((s) => new Date(s.dueDate) <= new Date())
        .reduce((acc, s) => acc + s.totalDue, 0);

      plan.accumulatedShortArrears = Math.max(0, totalExpectedSoFar - totalPaidSoFar);

      const allPaid = plan.schedule.length > 0 && plan.schedule.every((s) => s.status === "PAID");
      if (allPaid) {
        plan.status = "COMPLETED";
      }

      await plan.save();

      // 5. Create Installment Record
      const newInstallment = new Installment({
        id: `inst_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenantId: plan.tenantId || "tenant_chiniot",
        businessId: plan.businessId || plan.tenantId || "tenant_chiniot",
        planId: plan.id,
        planNumber: plan.planNumber,
        customerId: plan.customerId,
        customerName: plan.customerName,
        installmentNo: targetInstallmentNo,
        dueDate: new Date().toISOString().split("T")[0],
        expectedAmount: installmentExpected,
        paidAmount: amount,
        shortBalance: Math.max(0, installmentExpected - amount),
        lateFee: 0,
        status: amount >= installmentExpected ? "PAID" : "SHORT",
        paymentMethod: item.paymentMethod || "CASH",
        receivedBy: item.collectedBy || "recovery_officer",
        receivedByName: item.officerName || item.collectedBy || "Field Recovery Officer",
        receiptId: clientUUID,
        clientUUID,
        notes: item.notes || `Offline sync receipt (${item.tempId || clientUUID})`,
        paidDate: item.collectedAt || new Date().toISOString().split("T")[0],
      });
      await newInstallment.save();

      // 6. Create CashLedger Entry (FIELD_IN_TRANSIT)
      const ledgerEntry = new CashLedger({
        id: `csh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenantId: plan.tenantId || "tenant_chiniot",
        businessId: plan.businessId || plan.tenantId || "tenant_chiniot",
        walletType: "FIELD_IN_TRANSIT",
        amount,
        flowType: "IN",
        source: "INSTALLMENT_COLLECTION",
        handoverStatus: "DIRECT_POSTED",
        handledBy: item.collectedBy || "recovery_officer",
        handledByName: item.officerName || item.collectedBy || "Field Officer",
        referenceId: clientUUID,
        planId: plan.id,
        receiptId: clientUUID,
        notes: `Offline synced recovery for ${plan.customerName} (Plan: ${plan.planNumber})`,
      });
      await ledgerEntry.save();

      // Update In-Transit wallet balance in database
      try {
        await db.collection("wallets").updateOne(
          {
            $or: [
              { officerId: item.collectedBy },
              { type: "FIELD_IN_TRANSIT" },
            ],
          },
          { $inc: { balance: amount }, $set: { updatedAt: new Date().toISOString() } }
        );
      } catch (wErr) {
        // Non-blocking wallet balance increment
      }

      syncedCount++;
      totalAmount += amount;
      results.push({
        uuid: clientUUID,
        planNumber: plan.planNumber,
        status: "SYNCED_OK",
        amount,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Tamam offline records MongoDB cloud par sync ho chukay hain. (${syncedCount} synced, ${duplicateCount} duplicates safely rejected)`,
      syncedCount,
      duplicateCount,
      totalAmountSynced: totalAmount,
      results,
    });
  } catch (err: any) {
    console.error("[Recovery Sync Offline] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process offline sync." },
      { status: 500 }
    );
  }
}