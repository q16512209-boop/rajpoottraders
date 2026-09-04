export type UserRole =
  | "SUPER_ADMIN"     // Tier 0: Platform Oversight, Audit Chain, Branch Licensing, All Roles
  | "OWNER"           // Tier 1: Shop Owner, Dedicated Owner Pocket Wallet, Treasury, Staff Roles
  | "BRANCH_MANAGER"  // Tier 2: Showroom Manager, Till reconciliation, Counter down payments, Customer KYC
  | "FIELD_RECOVERY"  // Tier 3: Field Recovery Officer, Route sheets, Partial payments, Handovers
  | "CUSTOMER";       // Tier 4: Self-Service Customer, My Plans, Receipts, Arrears

export interface Tenant {
  id: string;
  name: string;
  code: string;
  brandHeader: string;
  urduBrandName: string;
  address: string;
  contact: string;
  status: "ACTIVE" | "SUSPENDED" | "TRIAL";
  ownerName: string;
  ownerEmail: string;
  licenseValidUntil: string;
  licenseTier?: string;
  createdAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  assignedRouteZone?: string;
  customerId?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export interface Guarantor {
  id: string;
  fullName: string;
  fatherName: string;
  cnic: string;
  phone: string;
  relation: string;
  address: string;
  workplace: string;
  landmark: string;
}

export interface GPSLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
  mapUrl?: string;
  detectedAt?: string;
  aiSuggestedZone?: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  fullName: string;
  fatherName: string;
  cnic: string;
  phone: string;
  secondaryPhone?: string;
  address: string;
  landmark: string;
  city: string;
  zoneArea: string;
  photoUrl?: string;
  gpsLocation?: GPSLocation;
  guarantors: Guarantor[];
  riskScore: number;
  isDefaulter: boolean;
  defaulterReason?: string;
  createdAt: string;
}

export type InstallmentFrequency = "WEEKLY" | "TEN_DAYS" | "FIFTEEN_DAYS" | "MONTHLY";

export interface Product {
  id: string;
  tenantId: string;
  title: string;
  brand?: string;
  category: "HOME_APPLIANCES" | "ELECTRIC_IRONS" | "FANS" | "SMARTPHONES" | "AIR_CONDITIONERS" | "SOLAR_HYBRID" | "MOTORBIKES" | "REFURBISHED_SEIZED";
  cashPrice: number;
  installmentPrice?: number; // کل قسط قیمت (قابل رعایت)
  defaultDownPayment?: number;
  defaultInstallmentAmount?: number;
  defaultFrequency?: InstallmentFrequency;
  defaultTotalInstallments?: number;
  minDownPaymentPct: number;
  maxTenureMonths: number;
  imeiSerialList: string[];
  specs: Record<string, string>;
  inStock: boolean;
  stockQuantity?: number;
  image?: string;
  popularInstallmentPlans?: { months: number; downPayment: number; monthly: number }[];
  isRefurbishedSeized?: boolean;
  originalContractId?: string;
}

export interface InstallmentScheduleItem {
  installmentNo: number;
  dueDate: string;
  principalDue: number;
  lateFee: number;
  shortArrears: number;
  totalDue: number;
  amountPaid: number;
  paidDate?: string;
  status: "PENDING" | "PAID" | "SHORT_PAID" | "OVERDUE";
  collectedBy?: string;
  receiptId?: string;
  notes?: string;
}

export interface InstallmentPlan {
  id: string;
  planNumber: string;
  khataNumber?: string; // e.g. "6" or "کھاتہ نمبر 6"
  tenantId: string;
  customerId: string;
  customerName: string;
  customerCnic: string;
  customerPhone: string;
  salesmanName?: string; // e.g. "ضہیم"
  salesmanId?: string;
  productId: string;
  productTitle: string;
  imeiSerial: string;
  cashPrice: number;
  downPayment: number;
  markupRatePct: number;
  totalMarkup: number;
  totalFinanced: number;
  durationMonths: number;
  totalInstallmentsCount?: number;
  installmentFrequency?: InstallmentFrequency; // WEEKLY, TEN_DAYS, FIFTEEN_DAYS, MONTHLY
  collectionIntervalDays?: number; // e.g. 7 for weekly, 10 for 10-days
  collectionDayName?: string; // e.g. "FRIDAY", "ہفتہ", "سوموار"
  monthlyInstallment: number; // installment amount per cycle (e.g. 500 weekly)
  accumulatedShortArrears: number;
  status: "ACTIVE" | "COMPLETED" | "DEFAULTED" | "WRITTEN_OFF" | "DEFAULTED_REPOSSESSED" | "COMPLETED_EARLY_SETTLED";
  startDate: string;
  endDate: string;
  schedule: InstallmentScheduleItem[];
  guarantorIds: string[];
  recoveryOfficerId?: string;
  areaZone: string;
  gpsLocation?: GPSLocation;
  contractVerified: boolean;
  tamperProofHash: string;
  ptpActive?: boolean;
  activePTPId?: string;
  repossessedRecordId?: string;
  settlementRecordId?: string;
}

