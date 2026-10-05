import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGuarantor {
  id?: string;
  fullName: string;
  fatherName?: string;
  cnic: string;
  phone: string;
  relation: string;
  address: string;
  workplace?: string;
  landmark?: string;
}

export interface IGPSLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
  mapUrl?: string;
  detectedAt?: string;
}

export interface ICustomer extends Document {
  id: string;
  tenantId: string;
  businessId?: string;
  fullName: string;
  fatherName: string;
  cnic: string;
  phone: string;
  secondaryPhone?: string;
  address: string;
  landmark?: string;
  city: string;
  zoneArea: string;
  photoUrl?: string;
  gpsLocation?: IGPSLocation;
  guarantors: IGuarantor[];
  riskScore: number;
  isDefaulter: boolean;
  defaulterReason?: string;
  status: "ACTIVE" | "INACTIVE" | "BLACKLISTED";
  createdAt: Date;
  updatedAt: Date;
}

const GuarantorSchema = new Schema<IGuarantor>({
  id: { type: String },
  fullName: { type: String, required: true },
  fatherName: { type: String, default: "" },
  cnic: { type: String, required: true },
  phone: { type: String, required: true },
  relation: { type: String, required: true },
  address: { type: String, required: true },
  workplace: { type: String, default: "" },
  landmark: { type: String, default: "" },
});

const GPSLocationSchema = new Schema<IGPSLocation>({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  accuracy: { type: Number, default: 0 },
  address: { type: String, default: "" },
  mapUrl: { type: String, default: "" },
  detectedAt: { type: String, default: () => new Date().toISOString() },
});

const CustomerSchema = new Schema<ICustomer>(
  {
    id: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, default: "tenant_chiniot", index: true },
    businessId: { type: String, default: "tenant_chiniot", index: true },
    fullName: { type: String, required: true, trim: true, index: true },
    fatherName: { type: String, required: true, trim: true },
    cnic: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true, index: true },
    secondaryPhone: { type: String, default: "" },
    address: { type: String, required: true },
    landmark: { type: String, default: "" },
    city: { type: String, default: "Chiniot", index: true },
    zoneArea: { type: String, required: true, index: true },
    photoUrl: { type: String, default: "" },
    gpsLocation: { type: GPSLocationSchema, default: null },
    guarantors: { type: [GuarantorSchema], default: [] },
    riskScore: { type: Number, default: 100 },
    isDefaulter: { type: Boolean, default: false, index: true },
    defaulterReason: { type: String, default: "" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "BLACKLISTED"], default: "ACTIVE" },
  },
  {
    timestamps: true,
    collection: "customers",
  }
);

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);

export default Customer;
