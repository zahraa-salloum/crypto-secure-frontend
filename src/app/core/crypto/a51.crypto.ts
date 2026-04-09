/**
 * A5/1 Stream Cipher Implementation (Client-Side)
 * 
 * WARNING: A5/1 is a deprecated algorithm with known security vulnerabilities.
 * This implementation is for EDUCATIONAL PURPOSES ONLY.
 * DO NOT use in production systems or for protecting sensitive data.
 * 
 * Known vulnerabilities:
 * - Key length only 64 bits (brute-force attacks)
 * - Correlation attacks on LFSR states
 * - Time-memory tradeoff attacks
 * - Various cryptanalytic attacks published
 * 
 * Usage: Educational demonstration of LFSR-based stream ciphers (GSM encryption)
 */

export class A51Crypto {
  private static readonly LFSR1_LENGTH = 19;
  private static readonly LFSR2_LENGTH = 22;
  private static readonly LFSR3_LENGTH = 23;
  
  /**
   * Encrypt plaintext using A5/1 algorithm
   * @param plaintext Text to encrypt
   * @param key Encryption key (8-16 characters for 64-128 bit key)
   * @returns Hex encoded ciphertext
   */
  static encrypt(plaintext: string, key: string): string {
    this.validateKey(key);
    
    const plaintextBytes = this.stringToBytes(plaintext);
    const keystream = this.generateKeystream(key, plaintextBytes.length);
    const ciphertext = this.xorBytes(plaintextBytes, keystream);
    
    return this.bytesToHex(ciphertext);
  }
  
  /**
   * Decrypt ciphertext using A5/1 algorithm
   * @param ciphertext Hex encoded ciphertext
   * @param key Decryption key
   * @returns Decrypted plaintext
   */
  static decrypt(ciphertext: string, key: string): string {
    this.validateKey(key);
    
    const ciphertextBytes = this.hexToBytes(ciphertext);
    const keystream = this.generateKeystream(key, ciphertextBytes.length);
    const plaintextBytes = this.xorBytes(ciphertextBytes, keystream);
    
    return this.bytesToString(plaintextBytes);
  }
  
  /**
   * Generate A5/1 keystream
   */
  private static generateKeystream(key: string, length: number): Uint8Array {
    // Initialize LFSRs with key
    const { lfsr1, lfsr2, lfsr3 } = this.initializeLFSRs(key);
    
    // Generate keystream
    const keystream = new Uint8Array(length);
    
    for (let i = 0; i < length; i++) {
      let byte = 0;
      
      // Generate 8 bits for each byte
      for (let bit = 0; bit < 8; bit++) {
        // Clock the LFSRs using majority rule
        this.clockMajority(lfsr1, lfsr2, lfsr3);
        
        // XOR output bits
        const outputBit = (lfsr1[18] ^ lfsr2[21] ^ lfsr3[22]) & 1;
        byte = (byte << 1) | outputBit;
      }
      
      keystream[i] = byte;
    }
    
    return keystream;
  }
  
  /**
   * Initialize three LFSRs with the key
   */
  private static initializeLFSRs(key: string): {
    lfsr1: number[];
    lfsr2: number[];
    lfsr3: number[];
  } {
    // Convert key to bits
    const keyBytes = this.stringToBytes(key);
    const keyBits: number[] = [];
    
    for (const byte of keyBytes) {
      for (let i = 7; i >= 0; i--) {
        keyBits.push((byte >> i) & 1);
      }
    }
    
    // Ensure we have at least 64 bits
    while (keyBits.length < 64) {
      keyBits.push(0);
    }
    
    // Initialize LFSRs with zeros
    const lfsr1 = new Array(this.LFSR1_LENGTH).fill(0);
    const lfsr2 = new Array(this.LFSR2_LENGTH).fill(0);
    const lfsr3 = new Array(this.LFSR3_LENGTH).fill(0);
    
    // Load key bits into LFSRs
    for (let i = 0; i < 64; i++) {
      const bit = keyBits[i];
      
      // XOR key bit into all LFSRs
      lfsr1[0] ^= bit;
      lfsr2[0] ^= bit;
      lfsr3[0] ^= bit;
      
      // Clock all LFSRs
      this.clockLFSR(lfsr1, 13, 16, 17, 18);
      this.clockLFSR(lfsr2, 20, 21);
      this.clockLFSR(lfsr3, 7, 20, 21, 22);
    }
    
    // Run mixing phase
    for (let i = 0; i < 100; i++) {
      this.clockMajority(lfsr1, lfsr2, lfsr3);
    }
    
    return { lfsr1, lfsr2, lfsr3 };
  }
  
  /**
   * Clock LFSR with feedback taps
   */
  private static clockLFSR(lfsr: number[], ...taps: number[]): void {
    // Calculate feedback bit
    let feedback = 0;
    for (const tap of taps) {
      feedback ^= lfsr[tap];
    }
    
    // Shift register
    for (let i = lfsr.length - 1; i > 0; i--) {
      lfsr[i] = lfsr[i - 1];
    }
    lfsr[0] = feedback;
  }
  
  /**
   * Clock LFSRs using majority rule
   */
  private static clockMajority(lfsr1: number[], lfsr2: number[], lfsr3: number[]): void {
    // Clocking taps (middle bits)
    const c1 = lfsr1[8];
    const c2 = lfsr2[10];
    const c3 = lfsr3[10];
    
    // Majority bit
    const majority = (c1 + c2 + c3) >= 2 ? 1 : 0;
    
    // Clock LFSRs if their clocking bit matches majority
    if (c1 === majority) {
      this.clockLFSR(lfsr1, 13, 16, 17, 18);
    }
    if (c2 === majority) {
      this.clockLFSR(lfsr2, 20, 21);
    }
    if (c3 === majority) {
      this.clockLFSR(lfsr3, 7, 20, 21, 22);
    }
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
    
    if (key.length < 8) {
      throw new Error('Key too short (minimum 8 characters for 64-bit key)');
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
   * Convert byte array to hex string
   */
  private static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  /**
   * Convert hex string to byte array
   */
  private static hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }
  
  /**
   * Generate random encryption key
   * @param length Key length in characters (default 16 for 128-bit key)
   */
  static generateKey(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    let key = '';
    for (let i = 0; i < length; i++) {
      key += chars[randomValues[i] % chars.length];
    }
    return key;
  }
}
