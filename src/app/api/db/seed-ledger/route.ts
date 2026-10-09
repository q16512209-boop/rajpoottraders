import { NextResponse } from "next/server";
import { seedChiniotLedgerToMongo } from "@/lib/db/seed-chiniot-ledger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await seedChiniotLedgerToMongo();
    return NextResponse.json({
      success: true,
      message: "Chiniot Master Ledger successfully seeded to MongoDB Atlas.",
      audit: result,
    });
  } catch (error: any) {
    console.error("API Seed Ledger Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed ledger." },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
