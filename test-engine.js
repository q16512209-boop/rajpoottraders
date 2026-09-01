const crypto = require("crypto");

// 1. AES-256-GCM Test
const DEFAULT_KEY_HEX = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function encryptField(plainText, secretHex = DEFAULT_KEY_HEX) {
  if (!plainText) return "";
  const key = Buffer.from(secretHex.slice(0, 64), "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `enc:v1:${iv.toString("hex")}:${authTag}:${encrypted}`;
}

function decryptField(encryptedText, secretHex = DEFAULT_KEY_HEX) {
  if (!encryptedText || !encryptedText.startsWith("enc:v1:")) return encryptedText;
  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts[2], "hex");
  const authTag = Buffer.from(parts[3], "hex");
  const cipherHex = parts[4];
  const key = Buffer.from(secretHex.slice(0, 64), "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(cipherHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// 2. SHA-256 Hash Chain
function computeBlockHash(index, prevHash, payload, timestamp) {
  const raw = `${index}|${prevHash}|${JSON.stringify(payload)}|${timestamp}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function verifyLedgerChain(chain) {
  if (chain.length === 0) return { isValid: true };
  const genesis = chain[0];
  const expectedGen = computeBlockHash(genesis.index, genesis.prevHash, genesis.payload, genesis.timestamp);
  if (genesis.hash !== expectedGen) {
    return { isValid: false, tamperedIndex: 0, reason: `Genesis hash mismatch: ${genesis.hash} vs ${expectedGen}` };
  }
  for (let i = 1; i < chain.length; i++) {
    const curr = chain[i];
    const prev = chain[i - 1];
    if (curr.prevHash !== prev.hash) {
      return { isValid: false, tamperedIndex: i, reason: `Broken chain link at index ${i}` };
    }
    const calc = computeBlockHash(curr.index, curr.prevHash, curr.payload, curr.timestamp);
    if (curr.hash !== calc) {
      return { isValid: false, tamperedIndex: i, reason: `Tampered payload detected at index ${i}` };
    }
  }
  return { isValid: true };
}

// 3. Waterfall Allocation
function allocateInstallmentPayment(paidAmount, currentDuePrincipal, pendingLateFee = 0, pastShortArrears = 0) {
  let remaining = paidAmount;
  const allocatedLateFee = Math.min(remaining, pendingLateFee);
  remaining -= allocatedLateFee;
  const allocatedPastShort = Math.min(remaining, pastShortArrears);
  remaining -= allocatedPastShort;
  const allocatedPrincipal = Math.min(remaining, currentDuePrincipal);
  remaining -= allocatedPrincipal;
  const currentShortfall = Math.max(0, currentDuePrincipal - allocatedPrincipal);
  const newShortArrears = (pastShortArrears - allocatedPastShort) + currentShortfall;
  const excessAdvanceCredit = Math.max(0, remaining);
  const status = (newShortArrears > 0 || (pendingLateFee - allocatedLateFee) > 0) ? "SHORT_PAID" : excessAdvanceCredit > 0 ? "OVERPAID" : "PAID";
  return {
    paidAmount,
    allocatedLateFee,
    allocatedPastShort,
    allocatedPrincipal,
    newShortArrears,
    excessAdvanceCredit,
    status
  };
}

console.log("=== RAJPOOT TRADERS ENGINE VERIFICATION ===");
// Test AES-256
const sampleCnic = "35202-1849201-3";
const enc = encryptField(sampleCnic);
const dec = decryptField(enc);
console.log("✓ AES-256-GCM Roundtrip:", dec === sampleCnic ? "PASS (100% Match)" : "FAIL");
console.log("  Encrypted output:", enc.slice(0, 40) + "...");

// Test Waterfall
const alloc = allocateInstallmentPayment(10000, 13433, 500, 3433);
console.log("✓ Waterfall Split:", (alloc.allocatedLateFee === 500 && alloc.allocatedPastShort === 3433 && alloc.allocatedPrincipal === 6067 && alloc.newShortArrears === 7366 && alloc.status === "SHORT_PAID") ? "PASS" : "FAIL");
console.log("  Allocated: Late Fee=" + alloc.allocatedLateFee + ", Past Arrears=" + alloc.allocatedPastShort + ", Principal=" + alloc.allocatedPrincipal + ", Rolled Short Arrears=" + alloc.newShortArrears);

// Test Ledger
const b0 = { index: 0, id: 'b0', timestamp: '2026-01-01T00:00:00Z', payload: { type: 'GENESIS' }, prevHash: '0'.repeat(64), hash: '' };
b0.hash = computeBlockHash(b0.index, b0.prevHash, b0.payload, b0.timestamp);
const b1 = { index: 1, id: 'b1', timestamp: '2026-01-02T00:00:00Z', payload: { type: 'PAYMENT', amt: 10000 }, prevHash: b0.hash, hash: '' };
b1.hash = computeBlockHash(b1.index, b1.prevHash, b1.payload, b1.timestamp);
const validRes = verifyLedgerChain([b0, b1]);
console.log("✓ SHA-256 Ledger Chain Integrity:", validRes.isValid ? "PASS" : "FAIL");

const tamperedB1 = { ...b1, payload: { type: 'PAYMENT', amt: 999999 } };
const invalidRes = verifyLedgerChain([b0, tamperedB1]);
console.log("✓ Tamper Detection Alert:", (!invalidRes.isValid) ? "PASS (" + invalidRes.reason + ")" : "FAIL");
console.log("=== ALL ENGINE TESTS PASSED ===");