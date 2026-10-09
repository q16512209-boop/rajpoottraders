import { connectMongoose } from "./mongoose";
import { Business } from "@/models/Business";
import { UserModel } from "@/models/User";
import { Customer } from "@/models/Customer";
import { Plan } from "@/models/Plan";
import { Installment } from "@/models/Installment";
import { CashLedger } from "@/models/CashLedger";
import {
  initialTenants,
  initialUsers,
  initialCustomers,
  initialPlans,
  initialWallets,
} from "./seed";

export async function seedChiniotLedgerToMongo() {
  console.log("==================================================");
  console.log("🚀 Starting Chiniot Ledger Ingestion to MongoDB Atlas");
  console.log("==================================================");

  await connectMongoose();

  // 1. Business / Tenant Upsert
  for (const tenant of initialTenants) {
    await Business.findOneAndUpdate(
      { id: tenant.id },
      {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug || tenant.code.toLowerCase(),
        ownerName: tenant.ownerName,
        phone: tenant.contact,
        city: tenant.city || "Chiniot",
        address: tenant.address,
        customHeader: tenant.brandHeader,
        status: tenant.status === "ACTIVE" ? "ACTIVE" : "SUSPENDED",
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✓ Seeded ${initialTenants.length} Business Tenant records.`);

  // 2. Users Upsert
  for (const user of initialUsers) {
    await UserModel.findOneAndUpdate(
      { email: user.email.toLowerCase() },
      {
        id: user.id,
        tenantId: user.tenantId,
        businessId: user.businessId || user.tenantId,
        name: user.name,
        email: user.email.toLowerCase(),
        password: user.password,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar || "",
        assignedRouteZone: user.assignedRouteZone || "",
        status: user.status,
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✓ Seeded ${initialUsers.length} Authorized Users.`);

  // 3. Ingest All 118 Verified Real Customers
  for (const cust of initialCustomers) {
    await Customer.findOneAndUpdate(
      { id: cust.id },
      {
        id: cust.id,
        tenantId: cust.tenantId,
        businessId: cust.businessId || cust.tenantId,
        fullName: cust.fullName,
        fatherName: cust.fatherName,
        cnic: cust.cnic,
        phone: cust.phone,
        address: cust.address,
        landmark: cust.landmark || "",
        city: cust.city || "Chiniot",
        zoneArea: cust.zoneArea,
        guarantors: cust.guarantors || [],
        riskScore: cust.riskScore || 30,
        isDefaulter: cust.isDefaulter || false,
        status: "ACTIVE",
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✓ Seeded ${initialCustomers.length} Customer Accounts.`);

  // 4. Ingest All 118 Verified Real Plans & Installment Records
  let totalInstallmentsCount = 0;

  for (const plan of initialPlans) {
    const savedPlan = await Plan.findOneAndUpdate(
      { id: plan.id },
      {
        id: plan.id,
        planNumber: plan.planNumber,
        khataNumber: plan.khataNumber,
        tenantId: plan.tenantId,
        businessId: plan.businessId || plan.tenantId,
        customerId: plan.customerId,
        customerName: plan.customerName,
        customerCnic: plan.customerCnic,
        customerPhone: plan.customerPhone,
        salesmanName: plan.salesmanName,
        salesmanId: plan.salesmanId,
        productId: plan.productId,
        productTitle: plan.productTitle,
        imeiSerial: plan.imeiSerial,
        cashPrice: plan.cashPrice,
        downPayment: plan.downPayment,
        markupRatePct: plan.markupRatePct,
        totalMarkup: plan.totalMarkup,
        totalFinanced: plan.totalFinanced,
        durationMonths: plan.durationMonths,
        installmentFrequency: plan.installmentFrequency,
        collectionIntervalDays: plan.collectionIntervalDays,
        collectionDayName: plan.collectionDayName,
        monthlyInstallment: plan.monthlyInstallment,
        accumulatedShortArrears: plan.accumulatedShortArrears,
        status: plan.status,
        startDate: plan.startDate,
        endDate: plan.endDate,
        schedule: plan.schedule,
        guarantorIds: plan.guarantorIds,
        recoveryOfficerId: plan.recoveryOfficerId,
        areaZone: plan.areaZone,
        contractVerified: plan.contractVerified,
      },
      { upsert: true, new: true }
    );

    // Save individual Installment records
    if (Array.isArray(plan.schedule)) {
      for (const item of plan.schedule) {
        totalInstallmentsCount++;
        await Installment.findOneAndUpdate(
          {
            planId: plan.id,
            installmentNo: item.installmentNo,
          },
          {
            id: `inst_${plan.id}_${item.installmentNo}`,
            tenantId: plan.tenantId,
            businessId: plan.businessId || plan.tenantId,
            planId: plan.id,
            installmentNo: item.installmentNo,
            dueDate: item.dueDate,
            expectedAmount: item.totalDue,
            paidAmount: item.amountPaid,
            shortBalance: item.shortArrears,
            status: item.status,
            paidDate: item.paidDate ? new Date(item.paidDate) : undefined,
            receiptId: item.receiptId,
            receivedBy: item.collectedBy,
            notes: item.notes,
          },
          { upsert: true, new: true }
        );
      }
    }
  }
  console.log(`✓ Seeded ${initialPlans.length} Master Khata Plans & ${totalInstallmentsCount} Installments.`);

  // 5. Aggregate Live Verification Audit Check from MongoDB
  const totalDbCustomers = await Customer.countDocuments({ tenantId: "tenant_chiniot" });
  const totalDbPlans = await Plan.countDocuments({ tenantId: "tenant_chiniot" });
  const activePlans = await Plan.countDocuments({ tenantId: "tenant_chiniot", status: "ACTIVE" });
  const completedPlans = await Plan.countDocuments({
    tenantId: "tenant_chiniot",
    status: { $in: ["COMPLETED", "COMPLETED_EARLY_SETTLED"] },
  });
  const repossessedPlans = await Plan.countDocuments({
    tenantId: "tenant_chiniot",
    status: { $in: ["DEFAULTED_REPOSSESSED", "WRITTEN_OFF", "DEFAULTED"] },
  });

  const allDbPlans = await Plan.find({ tenantId: "tenant_chiniot" });
  let dbTotalFinanced = 0;
  let dbTotalRecovered = 0;

  allDbPlans.forEach((p) => {
    dbTotalFinanced += p.totalFinanced || 0;
    const paidInSchedule = (p.schedule || []).reduce((sum, s) => sum + (s.amountPaid || 0), 0);
    dbTotalRecovered += paidInSchedule + (p.downPayment || 0);
  });

  const dbOutstanding = Math.max(0, dbTotalFinanced - dbTotalRecovered);
  const dbRecoveryRate = dbTotalFinanced > 0 ? ((dbTotalRecovered / dbTotalFinanced) * 100).toFixed(1) : "0";

  console.log("\n==================================================");
  console.log("📊 CHINIOT MASTER LEDGER LIVE AUDIT CONSTANTS");
  console.log("==================================================");
  console.log(`Total Customers in Atlas: ${totalDbCustomers} (Expected: 118)`);
  console.log(`Total Khatas in Atlas:    ${totalDbPlans} (Expected: 118)`);
  console.log(`- Active Khatas:         ${activePlans} (Expected: 99)`);
  console.log(`- Fully Paid Khatas:     ${completedPlans} (Expected: 10)`);
  console.log(`- Returned / Wapsi:      ${repossessedPlans} (Expected: 9)`);
  console.log(`Total Portfolio Value:   Rs. ${dbTotalFinanced.toLocaleString()} (Expected: Rs. 824,400)`);
  console.log(`Total Recovered to Date: Rs. ${dbTotalRecovered.toLocaleString()} (Expected: Rs. 386,900)`);
  console.log(`Total Outstanding (Net): Rs. ${dbOutstanding.toLocaleString()} (Expected: Rs. 437,500)`);
  console.log(`Overall Recovery Rate:   ${dbRecoveryRate}% (Expected: 46.9%)`);
  console.log("==================================================\n");

  return {
    success: true,
    totalDbCustomers,
    totalDbPlans,
    activePlans,
    completedPlans,
    repossessedPlans,
    dbTotalFinanced,
    dbTotalRecovered,
    dbOutstanding,
    dbRecoveryRate,
  };
}

// Direct Execution Support
if (require.main === module) {
  seedChiniotLedgerToMongo()
    .then(() => {
      console.log("✓ Chiniot Master Ledger successfully seeded to MongoDB Atlas!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("✗ Failed to seed Chiniot ledger:", err);
      process.exit(1);
    });
}
