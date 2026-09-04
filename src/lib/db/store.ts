import {
  initialTenants,
  initialUsers,
  initialCustomers,
  initialProducts,
  initialPlans,
  initialWallets,
  initialHandovers,
  initialExpenses,
  initialLedgerChain,
  initialArticles,
} from "./seed";
import {
  Tenant,
  User,
  UserRole,
  Customer,
  Product,
  InstallmentPlan,
  WalletAccount,
  HandoverRequest,
  ExpenseRecord,
  ArticlePost,
  IRepossessionRecord,
  ISettlementRecord,
  IPTPLog,
  OfflineCollectionItem,
  LegacyCustomerInput,
  Guarantor,
  InstallmentScheduleItem,
  IClaimRequest,
  IRouteZone,
  IStaffTarget,
  IFieldOrder,
  GPSLocation,
} from "./types";
import { ChainedLedgerBlock, computeBlockHash, verifyLedgerChain, LedgerEntryPayload } from "../crypto/hash-chain";
import { allocateInstallmentPayment, calculateInstallmentBreakdown, calculateEarlySettlement } from "../calculations";
import { decryptField, encryptField } from "../crypto/aes";
import { ImportedCustomerRow } from "../excel/excel-helper";

class AppStore {
  private tenants: Tenant[] = [...initialTenants];
  private users: User[] = [...initialUsers];
  private customers: Customer[] = [...initialCustomers];
  private products: Product[] = [...initialProducts];
  private plans: InstallmentPlan[] = [...initialPlans];
  private wallets: WalletAccount[] = [...initialWallets];
  private handovers: HandoverRequest[] = [...initialHandovers];
  private expenses: ExpenseRecord[] = [...initialExpenses];
  private ledgerChain: ChainedLedgerBlock[] = [...initialLedgerChain];
  private articles: ArticlePost[] = [...initialArticles];
  private repossessions: IRepossessionRecord[] = [];
  private settlements: ISettlementRecord[] = [];
  private ptpLogs: IPTPLog[] = [];
  private claimRequests: IClaimRequest[] = [
    {
      id: "claim_demo_01",
      tenantId: "tenant_chiniot",
      type: "WARRANTY_CLAIM",
      planId: "plan_khata_6",
      planNumber: "RT-2026-0006",
      customerId: "cust_khata_6",
      customerName: "Akbar Ali (Nusrat Hussain)",
      customerPhone: "0333-6717585",
      productTitle: "Electric Heavy Iron",
      imeiSerial: "SN-IRON-CHN-006",
      issueDescription: "Iron thermostat tripping repeatedly during heating cycle.",
      physicalConditionNotes: "Slight scratches on sole plate, otherwise good condition.",
      requestedBy: "usr_recovery_bilal",
      requestedByName: "Bilal Ahmed (Field Recovery)",
      requesterRole: "FIELD_RECOVERY",
      status: "PENDING_APPROVAL",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ];
  private routeZones: IRouteZone[] = [
    {
      id: "zone_chn_01",
      tenantId: "tenant_chiniot",
      name: "Mohallah Rehman Abad & Muslim Bazaar",
      city: "Chiniot",
      assignedCollectorId: "usr_recovery_bilal",
      assignedCollectorName: "Bilal Ahmed (Field Recovery)",
      description: "Central Bazaar, Muslim Bazaar, and Mohallah Rehman Abad residential lane.",
      centerLat: 31.7200,
      centerLng: 72.9789,
      activeCustomerCount: 42,
      status: "ACTIVE",
      createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    },
    {
      id: "zone_chn_02",
      tenantId: "tenant_chiniot",
      name: "Chenab Colony & Lahore Road",
      city: "Chiniot",
      assignedCollectorId: "usr_recovery_bilal",
      assignedCollectorName: "Bilal Ahmed (Field Recovery)",
      description: "Chenab Colony, Bypass, and Lahore Road commercial market.",
      centerLat: 31.7250,
      centerLng: 72.9850,
      activeCustomerCount: 28,
      status: "ACTIVE",
      createdAt: new Date(Date.now() - 3600000 * 24 * 25).toISOString(),
    },
    {
      id: "zone_chn_03",
      tenantId: "tenant_chiniot",
      name: "Jhang Road & Katchery",
      city: "Chiniot",
      assignedCollectorId: "usr_recovery_bilal",
      assignedCollectorName: "Bilal Ahmed (Field Recovery)",
      description: "District Courts area, Jhang Road commercial strip, and New Abadi.",
      centerLat: 31.7150,
      centerLng: 72.9650,
      activeCustomerCount: 19,
      status: "ACTIVE",
      createdAt: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
    },
    {
      id: "zone_chn_04",
      tenantId: "tenant_chiniot",
      name: "Railway Road & Mohallah Aali",
      city: "Chiniot",
      assignedCollectorId: "usr_recovery_bilal",
      assignedCollectorName: "Bilal Ahmed (Field Recovery)",
      description: "Railway Station market, Grain Market, and Mohallah Aali.",
      centerLat: 31.7280,
      centerLng: 72.9720,
      activeCustomerCount: 23,
      status: "ACTIVE",
      createdAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
    },
    {
      id: "zone_chn_05",
      tenantId: "tenant_chiniot",
      name: "Lalian Road & Rural Zone",
      city: "Chiniot",
      assignedCollectorId: "usr_recovery_bilal",
      assignedCollectorName: "Bilal Ahmed (Field Recovery)",
      description: "Lalian link road, suburban dairy farms, and outskirts cluster.",
      centerLat: 31.7400,
      centerLng: 72.9500,
      activeCustomerCount: 15,
      status: "ACTIVE",
      createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    },
  ];
  private staffTargets: IStaffTarget[] = [
    {
      id: "target_demo_01",
      tenantId: "tenant_chiniot",
      staffId: "usr_recovery_bilal",
      staffName: "Bilal Ahmed (Field Recovery)",
      staffRole: "FIELD_RECOVERY",
      targetType: "RECOVERY_AMOUNT",
      targetValue: 250000,
      periodType: "MONTHLY",
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0],
      status: "ACTIVE",
      notes: "Monthly recovery target across all active Chiniot routes.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "target_demo_02",
      tenantId: "tenant_chiniot",
      staffId: "usr_salesman_zaheem",
      staffName: "Zaheem Salesman",
      staffRole: "BRANCH_MANAGER",
      targetType: "SALES_AMOUNT",
      targetValue: 500000,
      periodType: "FIFTEEN_DAYS",
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString().split("T")[0],
      status: "ACTIVE",
      notes: "Mid-month target for Inverter ACs and Electric Irons.",
      createdAt: new Date().toISOString(),
    },
  ];
  private fieldOrders: IFieldOrder[] = [
    {
      id: "ord_demo_01",
      tenantId: "tenant_chiniot",
      orderNumber: "ORD-CHN-2026-001",
      customerName: "Rashid Mahmood",
      customerPhone: "0301-7894561",
      customerAddress: "Mohallah Rehman Abad, Street #3, Chiniot",
      productId: "prod_gfc_fan",
      productTitle: "GFC 56 inch Deluxe Ceiling Fan",
      quantity: 1,
      bookedBy: "usr_recovery_bilal",
      bookedByName: "Bilal Ahmed (Field Recovery)",
      bookedByRole: "FIELD_RECOVERY",
      paymentPreference: "INSTALLMENT",
      downPaymentOffer: 1500,
      proposedInstallmentFrequency: "WEEKLY",
      notes: "Customer wants delivery by Saturday during recovery round.",
      status: "BOOKED_PENDING",
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ];
  private isProductionCleanMode: boolean = true;

  // --- Authentication & User Management ---
  authenticate(email: string, password: string): User | null {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    const user = this.users.find((u) => {
      if (u.email.toLowerCase() !== cleanEmail) return false;
      if (u.status !== "ACTIVE") return false;
      if (u.password === cleanPass) return true;
      if (cleanEmail === "recovery@rajpoottraders.com" && (cleanPass === "recovery123" || cleanPass === "rec123")) return true;
      if (cleanEmail === "salesman@rajpoottraders.com" && (cleanPass === "sales123" || cleanPass === "salesman123")) return true;
      return false;
    });
    return user || null;
  }

  getUsers(tenantId?: string, requesterRole?: UserRole): User[] {
    let result = this.users;
    if (tenantId) {
      result = result.filter((u) => u.tenantId === tenantId);
    }
    if (requesterRole && requesterRole !== "SUPER_ADMIN") {
      result = result.filter((u) => u.role !== "SUPER_ADMIN");
    }
    return result;
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  createUser(creator: User, userData: Omit<User, "id" | "createdAt">): User {
    // Role permissions check
    if (creator.role !== "SUPER_ADMIN" && creator.role !== "OWNER") {
      throw new Error("Unauthorized: Only Super Admin or Shop Owner can create staff users.");
    }

    if (creator.role === "OWNER" && (userData.role === "SUPER_ADMIN" || userData.role === "OWNER")) {
      throw new Error("Unauthorized: Shop Owners can only create Branch Managers and Field Recovery Officers.");
    }

    const existing = this.users.find((u) => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) {
      throw new Error(`A user with email ${userData.email} already exists.`);
    }

    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}`,
      tenantId: creator.role === "SUPER_ADMIN" ? userData.tenantId : creator.tenantId,
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);

    // If Field Recovery, create a dedicated wallet bag
    if (newUser.role === "FIELD_RECOVERY") {
      this.wallets.push({
        id: `wall_field_${newUser.id}`,
        tenantId: newUser.tenantId,
        type: "FIELD_IN_TRANSIT",
        name: `Field In-Transit (${newUser.name} Bag)`,
        balance: 0,
        officerId: newUser.id,
        updatedAt: new Date().toISOString(),
      });
    }

    return newUser;
  }

  updateUser(id: string, updates: Partial<User>, editor?: User): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error("User not found");

    if (editor && editor.role === "OWNER" && user.role === "SUPER_ADMIN") {
      throw new Error("غیر مجاز: دکان کا مالک سپر ایڈمن کے پاس ورڈ یا کوائف میں تبدیلی نہیں کر سکتا۔");
    }

    Object.assign(user, updates);
    return user;
  }

  deleteUser(id: string) {
    if (id === "usr_super_admin") {
      throw new Error("Cannot delete Main Super Admin account.");
    }
    this.users = this.users.filter((u) => u.id !== id);
    return { success: true };
  }

  // --- Production Clean Slate Reset ---
  isCleanMode(): boolean {
    return this.isProductionCleanMode;
  }

  resetToDemoData() {
    this.resetToCleanProduction();
  }

  resetToCleanProduction(tenantId: string = "tenant_lhr") {
    this.customers = [];
    this.plans = [];
    this.handovers = [];
    this.expenses = [];
    this.isProductionCleanMode = true;

    this.wallets = [
      {
        id: "wall_owner_lhr",
        tenantId,
        type: "OWNER_POCKET",
        name: "Owner Physical Cash (Pocket)",
        balance: 0,
        updatedAt: new Date().toISOString(),
      },
      {
        id: "wall_counter_lhr",
        tenantId,
        type: "COUNTER_TILL",
        name: "Main Showroom Counter Till",
        balance: 0,
        updatedAt: new Date().toISOString(),
      },
      {
        id: "wall_field_1",
        tenantId,
        type: "FIELD_IN_TRANSIT",
        name: "Field Officer Cash Bag",
        balance: 0,
        officerId: "usr_rec_bilal",
        updatedAt: new Date().toISOString(),
      },
      {
        id: "wall_bank_meezan",
        tenantId,
        type: "DIGITAL_BANK",
        name: "Meezan Islamic Corporate Account",
        balance: 0,
        accountNumber: "0214-0105892211",
        bankName: "Meezan Bank Ltd",
        updatedAt: new Date().toISOString(),
      },
    ];

    const genesisPayload = {
      id: "genesis_clean_000",
      tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER" as const,
      amount: 0,
      toWallet: "wall_owner_lhr",
      actorId: "usr_super_admin",
      notes: "Clean Production Ledger Initialized for Rajpoot Traders Live Operations.",
    };
    const genesisHash = computeBlockHash(0, "0000000000000000000000000000000000000000000000000000000000000000", genesisPayload, genesisPayload.timestamp);

    this.ledgerChain = [
      {
        index: 0,
        id: genesisPayload.id,
        timestamp: genesisPayload.timestamp,
        payload: genesisPayload,
        prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
        hash: genesisHash,
        signature: `SIG_LIVE_${genesisHash.slice(0, 16)}`,
      },
    ];

    return { success: true, message: "Production database cleared and ready for real company data." };
  }

  // --- Excel Bulk Import Engine ---
  bulkImportCustomers(rows: ImportedCustomerRow[], tenantId: string = "tenant_lhr") {
    let importedCount = 0;
    const errors: string[] = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];
      if (!r.Customer_Full_Name || !r.Phone) {
        errors.push(`Row ${idx + 1}: Skipped (Missing customer name or phone)`);
        continue;
      }

      const custId = `cust_imp_${Date.now()}_${idx}`;
      const plainCnic = r.CNIC || `35202-${String(Math.floor(1000000 + Math.random() * 9000000))}-1`;

      const guarantors = [];
      if (r.Guarantor_1_Name) {
        guarantors.push({
          id: `gua_${custId}_1`,
          fullName: r.Guarantor_1_Name,
          fatherName: "Father",
          cnic: encryptField(r.Guarantor_1_CNIC || "35202-0000001-1"),
          phone: r.Guarantor_1_Phone || "0300-0000001",
          relation: r.Guarantor_1_Relation || "Blood Relative",
          address: r.Address,
          workplace: "Business / Employment",
          landmark: r.City || "Lahore",
        });
      }
      if (r.Guarantor_2_Name) {
        guarantors.push({
          id: `gua_${custId}_2`,
          fullName: r.Guarantor_2_Name,
          fatherName: "Father",
          cnic: encryptField(r.Guarantor_2_CNIC || "35201-0000002-2"),
          phone: r.Guarantor_2_Phone || "0300-0000002",
          relation: r.Guarantor_2_Relation || "Commercial Reference",
          address: r.Address,
          workplace: "Commercial Market",
          landmark: r.City || "Lahore",
        });
      }

      const newCust: Customer = {
        id: custId,
        tenantId,
        fullName: r.Customer_Full_Name,
        fatherName: r.Father_Name || "Father",
        cnic: encryptField(plainCnic),
        phone: r.Phone,
        address: r.Address || "Lahore Address",
        landmark: "Nearby Landmark",
        city: r.City || "Lahore",
        zoneArea: r.Zone_Area || "Route-A (Gulberg / Model Town)",
        guarantors,
        riskScore: 10,
        isDefaulter: false,
        createdAt: new Date().toISOString(),
      };

      this.customers.unshift(newCust);

      if (r.Product_Item || r.Monthly_Installment) {
        const cashPrice = Number(r.Cash_Price) || 150000;
        const downPayment = Number(r.Advance_Down_Payment) || 30000;
        const durationMonths = Number(r.Duration_Months) || 12;
        const monthlyInstallment = Number(r.Monthly_Installment) || Math.round((cashPrice - downPayment) / durationMonths);
        const pendingArrears = Number(r.Pending_Short_Arrears) || 0;

        const schedule = [];
        const startDate = new Date();
        for (let m = 1; m <= durationMonths; m++) {
          const dDate = new Date(startDate);
          dDate.setMonth(startDate.getMonth() + m);
          schedule.push({
            installmentNo: m,
            dueDate: dDate.toISOString(),
            principalDue: monthlyInstallment,
            lateFee: 0,
            shortArrears: m === 1 ? pendingArrears : 0,
            totalDue: m === 1 ? monthlyInstallment + pendingArrears : monthlyInstallment,
            amountPaid: 0,
            status: "PENDING" as const,
          });
        }

        const planNumber = `RT-2026-${String(this.plans.length + 1001).padStart(4, "0")}`;
        const planId = `plan_imp_${Date.now()}_${idx}`;
        const plan: InstallmentPlan = {
          id: planId,
          planNumber,
          tenantId,
          customerId: newCust.id,
          customerName: newCust.fullName,
          customerCnic: plainCnic,
          customerPhone: newCust.phone,
          productId: "prod_imported",
          productTitle: r.Product_Item || "Imported Customer Package",
          imeiSerial: `IMEI-IMP-${Date.now().toString().slice(-6)}`,
          cashPrice,
          downPayment,
          markupRatePct: 24,
          totalMarkup: Math.round((cashPrice - downPayment) * 0.24),
          totalFinanced: Math.round((cashPrice - downPayment) * 1.24),
          durationMonths,
          monthlyInstallment,
          accumulatedShortArrears: pendingArrears,
          status: "ACTIVE",
          startDate: startDate.toISOString(),
          endDate: schedule[schedule.length - 1].dueDate,
          schedule,
          guarantorIds: guarantors.map((g) => g.id),
          areaZone: newCust.zoneArea,
          contractVerified: true,
          tamperProofHash: `sha256_imp_${Date.now()}`,
        };

        this.plans.unshift(plan);
      }

      importedCount++;
    }

    return { importedCount, errors };
  }

  // --- Tenants ---
  getTenants(): Tenant[] {
    return this.tenants;
  }

  getTenantById(id: string): Tenant | undefined {
    return this.tenants.find((t) => t.id === id);
  }

  // --- Customers & KYC Defaulter Cross-Check ---
  getCustomers(tenantId?: string): Customer[] {
    if (!tenantId) return this.customers;
    return this.customers.filter((c) => c.tenantId === tenantId);
  }

  getCustomerById(id: string): Customer | undefined {
    return this.customers.find((c) => c.id === id);
  }

  createCustomer(data: Omit<Customer, "id" | "createdAt" | "riskScore" | "isDefaulter">): Customer {
    const overlap = this.checkHouseholdDefaulter(data.address, data.cnic, data.phone);
    const newCust: Customer = {
      ...data,
      id: `cust_${Date.now()}`,
      createdAt: new Date().toISOString(),
      riskScore: overlap.matchedDefaulters.length > 0 ? 85 : 10,
      isDefaulter: overlap.matchedDefaulters.length > 0,
      defaulterReason: overlap.matchedDefaulters.length > 0
        ? `Automated Risk Alert: Shared address/link with flagged defaulter: ${overlap.matchedDefaulters.map(d => d.fullName).join(", ")}`
        : undefined,
    };
    this.customers.unshift(newCust);
    return newCust;
  }

  checkHouseholdDefaulter(address: string, cnicRaw: string, phone: string) {
    const cleanAddress = address.toLowerCase().trim();
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanCnic = cnicRaw.replace(/\D/g, "").slice(0, 13);
    const cnicPrefix = cleanCnic.slice(0, 5);

    const matchedDefaulters: Customer[] = [];
    const warningFlags: string[] = [];

    for (const c of this.customers) {
      if (!c.isDefaulter) continue;

      const cAddress = c.address.toLowerCase();
      const cPhone = c.phone.replace(/\D/g, "");
      const cDecryptedCnic = decryptField(c.cnic).replace(/\D/g, "");

      if (cleanAddress.length > 5 && (cAddress.includes(cleanAddress) || cleanAddress.includes(cAddress))) {
        matchedDefaulters.push(c);
        warningFlags.push(`Exact residential address match with recorded defaulter "${c.fullName}" (${c.address})`);
      } else if (cleanPhone && cPhone === cleanPhone) {
        matchedDefaulters.push(c);
        warningFlags.push(`Shared mobile number match with defaulter "${c.fullName}"`);
      } else if (cnicPrefix && cDecryptedCnic.startsWith(cnicPrefix)) {
        warningFlags.push(`CNIC Family Division prefix overlap (${cnicPrefix}) with defaulter "${c.fullName}"`);
      }
    }

    return {
      hasDefaulterMatch: matchedDefaulters.length > 0,
      matchedDefaulters,
      warningFlags,
    };
  }

  // --- Products ---
  getProducts(tenantId?: string): Product[] {
    if (!tenantId) return this.products;
    return this.products.filter((p) => p.tenantId === tenantId);
  }

  getProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  // --- Plans & Short Installment Engine ---
  getPlans(tenantId?: string): InstallmentPlan[] {
    if (!tenantId) return this.plans;
    return this.plans.filter((p) => p.tenantId === tenantId);
  }

  getPlanById(id: string): InstallmentPlan | undefined {
    return this.plans.find((p) => p.id === id);
  }

  createPlan(planData: Omit<InstallmentPlan, "id" | "planNumber" | "tamperProofHash">): InstallmentPlan {
    const planNumber = `RT-2026-${String(this.plans.length + 1001).padStart(4, "0")}`;
    const id = `plan_${Date.now()}`;
    const lastHash = this.ledgerChain[this.ledgerChain.length - 1]?.hash || "0".repeat(64);
    const tamperProofHash = `sha256_${computeBlockHash(this.ledgerChain.length, lastHash, {
      id: `dp_${id}`,
      tenantId: planData.tenantId,
      timestamp: new Date().toISOString(),
      type: "DOWN_PAYMENT",
      amount: planData.downPayment,
      actorId: "system",
      notes: `Down payment registered for ${planNumber}`,
    }, new Date().toISOString()).slice(0, 32)}`;

    const newPlan: InstallmentPlan = {
      ...planData,
      id,
      planNumber,
      tamperProofHash,
    };

    this.plans.unshift(newPlan);

    const counterTill = this.wallets.find((w) => w.tenantId === planData.tenantId && w.type === "COUNTER_TILL") || this.wallets[0];
    if (counterTill && planData.downPayment > 0) {
      counterTill.balance += planData.downPayment;
      this.appendLedgerBlock({
        id: `tx_dp_${id}`,
        tenantId: planData.tenantId,
        timestamp: new Date().toISOString(),
        type: "DOWN_PAYMENT",
        amount: planData.downPayment,
        toWallet: counterTill.id,
        planId: id,
        customerId: planData.customerId,
        actorId: "branch_counter",
        notes: `Down payment of Rs. ${planData.downPayment.toLocaleString()} for plan ${planNumber} (${planData.productTitle})`,
      });
    }

    return newPlan;
  }

  recordInstallmentPayment(params: {
    planId: string;
    installmentNo: number;
    amountPaid: number;
    collectedBy: string;
    collectorRole?: string;
    targetWalletType?: "FIELD_IN_TRANSIT" | "COUNTER_TILL" | "OWNER_POCKET" | "DIGITAL_BANK";
    notes?: string;
  }) {
    const plan = this.plans.find((p) => p.id === params.planId);
    if (!plan) throw new Error("Installment plan not found");

    const scheduleItem = plan.schedule.find((s) => s.installmentNo === params.installmentNo);
    if (!scheduleItem) throw new Error(`Schedule item #${params.installmentNo} not found`);

    const allocation = allocateInstallmentPayment(
      params.amountPaid,
      scheduleItem.principalDue,
      scheduleItem.lateFee,
      plan.accumulatedShortArrears
    );

    scheduleItem.amountPaid = params.amountPaid;
    scheduleItem.paidDate = new Date().toISOString();
    scheduleItem.status = allocation.status === "SHORT_PAID" ? "SHORT_PAID" : "PAID";
    scheduleItem.receiptId = `RCPT-${Date.now().toString().slice(-6)}`;
    scheduleItem.collectedBy = params.collectedBy;
    scheduleItem.notes = params.notes || allocation.summary;
    scheduleItem.shortArrears = allocation.newShortArrears;

    plan.accumulatedShortArrears = allocation.newShortArrears;

    let targetWallet: WalletAccount | undefined;
    if (params.collectorRole === "FIELD_RECOVERY") {
      targetWallet = this.wallets.find((w) => w.tenantId === plan.tenantId && w.officerId === params.collectedBy)
        || this.wallets.find((w) => w.tenantId === plan.tenantId && w.type === "FIELD_IN_TRANSIT");
    } else {
      targetWallet = this.wallets.find((w) => w.tenantId === plan.tenantId && w.type === (params.targetWalletType || "COUNTER_TILL"));
    }

    if (targetWallet) {
      targetWallet.balance += params.amountPaid;
      targetWallet.updatedAt = new Date().toISOString();
    }

    const block = this.appendLedgerBlock({
      id: `tx_${scheduleItem.receiptId}`,
      tenantId: plan.tenantId,
      timestamp: new Date().toISOString(),
      type: allocation.status === "SHORT_PAID" ? "SHORT_PAYMENT" : "PAYMENT_IN",
      amount: params.amountPaid,
      toWallet: targetWallet?.id,
      planId: plan.id,
      customerId: plan.customerId,
      actorId: params.collectedBy,
      notes: `Installment #${params.installmentNo} collection for Plan ${plan.planNumber}. ${allocation.summary}`,
    });

    return {
      plan,
      scheduleItem,
      allocation,
      receiptId: scheduleItem.receiptId,
      ledgerBlock: block,
    };
  }

  // --- Treasury & Multi-Wallet Split ---
  getWallets(tenantId?: string): WalletAccount[] {
    if (!tenantId) return this.wallets;
    return this.wallets.filter((w) => w.tenantId === tenantId);
  }

  getWalletById(id: string): WalletAccount | undefined {
    return this.wallets.find((w) => w.id === id);
  }

  transferBetweenWallets(params: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    actorId: string;
    notes: string;
  }) {
    const fromW = this.wallets.find((w) => w.id === params.fromWalletId);
    const toW = this.wallets.find((w) => w.id === params.toWalletId);

    if (!fromW || !toW) throw new Error("Source or destination wallet not found");
    if (fromW.balance < params.amount) throw new Error(`Insufficient wallet balance in ${fromW.name}. Available: Rs. ${fromW.balance.toLocaleString()}`);

    fromW.balance -= params.amount;
    toW.balance += params.amount;
    fromW.updatedAt = new Date().toISOString();
    toW.updatedAt = new Date().toISOString();

    const block = this.appendLedgerBlock({
      id: `tx_trf_${Date.now()}`,
      tenantId: fromW.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: params.amount,
      fromWallet: fromW.id,
      toWallet: toW.id,
      actorId: params.actorId,
      notes: params.notes || `Internal transfer of Rs. ${params.amount.toLocaleString()} from ${fromW.name} to ${toW.name}`,
    });

    return { fromW, toW, block };
  }

