import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInstallment extends Document {
  id: string;
  tenantId: string;
  businessId?: string;
  planId: string;
  planNumber: string;
  customerId: string;
  customerName: string;
  installmentNo: number;
  dueDate: string;
  expectedAmount: number;
  paidAmount: number;
  shortBalance: number;
  lateFee: number;
  status: "PAID" | "SHORT" | "OVERDUE" | "PENDING";
  paymentMethod: "CASH" | "BANK_TRANSFER" | "EASYPAISA_JAZZCASH" | "CHEQUE";
  receivedBy: string;
  receivedByName: string;
  receiptId: string;
  clientUUID?: string;
  notes?: string;
  paidDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InstallmentSchema = new Schema<IInstallment>(
  {
    id: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, default: "tenant_chiniot", index: true },
    businessId: { type: String, default: "tenant_chiniot", index: true },
    planId: { type: String, required: true, index: true },
    planNumber: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true, index: true },
    installmentNo: { type: Number, required: true },
    dueDate: { type: String, required: true, index: true },
    expectedAmount: { type: Number, required: true },
    paidAmount: { type: Number, required: true, default: 0 },
    shortBalance: { type: Number, required: true, default: 0 },
    lateFee: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PAID", "SHORT", "OVERDUE", "PENDING"],
      default: "PENDING",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "BANK_TRANSFER", "EASYPAISA_JAZZCASH", "CHEQUE"],
      default: "CASH",
    },
    receivedBy: { type: String, required: true, index: true },
    receivedByName: { type: String, required: true },
    receiptId: { type: String, required: true, index: true },
    clientUUID: { type: String, index: true, sparse: true },
    notes: { type: String, default: "" },
    paidDate: { type: String, index: true },
  },
  {
    timestamps: true,
    collection: "installments",
  }
);

export const Installment: Model<IInstallment> =
  mongoose.models.Installment || mongoose.model<IInstallment>("Installment", InstallmentSchema);

export default Installment;
