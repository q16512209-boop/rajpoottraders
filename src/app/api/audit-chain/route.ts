import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";

export async function GET() {
  const verification = store.verifyChainIntegrity();
  const chain = store.getLedgerChain();

  return NextResponse.json({
    isValid: verification.isValid,
    tamperedIndex: verification.tamperedIndex,
    reason: verification.reason,
    totalBlocks: chain.length,
    latestBlockHash: chain[chain.length - 1]?.hash,
  });
}