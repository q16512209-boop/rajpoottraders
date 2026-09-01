import crypto from "crypto";

export interface LedgerEntryPayload {
  id: string;
  tenantId: string;
  timestamp: string;
  type: "PAYMENT_IN" | "SHORT_PAYMENT" | "DOWN_PAYMENT" | "EXPENSE" | "HANDOVER_TRANSFER" | "INTERNAL_TRANSFER" | "BAD_DEBT_WRITE_OFF";
  amount: number;
  fromWallet?: string;
  toWallet?: string;
  planId?: string;
  customerId?: string;
  actorId: string;
  notes: string;
}

export interface ChainedLedgerBlock {
  index: number;
  id: string;
  timestamp: string;
  payload: LedgerEntryPayload;
  prevHash: string;
  hash: string;
  signature: string;
}

/**
 * Computes SHA-256 hash for a ledger block
 */
export function computeBlockHash(index: number, prevHash: string, payload: LedgerEntryPayload, timestamp: string): string {
  const rawString = `${index}|${prevHash}|${JSON.stringify(payload)}|${timestamp}`;
  return crypto.createHash("sha256").update(rawString).digest("hex");
}

/**
 * Verifies if an entire chain of ledger entries is intact and untampered
 */
export function verifyLedgerChain(chain: ChainedLedgerBlock[]): {
  isValid: boolean;
  tamperedIndex?: number;
  reason?: string;
} {
  if (chain.length === 0) return { isValid: true };

  // Genesis block check
  const genesis = chain[0];
  const expectedGenesisHash = computeBlockHash(genesis.index, genesis.prevHash, genesis.payload, genesis.timestamp);
  if (genesis.hash !== expectedGenesisHash) {
    return {
      isValid: false,
      tamperedIndex: 0,
      reason: `Genesis block hash mismatch! Found: ${genesis.hash}, Calculated: ${expectedGenesisHash}`,
    };
  }

  // Iterate over remaining chain
  for (let i = 1; i < chain.length; i++) {
    const current = chain[i];
    const prev = chain[i - 1];

    if (current.prevHash !== prev.hash) {
      return {
        isValid: false,
        tamperedIndex: i,
        reason: `Broken chain link at index ${i}: prevHash (${current.prevHash}) does not match previous block hash (${prev.hash})`,
      };
    }

    const calculatedHash = computeBlockHash(current.index, current.prevHash, current.payload, current.timestamp);
    if (current.hash !== calculatedHash) {
      return {
        isValid: false,
        tamperedIndex: i,
        reason: `Tampered block detected at index ${i}: Payload or metadata modified! Hash ${current.hash} vs ${calculatedHash}`,
      };
    }
  }

  return { isValid: true };
}
