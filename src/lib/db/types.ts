export type UserRole =
  | "SUPER_ADMIN"     // Tier 0: Platform Super Admin / Main Boss
  | "OWNER"           // Tier 1: Shop / Trade Company Owner
  | "BRANCH_MANAGER"  // Tier 2: Branch Operations Manager
  | "FIELD_RECOVERY"  // Tier 3: Field Recovery Officer / Verifier
  | "CUSTOMER";       // Tier 4: Customer (Kharedar)

export interface Tenant {
  id: string;
  name: string;
  code: string;
  brandHeader: string;
  urduBrandName: string;
  contact: string;
  address: string;
  city: string;
  licenseTier: "ENTERPRISE" | "STANDARD" | "BRANCH";
  status: "ACTIVE" | "SUSPENDED";
}

export interface User {
  id: string;
  tenantId: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  branch: string;
  assignedArea?: string;
  avatar?: string;
  customerId?: string; // for customer self-service link
}

export interface Guarantor {
  id: string;
  fullName: string;
  fatherName: string;
  cnic: string; // AES-256 encrypted at rest
  phone: string;
  relation: string;
  address: string;
  workplace: string;
  landmark: string;
  photoUrl?: string;
  utilityBillUrl?: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  fullName: string;
  fatherName: string;
  cnic: string; // AES-256 encrypted at rest
  phone: string;
  secondaryPhone?: string;
  address: string;
  landmark: string;
  city: string;
  zoneArea: string; // e.g. "Route-A: Gulberg / Model Town"
  gpsCoords?: { lat: number; lng: number };
  photoUrl?: string;
  utilityBillUrl?: string;
  cnicFrontUrl?: string;
  cnicBackUrl?: string;
  guarantors: Guarantor[];
  riskScore: number; // 0-100 (0=safe, 100=extreme default risk)
  isDefaulter: boolean;
  defaulterReason?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  title: string;
  category: "SMARTPHONE" | "INVERTER_AC" | "SOLAR_SYSTEM" | "MOTORBIKE" | "HOME_APPLIANCE" | "LED_TV";
  brand: string;
  modelNumber: string;
  cashPrice: number;
  costPrice: number;
  stockQuantity: number;
  imeiSerialList: string[];
  image: string;
  specs: Record<string, string>;
  popularInstallmentPlans?: {
    months: number;
    advance: number;
    monthly: number;
  }[];
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
  status: "PAID" | "PENDING" | "OVERDUE" | "SHORT_PAID";
  receiptId?: string;
  collectedBy?: string;
  notes?: string;
}

export interface InstallmentPlan {
  id: string;
  planNumber: string; // e.g., "RT-2026-0881"
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

export type WalletType =
  | "OWNER_POCKET"        // Physical Cash with the Owner
  | "COUNTER_TILL"         // Cash at Sales Counter
  | "FIELD_IN_TRANSIT"     // Field Recovery Officers' in-transit cash
  | "DIGITAL_BANK";        // Bank / JazzCash / EasyPaisa

export interface WalletAccount {
  id: string;
  tenantId: string;
  type: WalletType;
  name: string;
  balance: number;
  accountNumber?: string;
  bankName?: string;
  officerId?: string; // if linked to specific recovery officer
  updatedAt: string;
}

export interface HandoverRequest {
  id: string;
  tenantId: string;
  officerId: string;
  officerName: string;
  requestedAmount: number;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  targetWalletId: string;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface ExpenseRecord {
  id: string;
  tenantId: string;
  category: "FUEL" | "SALARY" | "TEA_UTILITIES" | "VENDOR_STOCK" | "OWNER_DRAW" | "MISC";
  amount: number;
  fromWalletId: string;
  fromWalletName: string;
  loggedBy: string;
  date: string;
  description: string;
  receiptRef?: string;
}

export interface ArticlePost {
  slug: string;
  title: string;
  summary: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  content: string;
  tags: string[];
  schemaKeywords: string[];
}
