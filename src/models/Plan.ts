import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlanProductItem {
  id?: string;
  productId?: string;
  productTitle: string;
  imeiSerial?: string;
  quantity: number;
  cashPrice: number;
  installmentPrice: number;
  condition?: "NEW" | "USED_REFURBISHED" | "DEFECTIVE_DAMAGED";
  settledOrReturned?: boolean;
}

export interface IScheduleItem {
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
  clientUUID?: string;
}

export interface IPlan extends Document {
  id: string;
  planNumber: string;
  khataNumber?: string;
  tenantId: string;
  businessId?: string;
  customerId: string;
  customerName: string;
  customerCnic: string;
  customerPhone: string;
  salesmanName?: string;
  salesmanId?: string;
  productId: string;
  productTitle: string;
  imeiSerial: string;
  items?: IPlanProductItem[];
  cashPrice: number;
  downPayment: number;
  markupRatePct: number;
  totalMarkup: number;
  totalFinanced: number;
  durationMonths: number;
  totalInstallmentsCount?: number;
  installmentFrequency: "WEEKLY" | "TEN_DAYS" | "FIFTEEN_DAYS" | "MONTHLY";
  collectionIntervalDays?: number;
  collectionDayName?: string;
  monthlyInstallment: number;
  accumulatedShortArrears: number;
  status: "ACTIVE" | "COMPLETED" | "DEFAULTED" | "WRITTEN_OFF" | "DEFAULTED_REPOSSESSED" | "COMPLETED_EARLY_SETTLED";
  startDate: string;
  endDate: string;
  schedule: IScheduleItem[];
  guarantorIds: string[];
  recoveryOfficerId?: string;
  areaZone: string;
  contractVerified: boolean;
  repossessedRecordId?: string;
  settlementRecordId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlanProductItemSchema = new Schema<IPlanProductItem>({
  id: { type: String },
  productId: { type: String },
  productTitle: { type: String, required: true },
  imeiSerial: { type: String, default: "" },
  quantity: { type: Number, default: 1 },
  cashPrice: { type: Number, default: 0 },
  installmentPrice: { type: Number, default: 0 },
  condition: { type: String, enum: ["NEW", "USED_REFURBISHED", "DEFECTIVE_DAMAGED"], default: "NEW" },
  settledOrReturned: { type: Boolean, default: false },
});

const ScheduleItemSchema = new Schema<IScheduleItem>({
  installmentNo: { type: Number, required: true },
  dueDate: { type: String, required: true, index: true },
  principalDue: { type: Number, required: true },
  lateFee: { type: Number, default: 0 },
  shortArrears: { type: Number, default: 0 },
  totalDue: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  paidDate: { type: String },
  status: { type: String, enum: ["PENDING", "PAID", "SHORT_PAID", "OVERDUE"], default: "PENDING", index: true },
  collectedBy: { type: String },
  receiptId: { type: String },
  notes: { type: String },
  clientUUID: { type: String },
});

const PlanSchema = new Schema<IPlan>(
  {
    id: { type: String, required: true, unique: true, index: true },
    planNumber: { type: String, required: true, unique: true, index: true },
    khataNumber: { type: String, index: true },
    tenantId: { type: String, required: true, default: "tenant_chiniot", index: true },
    businessId: { type: String, default: "tenant_chiniot", index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true, index: true },
    customerCnic: { type: String, required: true, index: true },
    customerPhone: { type: String, required: true, index: true },
    salesmanName: { type: String },
    salesmanId: { type: String },
    productId: { type: String, required: true },
    productTitle: { type: String, required: true },
    imeiSerial: { type: String, default: "" },
    items: { type: [PlanProductItemSchema], default: [] },
    cashPrice: { type: Number, required: true },
    downPayment: { type: Number, required: true, default: 0 },
    markupRatePct: { type: Number, default: 0 },
    totalMarkup: { type: Number, default: 0 },
    totalFinanced: { type: Number, required: true },
    durationMonths: { type: Number, required: true },
    totalInstallmentsCount: { type: Number },
    installmentFrequency: { type: String, enum: ["WEEKLY", "TEN_DAYS", "FIFTEEN_DAYS", "MONTHLY"], default: "WEEKLY" },
    collectionIntervalDays: { type: Number, default: 7 },
    collectionDayName: { type: String, default: "" },
    monthlyInstallment: { type: Number, required: true },
    accumulatedShortArrears: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "DEFAULTED", "WRITTEN_OFF", "DEFAULTED_REPOSSESSED", "COMPLETED_EARLY_SETTLED"],
      default: "ACTIVE",
      index: true,
    },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    schedule: { type: [ScheduleItemSchema], default: [] },
    guarantorIds: { type: [String], default: [] },
    recoveryOfficerId: { type: String, index: true },
    areaZone: { type: String, required: true, index: true },
    contractVerified: { type: Boolean, default: true },
    repossessedRecordId: { type: String },
    settlementRecordId: { type: String },
  },
  {
    timestamps: true,
    collection: "installment_plans",
  }
);

export const Plan: Model<IPlan> =
  mongoose.models.Plan || mongoose.model<IPlan>("Plan", PlanSchema);

export default Plan;