export interface IRepossessionRecord {
  id: string;
  contractId: string;
  planNumber: string;
  tenantId: string;
  customerName: string;
  productTitle: string;
  imeiSerial: string;
  seizedDate: string;
  conditionRating: number; // 1 to 5
  notes: string;
  officerId: string;
  officerName: string;
  witnessName?: string;
  recoveredItemSku: string;
  resaleValuation: number;
  badDebtWrittenOff: number;
  createdAt: string;
}

export interface ISettlementRecord {
  id: string;
  contractId: string;
  planNumber: string;
  tenantId: string;
  customerName: string;
  totalOriginalFinanced: number;
  totalPrincipalPaid: number;
  remainingPrincipal: number;
  unearnedMarkup: number;
  rebatePercentage: number;
  rebateDiscountGiven: number;
  accruedPenalties: number;
  finalSettlementPaid: number;
  approvedBy: string;
  clearedAt: string;
  nocCertificateId: string;
  targetWalletId: string;
}

export interface IPTPLog {
  id: string;
  contractId: string;
  planNumber: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  officerId: string;
  officerName: string;
  promisedDate: string;
  expectedAmount: number;
  reason: "SALARY_DELAY" | "MEDICAL_EMERGENCY" | "OUT_OF_CITY_TRAVEL" | "DISPUTED_BILL" | "FAMILY_ISSUE" | "OTHER";
  notes?: string;
  status: "PENDING" | "HONORED" | "BROKEN";
  createdAt: string;
  updatedAt?: string;
}

export interface OfflineCollectionItem {
  tempId: string;
  planId: string;
  planNumber: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  collectedAt: string;
  collectedBy: string;
  synced: boolean;
  offlineReceiptHash: string;
}

export interface WalletAccount {
  id: string;
  tenantId: string;
  type: "OWNER_POCKET" | "COUNTER_TILL" | "FIELD_IN_TRANSIT" | "DIGITAL_BANK";
  name: string;
  balance: number;
  accountNumber?: string;
  bankName?: string;
  officerId?: string;
  updatedAt: string;
}

export interface HandoverRequest {
  id: string;
  tenantId: string;
  officerId: string;
  officerName: string;
  requestedAmount: number;
  targetWalletId: string;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes?: string;
}

export interface ExpenseRecord {
  id: string;
  tenantId: string;
  category: "PETROL_TRANSPORT" | "TEA_REFRESHMENT" | "STAFF_SALARY" | "SHOP_UTILITIES" | "OWNER_WITHDRAWAL" | "MISC";
  amount: number;
  fromWalletId: string;
  fromWalletName: string;
  loggedBy: string;
  date: string;
  description: string;
  receiptRef?: string;
}

export interface ArticlePost {
  id: string;
  slug: string;
  title: string;
  urduTitle: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  author: string;
  contentHtml: string;
  keywords: string[];
}

export interface LegacyCustomerInput {
  tenantId: string;
  khataNumber?: string; // e.g. "6"
  salesmanName?: string; // e.g. "ضہیم"
  fullName: string;
  fatherName: string;
  cnic: string;
  phone: string;
  secondaryPhone?: string;
  address: string;
  landmark?: string;
  city: string;
  zoneArea: string;
  guarantor1Name: string;
  guarantor1Phone: string;
  guarantor1Cnic: string;
  guarantor1Relation: string;
  guarantor2Name?: string; // Optional!
  guarantor2Phone?: string;
  guarantor2Cnic?: string;
  guarantor2Relation?: string;
  productId?: string;
  productTitle: string;
  imeiSerial?: string;
  totalFinanced: number;
  downPayment: number;
  durationMonths: number;
  totalInstallmentsCount?: number;
  installmentFrequency?: InstallmentFrequency; // WEEKLY, TEN_DAYS, FIFTEEN_DAYS, MONTHLY
  collectionIntervalDays?: number; // e.g. 7 for weekly
  collectionDayName?: string; // e.g. "FRIDAY", "ہفتہ", "سوموار"
  monthlyInstallment: number;
  monthsAlreadyPaid: number;
  totalPaidInPast: number;
  pendingShortArrears: number;
  startDate?: string;
  nextDueDate: string;
  createdBy: string;
}

export interface IClaimRequest {
  id: string;
  tenantId: string;
  type: "WARRANTY_CLAIM" | "RETURN_WAPSI" | "PRODUCT_ISSUE" | "DISPUTE";
  planId?: string;
  planNumber?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  productTitle: string;
  imeiSerial?: string;
  issueDescription: string;
  physicalConditionNotes?: string;
  requestedBy: string;
  requestedByName: string;
  requesterRole: UserRole;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "RESOLVED";
  resolutionNotes?: string;
  createdAt: string;
  updatedAt?: string;
}