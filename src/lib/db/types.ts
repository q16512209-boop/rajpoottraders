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
  guarantors: Guarantor[];
  riskScore: number;
  isDefaulter: boolean;
  defaulterReason?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  title: string;
  brand?: string;
  category: "SMARTPHONES" | "AIR_CONDITIONERS" | "SOLAR_HYBRID" | "MOTORBIKES" | "HOME_APPLIANCES";
  cashPrice: number;
  minDownPaymentPct: number;
  maxTenureMonths: number;
  imeiSerialList: string[];
  specs: Record<string, string>;
  inStock: boolean;
  stockQuantity?: number;
  image?: string;
  popularInstallmentPlans?: { months: number; downPayment: number; monthly: number }[];
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
  tenantId: string;
  customerId: string;
  customerName: string;
  customerCnic: string;
  customerPhone: string;
  productId: string;
  productTitle: string;
  imeiSerial: string;
  cashPrice: number;
  downPayment: number;
  markupRatePct: number;
  totalMarkup: number;
  totalFinanced: number;
  durationMonths: number;
  monthlyInstallment: number;
  accumulatedShortArrears: number;
  status: "ACTIVE" | "COMPLETED" | "DEFAULTED" | "WRITTEN_OFF";
  startDate: string;
  endDate: string;
  schedule: InstallmentScheduleItem[];
  guarantorIds: string[];
  recoveryOfficerId?: string;
  areaZone: string;
  contractVerified: boolean;
  tamperProofHash: string;
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