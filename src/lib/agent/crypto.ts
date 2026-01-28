/**
 * Encryption utilities for API key storage
 *
 * Uses AES-256-GCM for authenticated encryption.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt,
} from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Encrypt a plaintext string using AES-256-GCM
 */
export async function encrypt(
  plaintext: string,
  masterKey: string
): Promise<string> {
  // Generate random salt and IV
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  // Derive key from master key
  const key = (await scryptAsync(masterKey, salt, KEY_LENGTH)) as Buffer;

  // Encrypt
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Combine: salt + iv + authTag + encrypted
  const combined = Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'hex'),
  ]);

  return combined.toString('base64');
}

/**
 * Decrypt an encrypted string using AES-256-GCM
 */
export async function decrypt(
  encryptedData: string,
  masterKey: string
): Promise<string> {
  const combined = Buffer.from(encryptedData, 'base64');

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = combined.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const encrypted = combined.subarray(
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );

  // Derive key
  const key = (await scryptAsync(masterKey, salt, KEY_LENGTH)) as Buffer;

  // Decrypt
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a secure random encryption key
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('base64');
}
