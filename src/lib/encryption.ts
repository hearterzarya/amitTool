import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.COOKIE_ENCRYPTION_KEY || 'default-secret-key-change-this';

export function encryptCookies(cookies: any[]): string {
  const jsonString = JSON.stringify(cookies);
  return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
}

export function decryptCookies(encrypted: string): any[] {
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to decrypt cookies:', error);
    return [];
  }
}
