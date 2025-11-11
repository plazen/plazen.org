import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// Ensure the key is valid
let KEY: Buffer;
if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 64) {
  console.error(
    "ENCRYPTION_KEY is not set or is not a 64-character hex string."
  );
  // Use a dummy key in case of error, but log it. This prevents crashes.
  // In a real production environment, you might want to throw an error instead.
  KEY = Buffer.alloc(32); // Creates a 32-byte buffer of zeros
} else {
  KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
}

/**
 * Encrypts a plaintext string.
 * @param text The plaintext string to encrypt.
 * @returns A string in the format "iv:authTag:content" or the original text if encryption fails.
 */
export function encrypt(text: string): string {
  if (!text) return text;
  if (!KEY) {
    console.error("Encryption key is not available.");
    return text;
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    // Store iv, authTag, and content together, separated by colons
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    return text; // Fallback to plaintext if encryption fails
  }
}

/**
 * Decrypts an encrypted hash.
 * @param hash The encrypted string in "iv:authTag:content" format.
 * @returns The decrypted plaintext string, or the original hash if decryption fails.
 */
export function decrypt(hash: string): string {
  if (!hash) return hash;
  if (!KEY) {
    console.error("Decryption key is not available.");
    return "[Key Error]";
  }

  try {
    const parts = hash.split(":");

    // If it's not in our format (e.g., old data), return it as-is.
    if (parts.length !== 3) {
      return hash;
    }

    const [ivHex, authTagHex, encryptedText] = parts;

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    // This can happen for old data that coincidentally has colons,
    // or if the key is wrong, or data is corrupt.
    console.warn("Decryption failed, returning original text. Error:", error);
    return hash; // Return the original text if decryption fails
  }
}
