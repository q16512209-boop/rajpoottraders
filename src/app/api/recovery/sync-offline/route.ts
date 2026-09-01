import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db/store";
import { OfflineCollectionItem } from "@/lib/db/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const batches: OfflineCollectionItem[] = body.batches || [];

    if (!Array.isArray(batches) || batches.length === 0) {
      return NextResponse.json(
        { success: false, error: "No offline collection batches provided." },
        { status: 400 }
      );
    }

    const syncResult = store.syncOfflineCollections(batches);

    return NextResponse.json({
      success: true,
      message: `${syncResult.syncedCount} of ${batches.length} offline collections processed cleanly.`,
      syncedCount: syncResult.syncedCount,
      totalAmountSynced: syncResult.totalAmount,
      results: syncResult.results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process offline sync." },
      { status: 500 }
    );
  }
}