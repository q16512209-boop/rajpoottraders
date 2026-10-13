import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConcessionRequest extends Document {
  id: string;
  tenantId: string;
  businessId?: string;
  planId: string;
  khataNumber?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  totalPrice: number;
  totalPaid: number;
  remainingBalance: number;
  discountAmount: number;
  reason: string;
  requestedBy: string;
  requestedById?: string;
  officerRole: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  reviewedBy?: string;
  reviewedById?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConcessionRequestSchema = new Schema<IConcessionRequest>(
  {
    id: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, default: "tenant_chiniot", index: true },
    businessId: { type: String, default: "tenant_chiniot", index: true },
    planId: { type: String, required: true, index: true },
    khataNumber: { type: String, index: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, default: "" },
    totalPrice: { type: Number, required: true },
    totalPaid: { type: Number, required: true },
    remainingBalance: { type: Number, required: true },
    discountAmount: { type: Number, required: true },
    reason: { type: String, required: true },
    requestedBy: { type: String, required: true },
    requestedById: { type: String, default: "" },
    officerRole: { type: String, default: "FIELD_RECOVERY" },
    status: {
      type: String,
      enum: ["PENDING_APPROVAL", "APPROVED", "REJECTED"],
      default: "PENDING_APPROVAL",
      index: true,
    },
    reviewedBy: { type: String },
    reviewedById: { type: String },
    reviewedAt: { type: String },
    rejectionReason: { type: String },
  },
  {
    timestamps: true,
    collection: "concession_requests",
  }
);

export const ConcessionRequest: Model<IConcessionRequest> =
  mongoose.models.ConcessionRequest || mongoose.model<IConcessionRequest>("ConcessionRequest", ConcessionRequestSchema);

export default ConcessionRequest;