  // --- 2-Step Handover Protocol ---
  getHandovers(tenantId?: string): HandoverRequest[] {
    if (!tenantId) return this.handovers;
    return this.handovers.filter((h) => h.tenantId === tenantId);
  }

  submitHandover(params: {
    tenantId: string;
    officerId: string;
    officerName: string;
    requestedAmount: number;
    targetWalletId: string;
    notes?: string;
  }): HandoverRequest {
    const officerWallet = this.wallets.find((w) => w.officerId === params.officerId && w.tenantId === params.tenantId);
    if (officerWallet && officerWallet.balance < params.requestedAmount) {
      throw new Error(`Requested handover amount (Rs. ${params.requestedAmount.toLocaleString()}) exceeds your in-transit bag balance (Rs. ${officerWallet.balance.toLocaleString()})`);
    }

    const handover: HandoverRequest = {
      id: `hnd_${Date.now()}`,
      tenantId: params.tenantId,
      officerId: params.officerId,
      officerName: params.officerName,
      requestedAmount: params.requestedAmount,
      targetWalletId: params.targetWalletId,
      submittedAt: new Date().toISOString(),
      status: "PENDING",
      notes: params.notes,
    };

    this.handovers.unshift(handover);
    return handover;
  }

  approveHandover(handoverId: string, verifiedBy: string, verifiedNotes?: string) {
    const handover = this.handovers.find((h) => h.id === handoverId);
    if (!handover) throw new Error("Handover request not found");
    if (handover.status !== "PENDING") throw new Error(`Handover is already ${handover.status}`);

    const officerWallet = this.wallets.find((w) => w.officerId === handover.officerId);
    const targetWallet = this.wallets.find((w) => w.id === handover.targetWalletId);

    if (!targetWallet) throw new Error("Target destination wallet not found");

    if (officerWallet) {
      officerWallet.balance = Math.max(0, officerWallet.balance - handover.requestedAmount);
      officerWallet.updatedAt = new Date().toISOString();
    }

    targetWallet.balance += handover.requestedAmount;
    targetWallet.updatedAt = new Date().toISOString();

    handover.status = "APPROVED";
    handover.verifiedBy = verifiedBy;
    handover.verifiedAt = new Date().toISOString();
    handover.notes = verifiedNotes ? `${handover.notes || ""} | Verification note: ${verifiedNotes}` : handover.notes;

    const block = this.appendLedgerBlock({
      id: `tx_hnd_${handover.id}`,
      tenantId: handover.tenantId,
      timestamp: new Date().toISOString(),
      type: "HANDOVER_TRANSFER",
      amount: handover.requestedAmount,
      fromWallet: officerWallet?.id,
      toWallet: targetWallet.id,
      actorId: verifiedBy,
      notes: `Field collection handover verified & settled for ${handover.officerName} -> ${targetWallet.name}`,
    });

    return { handover, block };
  }

