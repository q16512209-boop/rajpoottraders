import { NextRequest, NextResponse } from "next/server";
import { checkMongoConnection, getMongoUri } from "@/lib/db/mongodb";

export async function GET() {
  const result = await checkMongoConnection();
  return NextResponse.json({
    status: result.connected ? "CONNECTED_LIVE" : "AUTHENTICATION_OR_CONNECTION_ERROR",
    details: result,
  });
}
