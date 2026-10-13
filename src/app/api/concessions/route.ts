import { NextRequest, NextResponse } from "next/server";
import { connectMongoose, ConcessionRequest, Plan } from "@/models";
import { getDatabase } from "@/lib/db/mongodb";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenantId") || "tenant_chiniot";
    const status = url.searchParams.get("status");

    await connectMongoose();

    const query: any = {
      $or: [{ tenantId }, { businessId: tenantId }],
    };
    if (status && status !== "ALL") {
      query.status = status;
    }

    const requests = await ConcessionRequest.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, requests });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "CREATE";

    await connectMongoose();
    const db = await getDatabase();

    // 1. Create Concession Request (Field Recovery Officer)
    if (action === "CREATE") {
      const {
        planId,
        khataNumber,
        customerId,
        customerName,
        customerPhone,
        totalPrice,
        totalPaid,
        remainingBalance,
        discountAmount,
        reason,
        requestedBy,
        requestedById,
        officerRole,
        tenantId,
        businessId,
      } = body;

      if (!planId || !discountAmount || !reason) {
        return NextResponse.json(
          { success: false, error: "Plan ID, Discount Amount, aur Waja darkar hain." },
          { status: 400 }
        );
      }

      const reqId = `conc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newRequest = new ConcessionRequest({
        id: reqId,
        tenantId: tenantId || "tenant_chiniot",
        businessId: businessId || tenantId || "tenant_chiniot",
        planId,
        khataNumber: khataNumber || "",
        customerId: customerId || "",
        customerName: customerName || "Customer",
        customerPhone: customerPhone || "",
        totalPrice: Number(totalPrice) || 0,
        totalPaid: Number(totalPaid) || 0,
        remainingBalance: Number(remainingBalance) || 0,
        discountAmount: Number(discountAmount),
        reason: reason.trim(),
        requestedBy: requestedBy || "Field Recovery Officer",
        requestedById: requestedById || "",
        officerRole: officerRole || "FIELD_RECOVERY",
        status: "PENDING_APPROVAL",
      });

      await newRequest.save();

      // Mirror to database directly
      try {
        await db.collection("concession_requests").replaceOne({ id: reqId }, newRequest.toObject(), { upsert: true });
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: "معافی / رعایت کی درخواست مالک کو منظوری کے لیے بھیج دی گئی ہے۔",
        request: newRequest,
      });
    }

    // 2. Owner Approve Concession
    if (action === "APPROVE") {
      const userRole = req.headers.get("x-user-role") || body.userRole || body.user?.role;
      if (userRole !== "OWNER" && userRole !== "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, error: "Sirf Dukan ke Malik ko Khata ya Riayat approve karne ki ijazat hai." },
          { status: 403 }
        );
      }

      const { requestId, reviewerName, reviewerId } = body;
      const request = await ConcessionRequest.findOne({ id: requestId });
      if (!request) {
        return NextResponse.json({ success: false, error: "Concession request not found." }, { status: 404 });
      }

      if (request.status !== "PENDING_APPROVAL") {
        return NextResponse.json(
          { success: false, error: `Yeh darkhwast pehle se hi ${request.status} hai.` },
          { status: 400 }
        );
      }

      // Update Request
      request.status = "APPROVED";
      request.reviewedBy = reviewerName || "Shop Owner";
      request.reviewedById = reviewerId || "";
      request.reviewedAt = new Date().toISOString();
      await request.save();

      // Update Plan:
      // STRICT AUDIT TRUTH:
      // totalPrice: unperturbed (e.g. Rs. 6,800)
      // totalCollected: unperturbed (actual cash received Rs. 6,300, NEVER falsely inflated)
      // discountWaived: Rs. 500 (recorded transparently under concessions)
      // remainingBalance: Rs. 0
      // Till / CashLedger: NEVER receives fake money!
      const plan = await Plan.findOne({
        $or: [{ id: request.planId }, { planNumber: request.planId }],
      });

      if (plan) {
        plan.status = "CLOSED_WITH_DISCOUNT";
        plan.discountWaived = (plan.discountWaived || 0) + request.discountAmount;
        plan.concessionReason = request.reason;
        plan.accumulatedShortArrears = 0;

        // Mark remaining unpaid schedule rows as settled
        if (Array.isArray(plan.schedule)) {
          plan.schedule.forEach((item: any) => {
            if (item.status !== "PAID") {
              item.status = "PAID";
              item.notes = item.notes
                ? `${item.notes} • Waived by Owner concession (Rs. ${request.discountAmount})`
                : `Waived by Owner concession (Rs. ${request.discountAmount}) - Khata Closed`;
            }
          });
        }

        await plan.save();

        try {
          await db.collection("plans").replaceOne({ id: plan.id }, plan.toObject(), { upsert: true });
          await db.collection("installment_plans").replaceOne({ id: plan.id }, plan.toObject(), { upsert: true });
        } catch (e) {}
      }

      try {
        await db.collection("concession_requests").replaceOne({ id: request.id }, request.toObject(), { upsert: true });
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: "Concession Approved - Khata Closed",
        request,
        plan,
      });
    }

    // 3. Owner Reject Concession
    if (action === "REJECT") {
      const userRole = req.headers.get("x-user-role") || body.userRole || body.user?.role;
      if (userRole !== "OWNER" && userRole !== "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, error: "Sirf Dukan ke Malik ko Khata ya Riayat reject karne ki ijazat hai." },
          { status: 403 }
        );
      }

      const { requestId, reviewerName, reviewerId, rejectionReason } = body;
      const request = await ConcessionRequest.findOne({ id: requestId });
      if (!request) {
        return NextResponse.json({ success: false, error: "Concession request not found." }, { status: 404 });
      }

      request.status = "REJECTED";
      request.reviewedBy = reviewerName || "Shop Owner";
      request.reviewedById = reviewerId || "";
      request.reviewedAt = new Date().toISOString();
      request.rejectionReason = rejectionReason || "Owner ne riayat ki darkhwast mustarid kardi.";
      await request.save();

      try {
        await db.collection("concession_requests").replaceOne({ id: request.id }, request.toObject(), { upsert: true });
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: "Concession Request Rejected",
        request,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