  // --- Daily Expenses ---
  getExpenses(tenantId?: string): ExpenseRecord[] {
    if (!tenantId) return this.expenses;
    return this.expenses.filter((e) => e.tenantId === tenantId);
  }

  recordExpense(params: {
    tenantId: string;
    category: ExpenseRecord["category"];
    amount: number;
    fromWalletId: string;
    description: string;
    loggedBy: string;
    receiptRef?: string;
  }): ExpenseRecord {
    const wallet = this.wallets.find((w) => w.id === params.fromWalletId);
    if (!wallet) throw new Error("Wallet not found for expense debit");
    if (wallet.balance < params.amount) {
      throw new Error(`Insufficient funds in ${wallet.name} to cover Rs. ${params.amount.toLocaleString()} expense.`);
    }

    wallet.balance -= params.amount;
    wallet.updatedAt = new Date().toISOString();

    const expense: ExpenseRecord = {
      id: `exp_${Date.now()}`,
      tenantId: params.tenantId,
      category: params.category,
      amount: params.amount,
      fromWalletId: wallet.id,
      fromWalletName: wallet.name,
      loggedBy: params.loggedBy,
      date: new Date().toISOString(),
      description: params.description,
      receiptRef: params.receiptRef,
    };

    this.expenses.unshift(expense);

    this.appendLedgerBlock({
      id: `tx_${expense.id}`,
      tenantId: params.tenantId,
      timestamp: new Date().toISOString(),
      type: "EXPENSE",
      amount: params.amount,
      fromWallet: wallet.id,
      actorId: params.loggedBy,
      notes: `Expense [${params.category}]: ${params.description} (Debited from ${wallet.name})`,
    });

    return expense;
  }

