import { NextRequest, NextResponse } from "next/server";
import { getDatabase, checkMongoConnection } from "@/lib/db/mongodb";

const COLLECTION_MAP: { [key: string]: string } = {
  customers: "customers",
  plans: "installment_plans",
  users: "users",
  products: "products",
  wallets: "wallets",
  handovers: "handovers",
  expenses: "expenses",
  routeZones: "route_zones",
  claimRequests: "claim_requests",
  repossessions: "repossessions",
  settlements: "settlements",
  ptpLogs: "ptp_logs",
  articles: "articles",
  ledgerChain: "ledger_chain",
};

// GET: Fetch all collections from MongoDB
export async function GET(req: NextRequest) {
  try {
    const connection = await checkMongoConnection();
    if (!connection.connected) {
      return NextResponse.json({
        success: false,
        connected: false,
        error: connection.error || "MongoDB not reachable",
        data: null,
      }, { status: 503 });
    }

    const db = await getDatabase();
    const result: { [key: string]: any[] } = {};

    for (const [storeKey, colName] of Object.entries(COLLECTION_MAP)) {
      try {
        const docs = await db.collection(colName).find({}).toArray();
        // Remove MongoDB internal _id before returning to match frontend types
        result[storeKey] = docs.map(({ _id, ...rest }) => rest);
      } catch (colErr) {
        result[storeKey] = [];
      }
    }

    return NextResponse.json({
      success: true,
      connected: true,
      timestamp: new Date().toISOString(),
      counts: Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v.length])),
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      connected: false,
      error: err.message || "Failed to fetch live database records",
    }, { status: 500 });
  }
}

// POST: Upsert single document or bulk push to MongoDB
export async function POST(req: NextRequest) {
  try {
    const connection = await checkMongoConnection();
    if (!connection.connected) {
      return NextResponse.json({
        success: false,
        connected: false,
        error: `MongoDB Atlas connection unavailable: ${connection.error}. Please verify database user credentials in Data Management.`,
      }, { status: 503 });
    }

    const db = await getDatabase();
    const body = await req.json();

    const { action, collection, data, fullStore } = body;

    // Mode A: Full Store Dump / Bulk Seed
    if (action === "FULL_SYNC" && fullStore) {
      const stats: { [key: string]: number } = {};
      for (const [storeKey, colName] of Object.entries(COLLECTION_MAP)) {
        const items = fullStore[storeKey];
        if (Array.isArray(items) && items.length > 0) {
          const col = db.collection(colName);
          for (const item of items) {
            const id = item.id || item.planNumber || item.cnic || item.hash;
            if (id) {
              await col.replaceOne({ id }, item, { upsert: true });
            }
          }
          stats[colName] = items.length;
        }
      }
      return NextResponse.json({
        success: true,
        message: "Full database state synchronized to MongoDB Atlas.",
        syncedStats: stats,
      });
    }

    // Mode B: Single Entity Upsert
    const colName = COLLECTION_MAP[collection] || collection;
    if (!colName) {
      return NextResponse.json({ success: false, error: "Invalid collection specified" }, { status: 400 });
    }

    const targetCol = db.collection(colName);

    if (action === "UPSERT") {
      const id = data.id || data.planNumber || data.cnic || data.hash;
      if (!id) {
        return NextResponse.json({ success: false, error: "Document must contain an 'id' or primary key" }, { status: 400 });
      }

      const res = await targetCol.replaceOne({ id }, data, { upsert: true });
      return NextResponse.json({
        success: true,
        action: "UPSERT",
        collection: colName,
        id,
        upsertedId: res.upsertedId,
        modifiedCount: res.modifiedCount,
      });
    }

    if (action === "DELETE") {
      const id = data.id;
      if (!id) return NextResponse.json({ success: false, error: "Document id required" }, { status: 400 });
      const res = await targetCol.deleteOne({ id });
      return NextResponse.json({ success: true, action: "DELETE", deletedCount: res.deletedCount });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to persist record to MongoDB",
    }, { status: 500 });
  }
}
