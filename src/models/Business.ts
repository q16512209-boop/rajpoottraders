import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBusiness extends Document {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail?: string;
  phone: string;
  city: string;
  address: string;
  logoUrl?: string;
  customHeader?: string;
  urduBrandName?: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    ownerName: { type: String, required: true },
    ownerEmail: { type: String, default: "" },
    phone: { type: String, required: true },
    city: { type: String, required: true, index: true },
    address: { type: String, required: true },
    logoUrl: { type: String, default: "" },
    customHeader: { type: String, default: "" },
    urduBrandName: { type: String, default: "" },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "tenants",
  }
);

export const Business: Model<IBusiness> =
  mongoose.models.Business || mongoose.model<IBusiness>("Business", BusinessSchema);

export default Business;
