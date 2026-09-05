import { NextRequest, NextResponse } from "next/server";
import { setCustomMongoUri, checkMongoConnection } from "@/lib/db/mongodb";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { mongoUri } = await req.json();
    if (!mongoUri || typeof mongoUri !== "string" || !mongoUri.startsWith("mongodb")) {
      return NextResponse.json({ success: false, error: "Valid MongoDB connection string required (e.g. mongodb+srv://...)" }, { status: 400 });
    }

    setCustomMongoUri(mongoUri);
    const testResult = await checkMongoConnection();

    if (!testResult.connected) {
      return NextResponse.json({
        success: false,
        connected: false,
        error: `Connection test failed: ${testResult.error}`,
      }, { status: 400 });
    }

    // Try updating .env.local on disk if in local environment
    try {
      const envPath = path.resolve(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, "utf8");
        envContent = envContent.replace(/MONGODB_URI=.*/g, `MONGODB_URI="${mongoUri}"`);
        envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${mongoUri}"`);
        fs.writeFileSync(envPath, envContent, "utf8");
      }
    } catch (e) {
      console.warn("Could not write .env.local file:", e);
    }

    return NextResponse.json({
      success: true,
      connected: true,
      message: "MongoDB connection string updated and verified successfully!",
      details: testResult,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to update MongoDB config" }, { status: 500 });
  }
}