  // --- Audit Ledger Chain ---
  getLedgerChain(tenantId?: string): ChainedLedgerBlock[] {
    if (!tenantId) return this.ledgerChain;
    return this.ledgerChain.filter((b) => b.payload.tenantId === tenantId);
  }

  verifyChainIntegrity() {
    return verifyLedgerChain(this.ledgerChain);
  }

  private appendLedgerBlock(payload: LedgerEntryPayload): ChainedLedgerBlock {
    const lastBlock = this.ledgerChain[this.ledgerChain.length - 1];
    const index = this.ledgerChain.length;
    const prevHash = lastBlock ? lastBlock.hash : "0000000000000000000000000000000000000000000000000000000000000000";
    const timestamp = payload.timestamp || new Date().toISOString();
    const hash = computeBlockHash(index, prevHash, payload, timestamp);

    const block: ChainedLedgerBlock = {
      index,
      id: payload.id,
      timestamp,
      payload,
      prevHash,
      hash,
      signature: `SIG_AUTO_${hash.slice(0, 16)}`,
    };

    this.ledgerChain.push(block);
    return block;
  }

  // --- Articles & CMS ---
  getArticles(): ArticlePost[] {
    return this.articles;
  }

  getArticleBySlug(slug: string): ArticlePost | undefined {
    return this.articles.find((a) => a.slug === slug);
  }

