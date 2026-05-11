import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.CRYPTO_SECRET_KEY ?? '';

/**
 * 데이터 암호화
 */
export function encrypt(data: string): string {
  try {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return data;
  }
}

/**
 * 데이터 복호화
 */
export function decrypt(encryptedData: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData;
  }
}

/**
 * 객체 암호화
 */
export function encryptObject(obj: any): string {
  try {
    const jsonString = JSON.stringify(obj);
    return encrypt(jsonString);
  } catch (error) {
    console.error('Object encryption error:', error);
    return '';
  }
}

/**
 * 객체 복호화
 */
export function decryptObject<T>(encryptedData: string): T | null {
  try {
    const decrypted = decrypt(encryptedData);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error('Object decryption error:', error);
    return null;
  }
}

/**
 * Storage key 해싱 (deterministic)
 */
export function hashStorageKey(storeName: string): string {
  return CryptoJS.SHA256(`${storeName}_${SECRET_KEY}`).toString().substring(0, 32);
}
