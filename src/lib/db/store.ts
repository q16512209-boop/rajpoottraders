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
  Customer,
  Product,
  InstallmentPlan,
  WalletAccount,
  HandoverRequest,
  ExpenseRecord,
  ArticlePost,
} from "./types";
import { ChainedLedgerBlock, computeBlockHash, verifyLedgerChain, LedgerEntryPayload } from "../crypto/hash-chain";
import { allocateInstallmentPayment, calculateInstallmentBreakdown } from "../calculations";
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
  private isProductionCleanMode: boolean = true;

  // --- Authentication & User Management ---
  authenticate(email: string, password: string):User | null {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password && u.status === "ACTIVE"
    );
    return user || null;
  }

  getUsers(tenantId?: string): User[] {
    if (!tenantId) return this.users;
    return this.users.filter((u) => u.tenantId === tenantId || u.role === "SUPER_ADMIN");
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

  updateUser(id: string, updates: Partial<User>): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error("User not found");
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
}

const globalForStore = globalThis as unknown as { appStore?: AppStore };
export const store = globalForStore.appStore ?? new AppStore();
if (process.env.NODE_ENV !== "production") globalForStore.appStore = store;