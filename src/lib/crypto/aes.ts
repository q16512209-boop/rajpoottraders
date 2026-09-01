import crypto from "crypto";

// Fallback / default secret key for tenant field encryption (AES-256-GCM)
const DEFAULT_KEY_HEX = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

/**
 * Encrypt sensitive customer/guarantor field (CNIC, phone, bank account, address)
 * Output format: "enc:v1:<iv_hex>:<authTag_hex>:<cipher_hex>"
 */
export function encryptField(plainText: string, secretHex: string = DEFAULT_KEY_HEX): string {
  if (!plainText) return "";
  try {
    const key = Buffer.from(secretHex.slice(0, 64), "hex");
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    
    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    return `enc:v1:${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("AES encryption error:", err);
    return plainText;
  }
}

/**
 * Decrypt field encrypted with AES-256-GCM
 */
export function decryptField(encryptedText: string, secretHex: string = DEFAULT_KEY_HEX): string {
  if (!encryptedText || !encryptedText.startsWith("enc:v1:")) {
    return encryptedText; // return as-is if unencrypted
  }
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 5) return encryptedText;
    
    const iv = Buffer.from(parts[2], "hex");
    const authTag = Buffer.from(parts[3], "hex");
    const cipherHex = parts[4];
    const key = Buffer.from(secretHex.slice(0, 64), "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(cipherHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.warn("AES decryption fallback (key mismatch or corrupted):", err);
    return "[ENCRYPTED DATA]";
  }
}

/**
 * Mask CNIC for safe display (e.g. "35201-1234567-1" -> "35201-*****67-1")
 */
export function maskCnic(cnic: string): string {
  const clean = cnic.replace(/[^0-9]/g, "");
  if (clean.length !== 13) return cnic;
  const p1 = clean.substring(0, 5);
  const p2 = clean.substring(5, 12);
  const p3 = clean.substring(12, 13);
  const maskedP2 = p2.substring(0, 2) + "*****" + p2.substring(p2.length - 2);
  return `${p1}-${maskedP2}-${p3}`;
}