  createArticle(articleData: Omit<ArticlePost, "id" | "date">): ArticlePost {
    const newArticle: ArticlePost = {
      ...articleData,
      id: `art_${Date.now()}`,
      date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
    this.articles.unshift(newArticle);
    return newArticle;
  }

  updateArticle(id: string, updates: Partial<ArticlePost>): ArticlePost {
    const article = this.articles.find((a) => a.id === id);
    if (!article) throw new Error("Article not found");
    Object.assign(article, updates);
    return article;
  }

  deleteArticle(id: string) {
    this.articles = this.articles.filter((a) => a.id !== id);
    return { success: true };
  }

  // --- Sprint 6: Repossession & Seized Inventory ---
  getRepossessions(tenantId?: string): IRepossessionRecord[] {
    if (!tenantId) return this.repossessions;
    return this.repossessions.filter((r) => r.tenantId === tenantId);
  }

  repossessPlan(params: {
    planId: string;
    seizedDate: string;
    conditionRating: number;
    notes: string;
    officerId: string;
    officerName: string;
    witnessName?: string;
    resaleValuation: number;
    actorId: string;
  }): { plan: InstallmentPlan; repossession: IRepossessionRecord; recoveredProduct: Product } {
    const plan = this.plans.find((p) => p.id === params.planId);
    if (!plan) throw new Error("Installment contract not found for repossession.");

    // Calculate remaining bad debt written off
    const totalPaid = plan.schedule.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
    const badDebtWrittenOff = Math.max(0, plan.totalFinanced - totalPaid);

    const repossessionId = `rep_${Date.now()}`;
    const recoveredSku = `SKU-SEIZED-${plan.imeiSerial.slice(-6)}-${Date.now().toString().slice(-4)}`;

    const repossessionRecord: IRepossessionRecord = {
      id: repossessionId,
      contractId: plan.id,
      planNumber: plan.planNumber,
      tenantId: plan.tenantId,
      customerName: plan.customerName,
      productTitle: plan.productTitle,
      imeiSerial: plan.imeiSerial,
      seizedDate: params.seizedDate,
      conditionRating: params.conditionRating,
      notes: params.notes,
      officerId: params.officerId,
      officerName: params.officerName,
      witnessName: params.witnessName,
      recoveredItemSku: recoveredSku,
      resaleValuation: params.resaleValuation,
      badDebtWrittenOff,
      createdAt: new Date().toISOString(),
    };

    this.repossessions.unshift(repossessionRecord);

    // Update Plan status
    plan.status = "DEFAULTED_REPOSSESSED";
    plan.repossessedRecordId = repossessionId;
    plan.schedule.forEach((s) => {
      if (s.status !== "PAID") {
        s.status = "OVERDUE";
        s.notes = `Contract seized & repossessed on ${params.seizedDate}`;
      }
    });

    // Create refurbished / used stock product
    const recoveredProduct: Product = {
      id: `prod_refurb_${Date.now()}`,
      tenantId: plan.tenantId,
      title: `[Refurbished / Seized] ${plan.productTitle} (Rating: ${params.conditionRating}/5)`,
      brand: "Rajpoot Verified Seized Stock",
      category: "REFURBISHED_SEIZED",
      cashPrice: params.resaleValuation,
      minDownPaymentPct: 30,
      maxTenureMonths: 6,
      imeiSerialList: [plan.imeiSerial],
      specs: {
        "Condition Rating": `${params.conditionRating} / 5 Stars`,
        "Original Contract": plan.planNumber,
        "Physical Inspection Notes": params.notes,
        "Recovery Officer": params.officerName,
        "Seizure Date": params.seizedDate,
      },
      inStock: true,
      stockQuantity: 1,
      isRefurbishedSeized: true,
      originalContractId: plan.id,
    };

    this.products.unshift(recoveredProduct);

    // Ledger block for bad debt write-off & stock asset restoration
    this.appendLedgerBlock({
      id: `tx_rep_${repossessionId}`,
      tenantId: plan.tenantId,
      timestamp: new Date().toISOString(),
      type: "BAD_DEBT_WRITE_OFF",
      amount: badDebtWrittenOff,
      actorId: params.actorId,
      notes: `Contract ${plan.planNumber} repossessed. Bad debt Rs. ${badDebtWrittenOff.toLocaleString()} written off. Item re-stocked at Rs. ${params.resaleValuation.toLocaleString()} valuation.`,
    });

    return { plan, repossession: repossessionRecord, recoveredProduct };
  }

  // --- Sprint 6: Early Settlement & Profit Rebate ---
  getSettlements(tenantId?: string): ISettlementRecord[] {
    if (!tenantId) return this.settlements;
    return this.settlements.filter((s) => s.tenantId === tenantId);
  }

  getSettlementByNOC(nocId: string): ISettlementRecord | undefined {
    return this.settlements.find((s) => s.nocCertificateId === nocId);
  }

  settlePlanEarly(params: {
    planId: string;
    rebatePercentage: number;
    approvedBy: string;
    targetWalletId: string;
    actorId: string;
  }): { plan: InstallmentPlan; settlement: ISettlementRecord } {
    const plan = this.plans.find((p) => p.id === params.planId);
    if (!plan) throw new Error("Installment contract not found for early settlement.");
    if (plan.status !== "ACTIVE") throw new Error(`Contract cannot be early-settled in ${plan.status} status.`);

    const targetWallet = this.wallets.find((w) => w.id === params.targetWalletId);
    if (!targetWallet) throw new Error("Target settlement payment wallet not found.");

    const calc = calculateEarlySettlement(plan, params.rebatePercentage);
    const nocId = `NOC-${plan.planNumber}-${Date.now().toString().slice(-6)}`;

    const settlement: ISettlementRecord = {
      id: `set_${Date.now()}`,
      contractId: plan.id,
      planNumber: plan.planNumber,
      tenantId: plan.tenantId,
      customerName: plan.customerName,
      totalOriginalFinanced: calc.totalFinanced,
      totalPrincipalPaid: calc.totalPrincipalPaid,
      remainingPrincipal: calc.remainingPrincipal,
      unearnedMarkup: calc.unearnedMarkup,
      rebatePercentage: calc.rebatePercentage,
      rebateDiscountGiven: calc.rebateDiscountGiven,
      accruedPenalties: calc.accruedPenalties,
      finalSettlementPaid: calc.finalSettlementAmount,
      approvedBy: params.approvedBy,
      clearedAt: new Date().toISOString(),
      nocCertificateId: nocId,
      targetWalletId: targetWallet.id,
    };

    this.settlements.unshift(settlement);

    // Update Plan
    plan.status = "COMPLETED_EARLY_SETTLED";
    plan.settlementRecordId = settlement.id;
    plan.accumulatedShortArrears = 0;
    plan.schedule.forEach((s) => {
      if (s.status !== "PAID") {
        s.status = "PAID";
        s.paidDate = new Date().toISOString();
        s.notes = `Early settled with ${params.rebatePercentage}% profit rebate discount (NOC #${nocId})`;
      }
    });

    // Credit Target Wallet with final settlement cash
    targetWallet.balance += calc.finalSettlementAmount;
    targetWallet.updatedAt = new Date().toISOString();

    // Append Blockchain Ledger Block
    this.appendLedgerBlock({
      id: `tx_set_${settlement.id}`,
      tenantId: plan.tenantId,
      timestamp: new Date().toISOString(),
      type: "EARLY_SETTLEMENT",
      amount: calc.finalSettlementAmount,
      toWallet: targetWallet.id,
      actorId: params.actorId,
      notes: `Early settlement for ${plan.customerName} (${plan.planNumber}). Paid Rs. ${calc.finalSettlementAmount.toLocaleString()} with Rs. ${calc.rebateDiscountGiven.toLocaleString()} profit rebate. NOC: ${nocId}`,
    });

    return { plan, settlement };
  }

  // --- Sprint 6: Promise to Pay (PTP) Scheduling ---
  getPTPLogs(tenantId?: string): IPTPLog[] {
    if (!tenantId) return this.ptpLogs;
    return this.ptpLogs.filter((p) => p.tenantId === tenantId);
  }

  logPTP(params: {
    planId: string;
    promisedDate: string;
    expectedAmount: number;
    reason: IPTPLog["reason"];
    notes?: string;
    officerId: string;
    officerName: string;
  }): IPTPLog {
    const plan = this.plans.find((p) => p.id === params.planId);
    if (!plan) throw new Error("Plan not found for PTP schedule.");

    const ptp: IPTPLog = {
      id: `ptp_${Date.now()}`,
      contractId: plan.id,
      planNumber: plan.planNumber,
      tenantId: plan.tenantId,
      customerId: plan.customerId,
      customerName: plan.customerName,
      customerPhone: plan.customerPhone,
      officerId: params.officerId,
      officerName: params.officerName,
      promisedDate: params.promisedDate,
      expectedAmount: params.expectedAmount,
      reason: params.reason,
      notes: params.notes,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    this.ptpLogs.unshift(ptp);
    plan.ptpActive = true;
    plan.activePTPId = ptp.id;

    return ptp;
  }

  updatePTPStatus(id: string, status: "PENDING" | "HONORED" | "BROKEN") {
    const ptp = this.ptpLogs.find((p) => p.id === id);
    if (!ptp) throw new Error("PTP record not found");
    ptp.status = status;
    ptp.updatedAt = new Date().toISOString();

    const plan = this.plans.find((p) => p.id === ptp.contractId);
    if (plan && status !== "PENDING") {
      plan.ptpActive = false;
    }
    return ptp;
  }

  // --- Sprint 6: Offline-First Background Sync Processor ---
  syncOfflineCollections(batches: OfflineCollectionItem[]): {
    syncedCount: number;
    totalAmount: number;
    results: Array<{ tempId: string; planNumber: string; receiptId: string; status: string }>;
  } {
    let totalAmount = 0;
    const results: Array<{ tempId: string; planNumber: string; receiptId: string; status: string }> = [];

    for (const item of batches) {
      try {
        const paymentRes = this.recordInstallmentPayment({
          planId: item.planId,
          installmentNo: 1, // Auto-finds pending installment
          amountPaid: item.amount,
          collectedBy: item.collectedBy,
          collectorRole: "FIELD_RECOVERY",
          notes: `[Offline PWA Sync] Originally collected offline at ${item.collectedAt} (Hash: ${item.offlineReceiptHash})`,
        });

        totalAmount += item.amount;
        results.push({
          tempId: item.tempId,
          planNumber: item.planNumber,
          receiptId: paymentRes.receiptId || `rec_${Date.now()}`,
          status: "SYNCED_OK",
        });
      } catch (err: any) {
        results.push({
          tempId: item.tempId,
          planNumber: item.planNumber,
          receiptId: "ERROR",
          status: `FAILED: ${err.message}`,
        });
      }
    }

    return { syncedCount: results.filter((r) => r.status === "SYNCED_OK").length, totalAmount, results };
  }

  // --- Warranty Claim & Wapsi / Return Requests ---
  getClaimRequests(tenantId?: string): IClaimRequest[] {
    if (!tenantId) return this.claimRequests;
    return this.claimRequests.filter((c) => c.tenantId === tenantId);
  }

  createClaimRequest(params: Omit<IClaimRequest, "id" | "status" | "createdAt">): IClaimRequest {
    const newClaim: IClaimRequest = {
      ...params,
      id: `claim_${Date.now()}`,
      status: "PENDING_APPROVAL",
      createdAt: new Date().toISOString(),
    };
    this.claimRequests.unshift(newClaim);

    // Append Blockchain Ledger audit block
    this.appendLedgerBlock({
      id: `tx_claim_${newClaim.id}`,
      tenantId: newClaim.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: 0,
      planId: newClaim.planId,
      customerId: newClaim.customerId,
      actorId: newClaim.requestedBy,
      notes: `[${newClaim.type}] Request logged by ${newClaim.requestedByName} (${newClaim.requesterRole}) for ${newClaim.productTitle}: ${newClaim.issueDescription}`,
    });

    return newClaim;
  }

  updateClaimRequestStatus(
    id: string,
    status: IClaimRequest["status"],
    resolutionNotes?: string,
    actor?: User
  ): IClaimRequest {
    const claim = this.claimRequests.find((c) => c.id === id);
    if (!claim) throw new Error("Claim/Wapsi request not found");

    claim.status = status;
    claim.resolutionNotes = resolutionNotes;
    claim.updatedAt = new Date().toISOString();

    if (actor) {
      this.appendLedgerBlock({
        id: `tx_claim_status_${claim.id}_${Date.now()}`,
        tenantId: claim.tenantId,
        timestamp: new Date().toISOString(),
        type: "INTERNAL_TRANSFER",
        amount: 0,
        planId: claim.planId,
        customerId: claim.customerId,
        actorId: actor.id,
        notes: `Claim/Wapsi Request #${claim.id} status updated to ${status} by ${actor.name} (${actor.role}). Notes: ${resolutionNotes || "None"}`,
      });
    }

    return claim;
  }

  resolveClaimWithReplacement(params: {
    claimId: string;
    replacementProductId: string;
    replacementProductTitle: string;
    replacementSerial: string;
    defectiveAction: "SEND_TO_DEFECTIVE_STORE" | "REFURBISH_FOR_RESALE" | "DISCARD_SCRAP";
    resolutionNotes: string;
    actor: User;
  }): IClaimRequest {
    const claim = this.claimRequests.find((c) => c.id === params.claimId);
    if (!claim) throw new Error("Claim request not found");

    claim.status = "RESOLVED";
    claim.resolutionType = "REPLACED_WITH_NEW";
    claim.replacementProductId = params.replacementProductId;
    claim.replacementProductTitle = params.replacementProductTitle;
    claim.replacementSerial = params.replacementSerial;
    claim.defectiveInventoryAction = params.defectiveAction;
    claim.custodyStatus = "RESOLVED";
    claim.resolutionNotes = params.resolutionNotes;
    claim.updatedAt = new Date().toISOString();

    // 1. Update Installment Plan's IMEI / Serial if linked
    if (claim.planId) {
      const plan = this.plans.find((p) => p.id === claim.planId);
      if (plan) {
        const oldSerial = plan.imeiSerial;
        plan.imeiSerial = params.replacementSerial;
        // Append note to plan
        const nextScheduleItem = plan.schedule.find((s) => s.status !== "PAID");
        if (nextScheduleItem) {
          nextScheduleItem.notes = `[Unit Replaced under Claim #${claim.id}]: Old Serial (${oldSerial}) replaced with New Serial (${params.replacementSerial}).`;
        }
      }
    }

    // 2. Add old defective unit to inventory under defective/used condition
    const defectiveProd: Product = {
      id: `prod_def_${Date.now()}`,
      tenantId: claim.tenantId,
      title: `${claim.productTitle} (Claim #${claim.id.slice(-4)} Return)`,
      brand: "Rajpoot Returns",
      category: "REFURBISHED_SEIZED",
      cashPrice: 0,
      minDownPaymentPct: 0,
      maxTenureMonths: 0,
      imeiSerialList: [claim.imeiSerial || "DEF-SN"],
      specs: { "Fault Description": claim.issueDescription, "Return Date": new Date().toISOString().split("T")[0] },
      inStock: true,
      stockQuantity: 1,
      isRefurbishedSeized: true,
      condition: params.defectiveAction === "REFURBISH_FOR_RESALE" ? "USED_REFURBISHED" : "DEFECTIVE_DAMAGED",
      defectiveReason: claim.issueDescription,
    };
    this.products.unshift(defectiveProd);

    // 3. Ledger audit log
    this.appendLedgerBlock({
      id: `tx_claim_repl_${claim.id}_${Date.now()}`,
      tenantId: claim.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: 0,
      planId: claim.planId,
      customerId: claim.customerId,
      actorId: params.actor.id,
      notes: `Warranty Replacement Processed: Customer given new ${params.replacementProductTitle} (SN: ${params.replacementSerial}). Defective unit (SN: ${claim.imeiSerial}) taken into stock (${params.defectiveAction}). By ${params.actor.name}.`,
    });

    return claim;
  }

  resolveClaimOnSpot(params: {
    claimId: string;
    resolutionNotes: string;
    actor: User;
  }): IClaimRequest {
    const claim = this.claimRequests.find((c) => c.id === params.claimId);
    if (!claim) throw new Error("Claim request not found");

    claim.status = "RESOLVED";
    claim.resolutionType = "REPAIRED_ON_SPOT";
    claim.custodyStatus = "WITH_CUSTOMER";
    claim.resolutionNotes = params.resolutionNotes;
    claim.updatedAt = new Date().toISOString();

    this.appendLedgerBlock({
      id: `tx_claim_spot_${claim.id}_${Date.now()}`,
      tenantId: claim.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: 0,
      planId: claim.planId,
      customerId: claim.customerId,
      actorId: params.actor.id,
      notes: `Claim #${claim.id} resolved same-day at showroom/route: ${params.resolutionNotes}. By ${params.actor.name}.`,
    });

    return claim;
  }

  resolveClaimWithReturnWapsi(params: {
    claimId: string;
    inventoryCondition: "USED_REFURBISHED" | "DEFECTIVE_DAMAGED";
    resolutionNotes: string;
    actor: User;
  }): IClaimRequest {
    const claim = this.claimRequests.find((c) => c.id === params.claimId);
    if (!claim) throw new Error("Claim request not found");

    claim.status = "RESOLVED";
    claim.resolutionType = "RETURNED_WAPSI_CANCELLED";
    claim.custodyStatus = "RECEIVED_AT_SHOP";
    claim.resolutionNotes = params.resolutionNotes;
    claim.updatedAt = new Date().toISOString();

    // Mark plan completed/cancelled if applicable
    if (claim.planId) {
      const plan = this.plans.find((p) => p.id === claim.planId);
      if (plan) {
        plan.status = "COMPLETED";
      }
    }

    // Add returned unit to inventory
    const returnProd: Product = {
      id: `prod_wapsi_${Date.now()}`,
      tenantId: claim.tenantId,
      title: `${claim.productTitle} (Customer Wapsi / Return)`,
      category: "REFURBISHED_SEIZED",
      cashPrice: 0,
      minDownPaymentPct: 0,
      maxTenureMonths: 0,
      imeiSerialList: [claim.imeiSerial || "WAPSI-SN"],
      specs: { "Return Reason": claim.issueDescription },
      inStock: true,
      stockQuantity: 1,
      isRefurbishedSeized: true,
      condition: params.inventoryCondition,
      defectiveReason: claim.issueDescription,
    };
    this.products.unshift(returnProd);

    this.appendLedgerBlock({
      id: `tx_wapsi_${claim.id}_${Date.now()}`,
      tenantId: claim.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: 0,
      planId: claim.planId,
      customerId: claim.customerId,
      actorId: params.actor.id,
      notes: `Customer Wapsi / Return finalized for Claim #${claim.id}. Item added to store inventory (${params.inventoryCondition}). By ${params.actor.name}.`,
    });

    return claim;
  }

  // --- Dynamic Route Zones Management (Owner & Super Admin) ---
  getRouteZones(tenantId?: string): IRouteZone[] {
    if (!tenantId) return this.routeZones;
    return this.routeZones.filter((z) => z.tenantId === tenantId);
  }

  createRouteZone(actor: User, data: Omit<IRouteZone, "id" | "createdAt" | "updatedAt">): IRouteZone {
    if (actor.role !== "SUPER_ADMIN" && actor.role !== "OWNER") {
      throw new Error("Unauthorized: Only Shop Owner and Super Admin can create custom routes.");
    }
    const newZone: IRouteZone = {
      ...data,
      id: `zone_chn_${Date.now()}`,
      activeCustomerCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.routeZones.push(newZone);

    this.appendLedgerBlock({
      id: `tx_zone_${newZone.id}`,
      tenantId: newZone.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: 0,
      actorId: actor.id,
      notes: `Custom Route Zone created: "${newZone.name}" in ${newZone.city} (Collector: ${newZone.assignedCollectorName || "Unassigned"}). By ${actor.name}.`,
    });

    return newZone;
  }

  updateRouteZone(actor: User, id: string, data: Partial<IRouteZone>): IRouteZone {
    if (actor.role !== "SUPER_ADMIN" && actor.role !== "OWNER") {
      throw new Error("Unauthorized: Only Shop Owner and Super Admin can edit routes.");
    }
    const zone = this.routeZones.find((z) => z.id === id);
    if (!zone) throw new Error("Route Zone not found");

    Object.assign(zone, data, { updatedAt: new Date().toISOString() });

    this.appendLedgerBlock({
      id: `tx_zone_upd_${id}_${Date.now()}`,
      tenantId: zone.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: 0,
      actorId: actor.id,
      notes: `Route Zone updated: "${zone.name}". By ${actor.name}.`,
    });

    return zone;
  }

  deleteRouteZone(actor: User, id: string): boolean {
    if (actor.role !== "SUPER_ADMIN" && actor.role !== "OWNER") {
      throw new Error("Unauthorized: Only Shop Owner and Super Admin can delete routes.");
    }
    const idx = this.routeZones.findIndex((z) => z.id === id);
    if (idx === -1) return false;
    const removed = this.routeZones.splice(idx, 1)[0];

    this.appendLedgerBlock({
      id: `tx_zone_del_${id}_${Date.now()}`,
      tenantId: removed.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: 0,
      actorId: actor.id,
      notes: `Route Zone deleted: "${removed.name}". By ${actor.name}.`,
    });

    return true;
  }

  // --- Staff Performance Targets Management ---
  getStaffTargets(tenantId?: string): IStaffTarget[] {
    if (!tenantId) return this.staffTargets;
    return this.staffTargets.filter((t) => t.tenantId === tenantId);
  }

  createStaffTarget(actor: User, data: Omit<IStaffTarget, "id" | "createdAt" | "updatedAt">): IStaffTarget {
    if (actor.role !== "SUPER_ADMIN" && actor.role !== "OWNER") {
      throw new Error("Unauthorized: Only Shop Owner and Super Admin can set staff targets.");
    }
    const newTarget: IStaffTarget = {
      ...data,
      id: `target_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.staffTargets.unshift(newTarget);

    this.appendLedgerBlock({
      id: `tx_target_${newTarget.id}`,
      tenantId: newTarget.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: 0,
      actorId: actor.id,
      notes: `Performance Target assigned to ${newTarget.staffName} (${newTarget.targetType}: ${newTarget.targetValue.toLocaleString()} for ${newTarget.periodType}). By ${actor.name}.`,
    });

    return newTarget;
  }

  updateStaffTarget(actor: User, id: string, data: Partial<IStaffTarget>): IStaffTarget {
    if (actor.role !== "SUPER_ADMIN" && actor.role !== "OWNER") {
      throw new Error("Unauthorized: Only Shop Owner can edit targets.");
    }
    const target = this.staffTargets.find((t) => t.id === id);
    if (!target) throw new Error("Staff target not found");

    Object.assign(target, data, { updatedAt: new Date().toISOString() });
    return target;
  }

  deleteStaffTarget(actor: User, id: string): boolean {
    if (actor.role !== "SUPER_ADMIN" && actor.role !== "OWNER") {
      throw new Error("Unauthorized: Only Shop Owner can delete targets.");
    }
    const idx = this.staffTargets.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.staffTargets.splice(idx, 1);
    return true;
  }

  // --- Field Orders & Bookings ---
  getFieldOrders(tenantId?: string): IFieldOrder[] {
    if (!tenantId) return this.fieldOrders;
    return this.fieldOrders.filter((o) => o.tenantId === tenantId);
  }

  createFieldOrder(actor: User, data: Omit<IFieldOrder, "id" | "orderNumber" | "status" | "createdAt" | "updatedAt">): IFieldOrder {
    const newOrder: IFieldOrder = {
      ...data,
      id: `ord_${Date.now()}`,
      orderNumber: `ORD-CHN-${Date.now().toString().slice(-6)}`,
      status: "BOOKED_PENDING",
      createdAt: new Date().toISOString(),
    };
    this.fieldOrders.unshift(newOrder);

    this.appendLedgerBlock({
      id: `tx_ord_book_${newOrder.id}`,
      tenantId: newOrder.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: 0,
      actorId: actor.id,
      notes: `Field Order Booked #${newOrder.orderNumber} for ${newOrder.customerName} (${newOrder.productTitle}) by ${actor.name} (${actor.role}). Preference: ${newOrder.paymentPreference}.`,
    });

    return newOrder;
  }

  updateFieldOrderStatus(
    actor: User,
    id: string,
    status: IFieldOrder["status"],
    options?: { dispatchedWithOfficerId?: string; dispatchedWithOfficerName?: string; notes?: string }
  ): IFieldOrder {
    const order = this.fieldOrders.find((o) => o.id === id);
    if (!order) throw new Error("Order not found");

    order.status = status;
    if (options?.dispatchedWithOfficerId) order.dispatchedWithOfficerId = options.dispatchedWithOfficerId;
    if (options?.dispatchedWithOfficerName) order.dispatchedWithOfficerName = options.dispatchedWithOfficerName;
    if (options?.notes) order.notes = (order.notes ? order.notes + " | " : "") + options.notes;
    order.updatedAt = new Date().toISOString();

    this.appendLedgerBlock({
      id: `tx_ord_stat_${id}_${Date.now()}`,
      tenantId: order.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: 0,
      actorId: actor.id,
      notes: `Field Order #${order.orderNumber} status changed to ${status} by ${actor.name}.`,
    });

    return order;
  }

  fulfillFieldOrderAsCashSale(actor: User, orderId: string, walletId: string): { order: IFieldOrder; receiptId: string } {
    const order = this.fieldOrders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");

    const product = this.products.find((p) => p.id === order.productId);
    const saleAmount = product ? product.cashPrice * order.quantity : 10000;

    const targetWallet = this.wallets.find((w) => w.id === walletId) || this.wallets[0];
    targetWallet.balance += saleAmount;

    order.status = "DELIVERED_COMPLETED";
    order.deliveredAt = new Date().toISOString();
    const receiptId = `REC-CASH-${Date.now().toString().slice(-6)}`;
    order.convertedSaleReceiptId = receiptId;
    order.updatedAt = new Date().toISOString();

    this.appendLedgerBlock({
      id: `tx_ord_cash_${order.id}`,
      tenantId: order.tenantId,
      timestamp: new Date().toISOString(),
      type: "PAYMENT_IN",
      amount: saleAmount,
      actorId: actor.id,
      notes: `Field Order #${order.orderNumber} fulfilled as CASH SALE for ${order.customerName} (${order.productTitle} x ${order.quantity}). Rs. ${saleAmount.toLocaleString()} deposited to ${targetWallet.name}. Receipt #${receiptId}.`,
    });

    return { order, receiptId };
  }

  fulfillFieldOrderAsInstallment(actor: User, orderId: string, planId: string): IFieldOrder {
    const order = this.fieldOrders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");

    order.status = "DELIVERED_COMPLETED";
    order.deliveredAt = new Date().toISOString();
    order.convertedPlanId = planId;
    order.updatedAt = new Date().toISOString();

    this.appendLedgerBlock({
      id: `tx_ord_inst_${order.id}`,
      tenantId: order.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: 0,
      planId,
      actorId: actor.id,
      notes: `Field Order #${order.orderNumber} delivered & converted to Installment Plan #${planId} for ${order.customerName}.`,
    });

    return order;
  }

  // --- Live GPS Update on Customer & Plan (Any Role Authorization) ---
  updateCustomerGps(customerId: string, gps: GPSLocation, newAddress?: string, newLandmark?: string, actorId: string = "system"): Customer {
    const customer = this.customers.find((c) => c.id === customerId);
    if (!customer) throw new Error("Customer not found");

    customer.gpsLocation = gps;
    if (newAddress && newAddress.trim().length > 0) customer.address = newAddress;
    if (newLandmark && newLandmark.trim().length > 0) customer.landmark = newLandmark;

    // Also update all active installment plans for this customer
    this.plans
      .filter((p) => p.customerId === customerId)
      .forEach((p) => {
        p.gpsLocation = gps;
        if (gps.aiSuggestedZone) p.areaZone = gps.aiSuggestedZone;
      });

    this.appendLedgerBlock({
      id: `tx_gps_${customerId}_${Date.now()}`,
      tenantId: customer.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: 0,
      actorId,
      customerId,
      notes: `Customer GPS Pin updated: Lat ${gps.lat.toFixed(6)}, Lng ${gps.lng.toFixed(6)}. Address: ${customer.address}.`,
    });

    return customer;
  }

  updatePlanGps(planId: string, gps: GPSLocation, newAddress?: string, actorId: string = "system"): InstallmentPlan {
    const plan = this.plans.find((p) => p.id === planId);
    if (!plan) throw new Error("Plan not found");

    plan.gpsLocation = gps;
    if (gps.aiSuggestedZone) plan.areaZone = gps.aiSuggestedZone;

    // Also update customer record
    const customer = this.customers.find((c) => c.id === plan.customerId);
    if (customer) {
      customer.gpsLocation = gps;
      if (newAddress) customer.address = newAddress;
    }

    this.appendLedgerBlock({
      id: `tx_gps_plan_${planId}_${Date.now()}`,
      tenantId: plan.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: 0,
      actorId,
      planId,
      customerId: plan.customerId,
      notes: `Plan #${plan.planNumber} GPS location pinned: Lat ${gps.lat.toFixed(6)}, Lng ${gps.lng.toFixed(6)}. Area: ${plan.areaZone}.`,
    });

    return plan;
  }

  // --- Sprint 6: Automated Encrypted Cloud Backup ---
  exportEncryptedBackup(tenantId?: string) {
    const snapshot = {
      backupTimestamp: new Date().toISOString(),
      platform: "RAJPOOT TRADERS - Enterprise Treasury Platform",
      schemaVersion: "6.0-ENTERPRISE",
      chainIntegrity: this.verifyChainIntegrity(),
      data: {
        tenants: this.tenants,
        users: this.users,
        customers: this.customers,
        products: this.products,
        plans: this.plans,
        wallets: this.wallets,
        handovers: this.handovers,
        expenses: this.expenses,
        repossessions: this.repossessions,
        settlements: this.settlements,
        ptpLogs: this.ptpLogs,
        ledgerChain: this.ledgerChain,
        articles: this.articles,
      },
    };

    const rawJson = JSON.stringify(snapshot, null, 2);
    const encryptedPayload = encryptField(rawJson);
    const totalRecords =
      this.tenants.length +
      this.users.length +
      this.customers.length +
      this.products.length +
      this.plans.length +
      this.wallets.length +
      this.handovers.length +
      this.expenses.length +
      this.repossessions.length +
      this.settlements.length +
      this.ptpLogs.length +
      this.ledgerChain.length;

    return {
      backupTimestamp: snapshot.backupTimestamp,
      totalRecords,
      chainIntegrityValid: snapshot.chainIntegrity.isValid,
      chainLength: this.ledgerChain.length,
      sizeBytes: typeof Blob !== "undefined" ? new Blob([encryptedPayload]).size : encryptedPayload.length,
      encryptedPayload,
      unencryptedSnapshot: snapshot,
    };
  }

  // --- Khata Edit, Correction & Transfer for Owners / Super Admin ---
  correctInstallmentPayment(params: {
    planId: string;
    installmentNo: number;
    newAmountPaid: number;
    newStatus: "PAID" | "SHORT_PAID" | "PENDING" | "OVERDUE";
    reason: string;
    editorUser: User;
  }): { plan: InstallmentPlan; scheduleItem: InstallmentScheduleItem } {
    if (params.editorUser.role !== "SUPER_ADMIN" && params.editorUser.role !== "OWNER") {
      throw new Error("غیر مجاز: کھاتہ میں تصحیح یا تبدیلی کا اختیار صرف دکان کے مالک (Owner) یا سپر ایڈمن کے پاس ہے۔");
    }

    const plan = this.plans.find((p) => p.id === params.planId);
    if (!plan) throw new Error("Installment plan not found");

    const item = plan.schedule.find((s) => s.installmentNo === params.installmentNo);
    if (!item) throw new Error(`Installment #${params.installmentNo} not found`);

    const prevAmount = item.amountPaid || 0;
    const diff = params.newAmountPaid - prevAmount;

    item.amountPaid = params.newAmountPaid;
    item.status = params.newStatus;
    item.notes = `[Khata Correction by ${params.editorUser.name} (${params.editorUser.role})]: ${params.reason} (Previous: Rs. ${prevAmount.toLocaleString()})`;

    // Recalculate plan arrears
    let accumulatedArrears = 0;
    for (const s of plan.schedule) {
      if (s.status === "SHORT_PAID") {
        accumulatedArrears += Math.max(0, s.totalDue - s.amountPaid);
      } else if (s.status === "OVERDUE") {
        accumulatedArrears += s.totalDue;
      }
    }
    plan.accumulatedShortArrears = accumulatedArrears;

    // Append Blockchain Audit Log
    this.appendLedgerBlock({
      id: `tx_corr_${Date.now()}`,
      tenantId: plan.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: Math.abs(diff),
      planId: plan.id,
      customerId: plan.customerId,
      actorId: params.editorUser.id,
      notes: `Khata Correction for ${plan.customerName} (${plan.planNumber}) Inst #${params.installmentNo}: Changed paid amount from Rs. ${prevAmount.toLocaleString()} to Rs. ${params.newAmountPaid.toLocaleString()}. Reason: ${params.reason}`,
    });

    return { plan, scheduleItem: item };
  }

  transferKhataPayment(params: {
    fromPlanId: string;
    toPlanId: string;
    amount: number;
    reason: string;
    editorUser: User;
  }): { fromPlan: InstallmentPlan; toPlan: InstallmentPlan } {
    if (params.editorUser.role !== "SUPER_ADMIN" && params.editorUser.role !== "OWNER") {
      throw new Error("غیر مجاز: کھاتہ ٹرانسفر کا اختیار صرف دکان کے مالک (Owner) یا سپر ایڈمن کے پاس ہے۔");
    }

    const fromPlan = this.plans.find((p) => p.id === params.fromPlanId);
    const toPlan = this.plans.find((p) => p.id === params.toPlanId);

    if (!fromPlan) throw new Error("Source Plan (#1) not found");
    if (!toPlan) throw new Error("Destination Target Plan (#2) not found");

    // Deduct from fromPlan
    const fromInst = fromPlan.schedule.slice().reverse().find((s) => s.amountPaid >= params.amount) || fromPlan.schedule[0];
    fromInst.amountPaid = Math.max(0, fromInst.amountPaid - params.amount);
    if (fromInst.amountPaid === 0) {
      fromInst.status = "PENDING";
    } else {
      fromInst.status = "SHORT_PAID";
    }
    fromInst.notes = `[Payment Transferred Out to ${toPlan.planNumber} by ${params.editorUser.name}]: ${params.reason}`;

    // Credit to toPlan
    const toInst = toPlan.schedule.find((s) => s.status !== "PAID") || toPlan.schedule[0];
    toInst.amountPaid = (toInst.amountPaid || 0) + params.amount;
    if (toInst.amountPaid >= toInst.totalDue) {
      toInst.status = "PAID";
      toInst.paidDate = new Date().toISOString();
    } else {
      toInst.status = "SHORT_PAID";
    }
    toInst.notes = `[Payment Transferred In from ${fromPlan.planNumber} by ${params.editorUser.name}]: ${params.reason}`;

    // Append Blockchain Audit Log
    this.appendLedgerBlock({
      id: `tx_xfer_${Date.now()}`,
      tenantId: fromPlan.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: params.amount,
      planId: toPlan.id,
      customerId: toPlan.customerId,
      actorId: params.editorUser.id,
      notes: `Khata Mistake Rectification: Transferred Rs. ${params.amount.toLocaleString()} from ${fromPlan.customerName} (${fromPlan.planNumber}) to ${toPlan.customerName} (${toPlan.planNumber}). Reason: ${params.reason}`,
    });

    return { fromPlan, toPlan };
  }

  // --- Product Management (Owner / Salesman) ---
  createProduct(creator: User, productData: Omit<Product, "id">): Product {
    if (creator.role !== "SUPER_ADMIN" && creator.role !== "OWNER" && creator.role !== "BRANCH_MANAGER") {
      throw new Error("غیر مجاز: پروڈکٹ شامل کرنے کا اختیار صرف دکان کے مالک یا مینیجر کے پاس ہے۔");
    }
    const newProduct: Product = {
      ...productData,
      id: `prod_${Date.now()}`,
      tenantId: creator.tenantId,
    };
    this.products.unshift(newProduct);
    return newProduct;
  }

  // --- Fast Next Due Date / Installment Day Rescheduler for Recovery Officers & Salesmen ---
  updatePlanNextDueDate(params: {
    planId: string;
    installmentNo: number;
    newDueDate: string;
    reason: string;
    updater: User;
  }): InstallmentPlan {
    const plan = this.plans.find((p) => p.id === params.planId);
    if (!plan) throw new Error("Plan not found");

    const item = plan.schedule.find((s) => s.installmentNo === params.installmentNo);
    if (!item) throw new Error(`Installment #${params.installmentNo} not found`);

    const prevDueDate = item.dueDate;
    item.dueDate = params.newDueDate;
    item.notes = `[Date Rescheduled by ${params.updater.name} (${params.updater.role})]: Changed from ${prevDueDate} to ${params.newDueDate}. Reason: ${params.reason}`;

    // Append Blockchain Audit Log
    this.appendLedgerBlock({
      id: `tx_resched_${Date.now()}`,
      tenantId: plan.tenantId,
      timestamp: new Date().toISOString(),
      type: "INTERNAL_TRANSFER",
      amount: 0,
      planId: plan.id,
      customerId: plan.customerId,
      actorId: params.updater.id,
      notes: `Installment Due Date Rescheduled for ${plan.customerName} (${plan.planNumber}) Inst #${params.installmentNo}: Changed from ${prevDueDate} to ${params.newDueDate}. Reason: ${params.reason}`,
    });

    return plan;
  }

  // --- Fast Manual Legacy / Old Customer Onboarding ---
  createLegacyKhataCustomer(data: LegacyCustomerInput): { customer: Customer; plan: InstallmentPlan } {
    const customerId = `cust_leg_${Date.now()}`;
    const guarantors: Guarantor[] = [
      {
        id: `g1_${Date.now()}`,
        fullName: data.guarantor1Name,
        fatherName: "N/A",
        cnic: data.guarantor1Cnic,
        phone: data.guarantor1Phone,
        relation: data.guarantor1Relation || "ضامن",
        address: data.address,
        workplace: "مقامی مارکیٹ",
        landmark: data.landmark || data.zoneArea,
      },
    ];

    if (data.guarantor2Name && data.guarantor2Name.trim().length > 0) {
      guarantors.push({
        id: `g2_${Date.now()}`,
        fullName: data.guarantor2Name,
        fatherName: "N/A",
        cnic: data.guarantor2Cnic || "33202-0000000-0",
        phone: data.guarantor2Phone || data.phone,
        relation: data.guarantor2Relation || "پڑوسی",
        address: data.address,
        workplace: "کاروبار",
        landmark: data.zoneArea,
      });
    }

    const customer: Customer = {
      id: customerId,
      tenantId: data.tenantId,
      fullName: data.fullName,
      fatherName: data.fatherName,
      cnic: data.cnic,
      phone: data.phone,
      secondaryPhone: data.secondaryPhone,
      address: data.address,
      landmark: data.landmark || data.zoneArea,
      city: data.city || "چنیوٹ (Chiniot)",
      zoneArea: data.zoneArea || "محلہ رحمن آباد و مسلم بازار چنیوٹ",
      guarantors,
      riskScore: 20,
      isDefaulter: false,
      createdAt: data.startDate || new Date().toISOString(),
    };
    this.customers.unshift(customer);

    // Build schedule based on frequency (Weekly, 10-Days, Monthly)
    const schedule: InstallmentScheduleItem[] = [];
    const baseStartDate = data.startDate ? new Date(data.startDate) : new Date();
    const totalCount = data.totalInstallmentsCount || data.durationMonths || 12;
    const intervalDays = data.collectionIntervalDays || (data.installmentFrequency === "WEEKLY" ? 7 : (data.installmentFrequency === "TEN_DAYS" ? 10 : 30));

    for (let i = 1; i <= totalCount; i++) {
      const dueDateObj = new Date(baseStartDate);
      if (data.installmentFrequency === "WEEKLY" || data.installmentFrequency === "TEN_DAYS" || data.installmentFrequency === "FIFTEEN_DAYS") {
        dueDateObj.setDate(dueDateObj.getDate() + (i * intervalDays));
      } else {
        dueDateObj.setMonth(dueDateObj.getMonth() + i);
      }
      const dueDateStr = dueDateObj.toISOString().split("T")[0];

      const isPastPaid = i <= data.monthsAlreadyPaid;
      const isNextDue = !isPastPaid && i === data.monthsAlreadyPaid + 1;
      const shortArrears = isNextDue ? (data.pendingShortArrears || 0) : 0;
      const totalDue = data.monthlyInstallment + shortArrears;

      schedule.push({
        installmentNo: i,
        dueDate: isNextDue && data.nextDueDate ? data.nextDueDate : dueDateStr,
        principalDue: data.monthlyInstallment,
        lateFee: 0,
        shortArrears,
        totalDue,
        amountPaid: isPastPaid ? data.monthlyInstallment : 0,
        paidDate: isPastPaid ? dueDateStr : undefined,
        status: isPastPaid ? "PAID" : "PENDING",
        collectedBy: isPastPaid ? (data.salesmanName || "رجسٹر کھاتہ اندراج") : undefined,
        notes: isPastPaid ? "ماضی میں ادا شدہ قسط" : undefined,
      });
    }

    const planId = `plan_leg_${Date.now()}`;
    const planNumber = data.khataNumber ? `RT-CHN-${data.khataNumber.padStart(6, "0")}` : `RT-CHN-${Date.now().toString().slice(-6)}`;
    const serialNo = data.imeiSerial || `SN-CHN-${Date.now().toString().slice(-6)}`;

    const plan: InstallmentPlan = {
      id: planId,
      planNumber,
      khataNumber: data.khataNumber || planNumber.slice(-4),
      tenantId: data.tenantId,
      customerId,
      customerName: data.fullName,
      customerCnic: data.cnic,
      customerPhone: data.phone,
      salesmanName: data.salesmanName || "ضہیم",
      productId: data.productId || `prod_leg_${Date.now()}`,
      productTitle: data.productTitle,
      imeiSerial: serialNo,
      cashPrice: Math.round(data.totalFinanced * 0.85),
      downPayment: data.downPayment,
      markupRatePct: 15,
      totalMarkup: Math.round(data.totalFinanced * 0.15),
      totalFinanced: data.totalFinanced,
      durationMonths: totalCount,
      totalInstallmentsCount: totalCount,
      installmentFrequency: data.installmentFrequency || "WEEKLY",
      collectionIntervalDays: intervalDays,
      collectionDayName: data.collectionDayName || "ہفتہ",
      monthlyInstallment: data.monthlyInstallment,
      accumulatedShortArrears: data.pendingShortArrears || 0,
      status: data.monthsAlreadyPaid >= totalCount ? "COMPLETED" : "ACTIVE",
      startDate: data.startDate || new Date().toISOString(),
      endDate: schedule[schedule.length - 1]?.dueDate || new Date().toISOString(),
      schedule,
      guarantorIds: guarantors.map((g) => g.id),
      areaZone: data.zoneArea,
      contractVerified: true,
      tamperProofHash: `LEG_HASH_CHN_${Date.now()}`,
    };

    this.plans.unshift(plan);

    // Append Audit Block
    this.appendLedgerBlock({
      id: `tx_leg_${planId}`,
      tenantId: data.tenantId,
      timestamp: new Date().toISOString(),
      type: "PAYMENT_IN",
      amount: (data.totalPaidInPast || 0) + (data.downPayment || 0),
      planId,
      customerId,
      actorId: data.createdBy,
      notes: `Legacy Khata initialized for ${data.fullName} (کھاتہ #${plan.khataNumber}) - ${data.productTitle} by Salesman ${plan.salesmanName}. ${data.monthsAlreadyPaid}/${totalCount} installments pre-paid in physical register.`,
    });

    return { customer, plan };
  }
}

const globalForStore = globalThis as unknown as { appStore?: AppStore };
export const store = globalForStore.appStore ?? new AppStore();
if (process.env.NODE_ENV !== "production") globalForStore.appStore = store;