/**
 * RC4 Stream Cipher Implementation (Client-Side)
 * 
 * WARNING: RC4 is a deprecated algorithm with known security vulnerabilities.
 * This implementation is for EDUCATIONAL PURPOSES ONLY.
 * DO NOT use in production systems or for protecting sensitive data.
 * 
 * Known vulnerabilities:
 * - Biased keystream output
 * - Related-key attacks
 * - Weak key combinations
 * - Distinguishing attacks on the keystream
 * 
 * Usage: Educational demonstration of stream cipher concepts
 */

export class RC4Crypto {
  /**
   * Encrypt plaintext using RC4 algorithm
   * @param plaintext Text to encrypt
   * @param key Encryption key (40-2048 bits recommended)
   * @returns Base64 encoded ciphertext
   */
  static encrypt(plaintext: string, key: string): string {
    this.validateKey(key);
    
    const plaintextBytes = this.stringToBytes(plaintext);
    const keystream = this.generateKeystream(key, plaintextBytes.length);
    const ciphertext = this.xorBytes(plaintextBytes, keystream);
    
    return this.bytesToBase64(ciphertext);
  }
  
  /**
   * Decrypt ciphertext using RC4 algorithm
   * @param ciphertext Base64 encoded ciphertext
   * @param key Decryption key
   * @returns Decrypted plaintext
   */
  static decrypt(ciphertext: string, key: string): string {
    this.validateKey(key);
    
    const ciphertextBytes = this.base64ToBytes(ciphertext);
    const keystream = this.generateKeystream(key, ciphertextBytes.length);
    const plaintextBytes = this.xorBytes(ciphertextBytes, keystream);
    
    return this.bytesToString(plaintextBytes);
  }
  
  /**
   * Generate RC4 keystream
   * @param key Encryption key
   * @param length Required keystream length
   * @returns Keystream bytes
   */
  private static generateKeystream(key: string, length: number): Uint8Array {
    // Initialize state array (S-box)
    const S = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      S[i] = i;
    }
    
    // Key-scheduling algorithm (KSA)
    const keyBytes = this.stringToBytes(key);
    const keyLength = keyBytes.length;
    let j = 0;
    
    for (let i = 0; i < 256; i++) {
      j = (j + S[i] + keyBytes[i % keyLength]) % 256;
      // Swap S[i] and S[j]
      [S[i], S[j]] = [S[j], S[i]];
    }
    
    // Pseudo-random generation algorithm (PRGA)
    const keystream = new Uint8Array(length);
    let i = 0;
    j = 0;
    
    for (let n = 0; n < length; n++) {
      i = (i + 1) % 256;
      j = (j + S[i]) % 256;
      
      // Swap S[i] and S[j]
      [S[i], S[j]] = [S[j], S[i]];
      
      // Generate keystream byte
      const K = S[(S[i] + S[j]) % 256];
      keystream[n] = K;
    }
    
    return keystream;
  }
  
  /**
   * XOR two byte arrays
   */
  private static xorBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
    const result = new Uint8Array(a.length);
    for (let i = 0; i < a.length; i++) {
      result[i] = a[i] ^ b[i];
    }
    return result;
  }
  
  /**
   * Validate encryption key
   */
  private static validateKey(key: string): void {
    if (!key || key.length === 0) {
      throw new Error('Encryption key is required');
    }
    
    if (key.length < 5) {
      throw new Error('Key too short (minimum 5 characters)');
    }
    
    if (key.length > 256) {
      throw new Error('Key too long (maximum 256 characters)');
    }
  }
  
  /**
   * Convert string to UTF-8 byte array
   */
  private static stringToBytes(str: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  }
  
  /**
   * Convert UTF-8 byte array to string
   */
  private static bytesToString(bytes: Uint8Array): string {
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }
  
  /**
   * Convert byte array to Base64 string
   */
  private static bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  /**
   * Convert Base64 string to byte array
   */
  private static base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  
  /**
   * Generate random encryption key
   * @param length Key length in characters (default 32)
   */
  static generateKey(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    let key = '';
    for (let i = 0; i < length; i++) {
      key += chars[randomValues[i] % chars.length];
    }
    return key;
  }
}
