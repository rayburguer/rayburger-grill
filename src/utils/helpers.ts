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
