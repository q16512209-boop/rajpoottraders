import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  id: string;
  tenantId: string;
  businessId?: string;
  name: string;
  email: string;
  password?: string;
  role: "SUPER_ADMIN" | "OWNER" | "BRANCH_MANAGER" | "FIELD_RECOVERY" | "CUSTOMER";
  phone: string;
  avatar?: string;
  assignedRouteZone?: string;
  customerId?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    id: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    businessId: { type: String, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "FIELD_RECOVERY", "CUSTOMER"],
      default: "BRANCH_MANAGER",
      index: true,
    },
    phone: { type: String, required: true },
    avatar: { type: String, default: "" },
    assignedRouteZone: { type: String, default: "" },
    customerId: { type: String, default: "" },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default UserModel;
