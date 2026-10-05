import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICashLedger extends Document {
  id: string;
  tenantId: string;
  businessId?: string;
  walletType: "OWNER_POCKET" | "BRANCH_TILL" | "FIELD_IN_TRANSIT" | "BANK";
  amount: number;
  flowType: "IN" | "OUT";
  source: "INSTALLMENT_COLLECTION" | "DOWN_PAYMENT" | "HANDOVER_TRANSFER" | "EXPENSE_PAYMENT" | "SETTLEMENT" | "OWNER_DRAW" | "INITIAL_BALANCE";
  handoverStatus: "PENDING" | "APPROVED" | "REJECTED" | "DIRECT_POSTED";
  handledBy: string;
  handledByName: string;
  referenceId?: string;
  planId?: string;
  receiptId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CashLedgerSchema = new Schema<ICashLedger>(
  {
    id: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, default: "tenant_chiniot", index: true },
    businessId: { type: String, default: "tenant_chiniot", index: true },
    walletType: {
      type: String,
      enum: ["OWNER_POCKET", "BRANCH_TILL", "FIELD_IN_TRANSIT", "BANK"],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    flowType: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: [
        "INSTALLMENT_COLLECTION",
        "DOWN_PAYMENT",
        "HANDOVER_TRANSFER",
        "EXPENSE_PAYMENT",
        "SETTLEMENT",
        "OWNER_DRAW",
        "INITIAL_BALANCE",
      ],
      required: true,
      index: true,
    },
    handoverStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "DIRECT_POSTED"],
      default: "DIRECT_POSTED",
      index: true,
    },
    handledBy: { type: String, required: true, index: true },
    handledByName: { type: String, required: true },
    referenceId: { type: String, index: true },
    planId: { type: String, index: true },
    receiptId: { type: String, index: true },
    notes: { type: String, default: "" },
  },
  {
    timestamps: true,
    collection: "cash_ledgers",
  }
);

export const CashLedger: Model<ICashLedger> =
  mongoose.models.CashLedger || mongoose.model<ICashLedger>("CashLedger", CashLedgerSchema);

export default CashLedger;
