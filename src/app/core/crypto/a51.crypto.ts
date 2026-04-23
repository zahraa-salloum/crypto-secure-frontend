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
   * @param key Encryption key (minimum 8 characters / 64 bits)
   * @param frameNumber 22-bit GSM frame number (0–4194303, default 0)
   * @returns Hex encoded ciphertext
   */
  static encrypt(plaintext: string, key: string, frameNumber: number = 0): string {
    this.validateKey(key);
    this.validateFrameNumber(frameNumber);
    
    const plaintextBytes = this.stringToBytes(plaintext);
    const keystream = this.generateKeystream(key, plaintextBytes.length, frameNumber);
    const ciphertext = this.xorBytes(plaintextBytes, keystream);
    
    return this.bytesToHex(ciphertext);
  }
  
  /**
   * Decrypt ciphertext using A5/1 algorithm
   * @param ciphertext Hex encoded ciphertext
   * @param key Decryption key
   * @param frameNumber 22-bit GSM frame number — must match the value used during encryption
   * @returns Decrypted plaintext
   */
  static decrypt(ciphertext: string, key: string, frameNumber: number = 0): string {
    this.validateKey(key);
    this.validateFrameNumber(frameNumber);
    
    const ciphertextBytes = this.hexToBytes(ciphertext);
    const keystream = this.generateKeystream(key, ciphertextBytes.length, frameNumber);
    const plaintextBytes = this.xorBytes(ciphertextBytes, keystream);
    
    return this.bytesToString(plaintextBytes);
  }
  
  /**
   * Generate A5/1 keystream
   * @param key Session key (Kc)
   * @param length Number of keystream bytes to produce
   * @param frameNumber 22-bit GSM frame number (COUNT)
   */
  static generateKeystream(key: string, length: number, frameNumber: number = 0): Uint8Array {
    // Initialize LFSRs with key and frame number (standard A5/1 procedure)
    const { lfsr1, lfsr2, lfsr3 } = this.initializeLFSRs(key, frameNumber);
    
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
   * Normalize any string key to exactly 8 bytes (64 bits) for A5/1.
   *
   * Strategy: XOR-fold all UTF-8 key bytes into an 8-byte window.
   * This ensures every byte of the input key contributes to the result,
   * regardless of the key's length, and always yields a full 64-bit value.
   *
   * Special case: if the key is already a 16-character hex string (as produced
   * by generateKey()), the hex bytes are decoded directly — no folding needed.
   */
  private static normalizeKeyTo8Bytes(key: string): Uint8Array {
    // Detect 16-char hex string (output of generateKey) and decode directly
    if (/^[0-9a-fA-F]{16}$/.test(key)) {
      const result = new Uint8Array(8);
      for (let i = 0; i < 8; i++) {
        result[i] = parseInt(key.slice(i * 2, i * 2 + 2), 16);
      }
      return result;
    }
    // For arbitrary string keys: XOR-fold all UTF-8 bytes into 8-byte block
    const keyBytes = this.stringToBytes(key);
    const result = new Uint8Array(8);   // zero-initialized
    for (let i = 0; i < keyBytes.length; i++) {
      result[i % 8] ^= keyBytes[i];     // every byte of the key contributes
    }
    return result;
  }

  /**
   * Initialize three LFSRs using the standard A5/1 procedure (GSM 03.20):
   *   Phase 1 – load 64-bit session key, clocking all registers unconditionally.
   *   Phase 2 – load 22-bit frame number, clocking all registers unconditionally.
   *   Phase 3 – 100 majority-clocked warm-up cycles (output discarded).
   *
   * Both key bits and frame-number bits are loaded LSB-first, as required by spec.
   */
  private static initializeLFSRs(key: string, frameNumber: number): {
    lfsr1: number[];
    lfsr2: number[];
    lfsr3: number[];
  } {
    // Normalize key to exactly 8 bytes, then expand to 64 bits LSB-first
    const normalizedKey = this.normalizeKeyTo8Bytes(key);
    const keyBits = new Array(64).fill(0);
    for (let b = 0; b < 8; b++) {
      for (let i = 0; i < 8; i++) {          // LSB-first: bit 0 before bit 7
        keyBits[b * 8 + i] = (normalizedKey[b] >> i) & 1;
      }
    }
    
    // Initialize all three registers to zero
    const lfsr1 = new Array(this.LFSR1_LENGTH).fill(0);
    const lfsr2 = new Array(this.LFSR2_LENGTH).fill(0);
    const lfsr3 = new Array(this.LFSR3_LENGTH).fill(0);
    
    // Phase 1: load 64-bit session key – XOR bit into R[0], then clock all three
    for (let i = 0; i < 64; i++) {
      const bit = keyBits[i];
      lfsr1[0] ^= bit;
      lfsr2[0] ^= bit;
      lfsr3[0] ^= bit;
      this.clockLFSR(lfsr1, 13, 16, 17, 18);
      this.clockLFSR(lfsr2, 20, 21);
      this.clockLFSR(lfsr3, 7, 20, 21, 22);
    }
    
    // Phase 2: load 22-bit frame number (LSB-first) – XOR bit into R[0], then clock all three
    for (let i = 0; i < 22; i++) {
      const bit = (frameNumber >> i) & 1;    // LSB-first
      lfsr1[0] ^= bit;
      lfsr2[0] ^= bit;
      lfsr3[0] ^= bit;
      this.clockLFSR(lfsr1, 13, 16, 17, 18);
      this.clockLFSR(lfsr2, 20, 21);
      this.clockLFSR(lfsr3, 7, 20, 21, 22);
    }
    
    // Phase 3: 100 warm-up clocks with majority rule; output is discarded
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
   * Validate encryption key.
   * Accepts either:
   *   - a 16-character hex string (e.g. from generateKey()) representing 8 raw bytes, or
   *   - any string of at least 8 characters (will be XOR-folded to 64 bits internally).
   */
  private static validateKey(key: string): void {
    if (!key || key.length === 0) {
      throw new Error('Encryption key is required');
    }
    
    if (key.length < 8) {
      throw new Error(
        'Key too short: provide a 16-character hex string (8 bytes / 64 bits) ' +
        'or any string of at least 8 characters'
      );
    }
  }
  
  /**
   * Validate that the frame number is a valid 22-bit unsigned integer (0–4194303)
   */
  private static validateFrameNumber(frameNumber: number): void {
    if (!Number.isInteger(frameNumber) || frameNumber < 0 || frameNumber > 0x3FFFFF) {
      throw new Error('Frame number must be an integer in the range 0–4194303 (22-bit)');
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
   * Generate a cryptographically secure random 64-bit A5/1 session key (Kc).
   *
   * Returns exactly 8 random bytes encoded as a 16-character lowercase hex string.
   * This is the canonical A5/1 key format and will be decoded directly (no folding)
   * by normalizeKeyTo8Bytes().
   */
  static generateKey(): string {
    const keyBytes = new Uint8Array(8);
    crypto.getRandomValues(keyBytes);
    return Array.from(keyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate a single 114-bit keystream burst for one GSM frame direction.
   *
   * Real A5/1 operates on 114-bit bursts (one TDMA frame, one direction).
   * This method mirrors that behavior exactly. Bits are packed MSB-first
   * within each output byte; the last 2 bits of byte 14 are always zero.
   *
   * @param key Session key (Kc) — 16-char hex string or 8+ char string
   * @param frameNumber 22-bit GSM frame number (0–4194303)
   * @returns Uint8Array of 15 bytes; only the first 114 bits are meaningful
   */
  static generateBurst(key: string, frameNumber: number = 0): Uint8Array {
    this.validateKey(key);
    this.validateFrameNumber(frameNumber);

    const { lfsr1, lfsr2, lfsr3 } = this.initializeLFSRs(key, frameNumber);

    const burst = new Uint8Array(15);  // 120 bits allocated; 114 bits used
    for (let bitIndex = 0; bitIndex < 114; bitIndex++) {
      this.clockMajority(lfsr1, lfsr2, lfsr3);
      const outputBit = (lfsr1[18] ^ lfsr2[21] ^ lfsr3[22]) & 1;
      // Pack MSB-first within each output byte
      const byteIndex = Math.floor(bitIndex / 8);
      const bitOffset = 7 - (bitIndex % 8);
      burst[byteIndex] |= (outputBit << bitOffset);
    }

    return burst;
  }
}
