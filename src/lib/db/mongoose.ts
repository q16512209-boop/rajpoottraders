import mongoose from "mongoose";
import { getMongoUri } from "./mongodb";

declare global {
  var mongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

let cached = global.mongooseConn;

if (!cached) {
  cached = global.mongooseConn = { conn: null, promise: null };
}

export async function connectMongoose(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const uri = getMongoUri();
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      tlsAllowInvalidCertificates: true,
    };

    cached!.promise = mongoose.connect(uri, opts).then((m) => {
      console.log("[MongoDB Mongoose] Connected to Atlas cluster successfully.");
      return m;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    console.error("[MongoDB Mongoose] Connection error:", e);
    throw e;
  }

  return cached!.conn;
}

export default connectMongoose;
