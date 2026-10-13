import { NextRequest, NextResponse } from "next/server";
import { connectMongoose, Plan, Customer, Installment } from "@/models";
import { getDatabase } from "@/lib/db/mongodb";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const plan = await Plan.findOne({
      $or: [{ id: params.id }, { planNumber: params.id }],
    }).lean();

    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const body = await req.json();
    const userRole = req.headers.get("x-user-role") || body.userRole || body.user?.role;
    const businessId = req.headers.get("x-user-business-id") || body.businessId || body.user?.businessId || body.user?.tenantId;

    // Strict Owner/SuperAdmin RBAC Protection
    if (userRole !== "OWNER" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Sirf Dukan ke Malik ko Khata edit ya delete karne ki ijazat hai",
        },
        { status: 403 }
      );
    }

    await connectMongoose();

    const plan = await Plan.findOne({
      $or: [{ id: params.id }, { planNumber: params.id }],
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
    }

    // Business isolation check if not SUPER_ADMIN
    if (userRole !== "SUPER_ADMIN" && businessId && plan.tenantId && plan.tenantId !== businessId && plan.businessId !== businessId) {
      return NextResponse.json(
        {
          success: false,
          error: "Sirf Dukan ke Malik ko Khata edit ya delete karne ki ijazat hai",
        },
        { status: 403 }
      );
    }

    const { planUpdates = {}, customerUpdates = {} } = body;

    // 1. Update Plan Fields
    if (planUpdates.khataNumber !== undefined) plan.khataNumber = String(planUpdates.khataNumber);
    if (planUpdates.customerName) plan.customerName = planUpdates.customerName;
    if (planUpdates.customerPhone) plan.customerPhone = planUpdates.customerPhone;
    if (planUpdates.customerCnic) plan.customerCnic = planUpdates.customerCnic;
    if (planUpdates.productTitle) plan.productTitle = planUpdates.productTitle;
    if (planUpdates.imeiSerial !== undefined) plan.imeiSerial = planUpdates.imeiSerial;
    if (planUpdates.cashPrice !== undefined) plan.cashPrice = Number(planUpdates.cashPrice);
    if (planUpdates.downPayment !== undefined) plan.downPayment = Number(planUpdates.downPayment);
    if (planUpdates.totalFinanced !== undefined) plan.totalFinanced = Number(planUpdates.totalFinanced);
    if (planUpdates.monthlyInstallment !== undefined) plan.monthlyInstallment = Number(planUpdates.monthlyInstallment);
    if (planUpdates.areaZone) plan.areaZone = planUpdates.areaZone;
    if (planUpdates.salesmanName) plan.salesmanName = planUpdates.salesmanName;
    if (planUpdates.status) plan.status = planUpdates.status;
    if (planUpdates.schedule && Array.isArray(planUpdates.schedule)) {
      plan.schedule = planUpdates.schedule;
    }

    // Recalculate remaining balance and completion
    const totalPaid = (plan.downPayment || 0) +
      (plan.schedule || []).reduce((acc: number, s: any) => acc + (s.amountPaid || 0), 0) +
      (plan.discountWaived || 0);
    const remainingBalance = Math.max(0, (plan.totalFinanced || 0) - totalPaid);

    if (remainingBalance === 0) {
      plan.status = plan.discountWaived && plan.discountWaived > 0 ? "CLOSED_WITH_DISCOUNT" : "COMPLETED";
      plan.accumulatedShortArrears = 0;
      plan.schedule.forEach((s: any) => {
        if (s.status !== "PAID") {
          s.status = "PAID";
          s.notes = s.notes ? `${s.notes} • Settle` : "Settled";
        }
      });
    }

    await plan.save();

    // Also mirror to 'plans' collection directly for backwards compatibility
    try {
      const db = await getDatabase();
      await db.collection("plans").replaceOne({ id: plan.id }, plan.toObject(), { upsert: true });
    } catch (e) {}

    // 2. Update Customer Fields if provided
    if (plan.customerId && Object.keys(customerUpdates).length > 0) {
      const customer = await Customer.findOne({ id: plan.customerId });
      if (customer) {
        if (customerUpdates.fullName) customer.fullName = customerUpdates.fullName;
        if (customerUpdates.fatherName) customer.fatherName = customerUpdates.fatherName;
        if (customerUpdates.phone) customer.phone = customerUpdates.phone;
        if (customerUpdates.cnic) customer.cnic = customerUpdates.cnic;
        if (customerUpdates.address) customer.address = customerUpdates.address;
        if (customerUpdates.zoneArea) customer.zoneArea = customerUpdates.zoneArea;
        await customer.save();

        try {
          const db = await getDatabase();
          await db.collection("customers").replaceOne({ id: customer.id }, customer.toObject(), { upsert: true });
        } catch (e) {}
      }
    }

    return NextResponse.json({
      success: true,
      message: `Khata #${plan.khataNumber || plan.planNumber} kamyabi se update ho gaya hai.`,
      plan,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const url = new URL(req.url);
    const userRole = req.headers.get("x-user-role") || url.searchParams.get("role");
    const businessId = req.headers.get("x-user-business-id") || url.searchParams.get("businessId");

    // Strict Owner/SuperAdmin RBAC Protection
    if (userRole !== "OWNER" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Sirf Dukan ke Malik ko Khata edit ya delete karne ki ijazat hai",
        },
        { status: 403 }
      );
    }

    await connectMongoose();

    const plan = await Plan.findOne({
      $or: [{ id: params.id }, { planNumber: params.id }],
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
    }

    // Business isolation check if not SUPER_ADMIN
    if (userRole !== "SUPER_ADMIN" && businessId && plan.tenantId && plan.tenantId !== businessId && plan.businessId !== businessId) {
      return NextResponse.json(
        {
          success: false,
          error: "Sirf Dukan ke Malik ko Khata edit ya delete karne ki ijazat hai",
        },
        { status: 403 }
      );
    }

    const planId = plan.id;

    // Delete plan from installment_plans and plans
    await Plan.deleteOne({ id: planId });
    try {
      const db = await getDatabase();
      await db.collection("plans").deleteOne({ id: planId });
      await db.collection("installments").deleteMany({ planId });
    } catch (e) {}

    // Delete installments
    await Installment.deleteMany({ planId });

    return NextResponse.json({
      success: true,
      message: `Khata #${plan.khataNumber || plan.planNumber} kamyabi se delete ho chuka hai.`,
      deletedPlanId: planId,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
