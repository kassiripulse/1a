/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple secure salt used to mask and obfuscate values inside localStorage for WebView/PlayStore compliance.
const SEED_SALT = "DodoLivraisonBurkinaFaso2026_SecureKeySystem";

// Table of sensitive keys to map to anonymous codes to hinder automated memory-scraper/XSS scanner profiling.
const OBFUSCATED_KEYS: Record<string, string> = {
  DODO_SUPABASE_URL: "_d_sb_ep",
  DODO_SUPABASE_ANON_KEY: "_d_sb_ak",
  DODO_GEMINI_API_KEY: "_d_gm_api",
  DODO_RESEND_API_KEY: "_d_rs_api",
  DODO_BREVO_SMTP_KEY: "_d_bv_api",
  GOOGLE_MAPS_PLATFORM_KEY: "_d_gmaps_plat_key",
};

/**
 * Obfuscates a plaintext string using a character-wise XOR mask and Base64 wrapping.
 */
function encryptValue(value: string): string {
  if (!value) return "";
  let xorResult = "";
  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i) ^ SEED_SALT.charCodeAt(i % SEED_SALT.length);
    xorResult += String.fromCharCode(charCode);
  }
  return btoa(unescape(encodeURIComponent(xorResult)));
}

/**
 * Deobfuscates a masked Base64 string back into original plaintext format.
 */
function decryptValue(encoded: string): string {
  if (!encoded) return "";
  try {
    const rawXor = decodeURIComponent(escape(atob(encoded)));
    let result = "";
    for (let i = 0; i < rawXor.length; i++) {
      const charCode = rawXor.charCodeAt(i) ^ SEED_SALT.charCodeAt(i % SEED_SALT.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (error) {
    // Graceful fallback for malformed or legacy plaintext entries
    return encoded;
  }
}

export const secureStorage = {
  /**
   * Safe setItem implementation wrapping sensitive credentials.
   */
  setItem(key: string, value: string): void {
    if (value === null || value === undefined) {
      this.removeItem(key);
      return;
    }
    
    const mappedKey = OBFUSCATED_KEYS[key] || key;
    
    if (OBFUSCATED_KEYS[key]) {
      const obfuscatedValue = encryptValue(value);
      localStorage.setItem(mappedKey, "sec_v4:" + obfuscatedValue);
    } else {
      localStorage.setItem(mappedKey, value);
    }
  },

  /**
   * Safe getItem returning clear values, automatically migrating old keys on demand.
   */
  getItem(key: string): string | null {
    const mappedKey = OBFUSCATED_KEYS[key] || key;
    const item = localStorage.getItem(mappedKey);

    if (item === null) {
      // Legacy fallback: Check if key exists under the clear text name and auto-migrate it
      const legacyValue = localStorage.getItem(key);
      if (legacyValue !== null) {
        this.setItem(key, legacyValue);
        localStorage.removeItem(key);
        return legacyValue;
      }
      return null;
    }

    if (item.startsWith("sec_v4:")) {
      return decryptValue(item.substring(7));
    }

    return item;
  },

  /**
   * Secure removeItem clearing both modern obfuscated keys and legacy un-obfuscated values.
   */
  removeItem(key: string): void {
    const mappedKey = OBFUSCATED_KEYS[key] || key;
    localStorage.removeItem(mappedKey);
    localStorage.removeItem(key);
  }
};
