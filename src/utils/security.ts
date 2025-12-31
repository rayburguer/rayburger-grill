/**
 * Security utilities for Ray Burger Grill
 * Standards: SHA-256 for password hashing
 */

/**
 * Hashes a text string using SHA-256 (Web Crypto API)
 * @param text The plain text to hash
 * @returns Hexadecimal string of the hash
 */
export async function hashPassword(text: string): Promise<string> {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
        console.warn('⚠️ Crypto API no disponible (¿Conexión no segura?). Usando modo fallback.');
        return `legacy_${text}`;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Checks if a stored password is likely a legacy plaintext password.
 * Heuristic: Real SHA-256 hashes are 64 characters long and hex only.
 * Simple passwords like "123456" or "password" won't match this.
 */
export function isLegacyPassword(password: string): boolean {
    const isHex = /^[0-9a-fA-F]{64}$/.test(password);
    return !isHex;
}
