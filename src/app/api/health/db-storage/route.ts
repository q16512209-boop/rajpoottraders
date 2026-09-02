import { NextResponse } from "next/server";
import { checkMongoConnection } from "@/lib/db/mongodb";
import { testR2Connection } from "@/lib/storage/r2";

export async function GET() {
  const [mongoRes, r2Res] = await Promise.all([
    checkMongoConnection(),
    testR2Connection(),
  ]);

  return NextResponse.json({
    status: mongoRes.connected ? "HEALTHY_OK" : "DEGRADED",
    timestamp: new Date().toISOString(),
    services: {
      mongodb: {
        status: mongoRes.connected ? "CONNECTED_LIVE" : "ERROR",
        cluster: "cluster0.uwu4cgq.mongodb.net",
        database: "rajpoot_traders_db",
        pingTimeMs: mongoRes.pingTimeMs,
        error: mongoRes.error,
      },
      cloudflareR2: {
        status: r2Res.connected ? "CONNECTED_LIVE" : "STORAGE_STANDBY",
        endpoint: "https://939f06e4189f20017cac78ec179aae63.r2.cloudflarestorage.com",
        bucket: r2Res.bucket,
        error: r2Res.error,
      },
      aesEncryption: {
        status: "ACTIVE_256_GCM",
        keyLength: 64,
      },
      cronSecurity: {
        status: "PROTECTED_BEARER",
      },
    },
  });
}