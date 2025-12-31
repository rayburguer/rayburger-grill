export const generateUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};


export const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Normalizes phone numbers to a standard format.
 * Defaults to Venezuela (+58) if no prefix is detected.
 * Returns only the significant digits (usually 10 for LatAm).
 */
export const normalizePhone = (phone: string): string => {
    if (!phone) return '';

    // Remove all non-digits
    let digits = phone.replace(/\D/g, '');

    // Common international prefixes: 58 (VE), 57 (CO), 1 (US), etc.
    // If it starts with 58, remove it to get the 10-digit base
    if (digits.startsWith('58') && (digits.length === 12 || digits.length === 13)) {
        digits = digits.substring(2);
    } else if (digits.startsWith('0') && digits.length > 10) {
        // Remove leading zero if it makes it longer than 10 digits
        digits = digits.substring(1);
    }

    // Capture only the last 10 digits as the core identifier for most LatAm/US numbers
    if (digits.length > 10) {
        digits = digits.slice(-10);
    }

    return digits;
};

/**
 * Generates a simple device fingerprint to prevent basic multi-account fraud.
 * Stores it in localStorage.
 */
export const getDeviceFingerprint = (): string => {
    let fp = localStorage.getItem('rb_device_fp');
    if (!fp) {
        fp = Array.from({ length: 16 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
        localStorage.setItem('rb_device_fp', fp);
    }
    return fp;
};
