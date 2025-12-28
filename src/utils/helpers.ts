export const generateUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const calculateLoyaltyTier = (points: number): string => {
    if (points >= 10000) return 'Platinum'; // $1000 spend
    if (points >= 5000) return 'Gold';      // $500 spend
    if (points >= 1000) return 'Silver';    // $100 spend
    return 'Bronze';
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
 * Normalizes Venezuelan phone numbers to a standard 10-digit format (e.g., 4121234567).
 * Removes prefixes like +58, 58, 0, and non-digit characters.
 */
export const normalizePhone = (phone: string): string => {
    // Remove all non-digits
    let digits = phone.replace(/\D/g, '');

    // If it starts with 58 (e.g. 58412...), remove it
    if (digits.startsWith('58') && digits.length > 10) {
        digits = digits.substring(2);
    }

    // If it starts with 0 (e.g. 0412...), remove it
    if (digits.startsWith('0') && digits.length > 10) {
        digits = digits.substring(1);
    }

    // Standard Venezuelan numbers are usually 10 digits (412-123-4567)
    // If we have more than 10, take the last 10
    if (digits.length > 10) {
        digits = digits.slice(-10);
    }

    return digits;
};
