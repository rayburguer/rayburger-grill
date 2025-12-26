import { useCallback } from 'react';
import { User, Order, CartItem } from '../types';
import { POINTS_TIER_RATES, REFERRAL_CASHBACK_RATE, ROULETTE_COOLDOWN_DAYS, ROULETTE_PRIZES, RoulettePrize } from '../config/constants';
import { calculateLoyaltyTier, generateUuid } from '../utils/helpers';

interface ProcessOrderResult {
    updatedUsers: User[];
    orderSummary: {
        pointsEarned: number;
        referrerCashback: number; // Cashback en $ para el referidor
    };
}

export const useLoyalty = () => {

    // NUEVO: Calcula puntos como % del monto según tier, con soporte para Multiplicador
    const calculateRewards = (totalUsd: number, currentTier: string, multiplier: number = 1) => {
        let rate = POINTS_TIER_RATES.Bronze; // 3% default
        if (currentTier === 'Silver') rate = POINTS_TIER_RATES.Silver; // 5%
        if (currentTier === 'Gold') rate = POINTS_TIER_RATES.Gold; // 8%

        // Puntos = monto × tasa × 100 (para convertir a puntos enteros) × Multiplicador
        const points = Math.floor(totalUsd * rate * 100 * multiplier);
        return { points };
    };

    // 1. Calculate and Create PENDING Order (No points added yet)
    const processOrderRewards = useCallback((
        buyerEmail: string,
        cartItems: CartItem[],
        totalUsd: number,
        allUsers: User[],
        deliveryInfo?: { method: 'delivery' | 'pickup', fee: number, phone: string }
    ): ProcessOrderResult | null => {

        const buyer = allUsers.find(u => u.email === buyerEmail);
        if (!buyer) return null;

        const tierAtPurchase = buyer.loyaltyTier || 'Bronze';
        // Check for retention multiplier
        const multiplier = buyer.nextPurchaseMultiplier || 1;

        let { points } = calculateRewards(totalUsd, tierAtPurchase, multiplier);

        // REGLA DE HONESTIDAD: El Administrador NO gana puntos por sus propias compras
        if (buyer.role === 'admin') {
            points = 0;
        }

        // NUEVO: Referidor solo gana CASHBACK (2% del monto)
        let referrerBonusCashback = 0;
        if (buyer.referredByCode) {
            const referrer = allUsers.find(u => u.referralCode === buyer.referredByCode);
            if (referrer) {
                referrerBonusCashback = totalUsd * REFERRAL_CASHBACK_RATE;
            }
        }

        // Create Order Record with PENDING status
        const newOrder: Order = {
            orderId: generateUuid(),
            timestamp: Date.now(),
            totalUsd: totalUsd + (deliveryInfo?.fee || 0),
            items: cartItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price_usd: item.finalPrice_usd,
                selectedOptions: item.selectedOptions // Persistir personalizaciones
            })),
            pointsEarned: points,
            referrerPointsEarned: 0,
            level2ReferrerPointsEarned: 0,
            status: 'pending',
            deliveryMethod: deliveryInfo?.method || 'pickup',
            deliveryFee: deliveryInfo?.fee || 0,
            customerName: buyer.name,
            customerPhone: deliveryInfo?.phone || buyer.phone
        };

        // IMMUTABLE UPDATE
        const updatedUsers = allUsers.map(u => {
            if (u.email === buyerEmail) {
                return { ...u, orders: [...u.orders, newOrder] };
            }
            return u;
        });

        return {
            updatedUsers,
            orderSummary: {
                pointsEarned: points,
                referrerCashback: referrerBonusCashback,
            }
        };

    }, []);

    // 2. Approve Order (Actually apply points/cashback)
    const confirmOrderRewards = useCallback((
        orderId: string,
        buyerEmail: string,
        allUsers: User[]
    ): User[] => {
        // Find specific buyer and order without cloning the whole world
        const buyer = allUsers.find(u => u.email === buyerEmail);
        if (!buyer) return allUsers;

        const order = buyer.orders.find(o => o.orderId === orderId);
        if (!order || order.status === 'approved' || order.status === 'delivered') {
            return allUsers;
        }

        return allUsers.map(u => {
            // Case 1: Update the Buyer
            if (u.email === buyerEmail) {
                const updatedOrders = u.orders.map(o => o.orderId === orderId ? { ...o, status: 'approved' as const } : o);
                const newPoints = u.points + order.pointsEarned;
                return {
                    ...u,
                    points: newPoints,
                    orders: updatedOrders,
                    nextPurchaseMultiplier: 1, // Consume multiplier
                    loyaltyTier: calculateLoyaltyTier(newPoints)
                };
            }

            // Case 2: Update the Referrer (if any)
            if (buyer.referredByCode && u.referralCode === buyer.referredByCode && u.role !== 'admin') {
                const referrerCashback = order.totalUsd * REFERRAL_CASHBACK_RATE;
                const previouslyApprovedOrders = buyer.orders.filter(o => o.orderId !== orderId && o.status === 'approved');
                const isFirstApprovedPurchase = previouslyApprovedOrders.length === 0;

                const newStats = { ...(u.referralStats || { totalReferred: 0, referredThisMonth: 0, referredToday: 0 }) };
                if (isFirstApprovedPurchase) newStats.totalReferred += 1;

                return {
                    ...u,
                    cashbackBalance_usd: (u.cashbackBalance_usd || 0) + referrerCashback,
                    referralStats: newStats
                };
            }

            return u;
        });
    }, []);

    // 3. Reject Order
    const rejectOrder = useCallback((orderId: string, buyerEmail: string, allUsers: User[]) => {
        return allUsers.map(u => {
            if (u.email === buyerEmail) {
                return {
                    ...u,
                    orders: u.orders.map(o => o.orderId === orderId ? { ...o, status: 'rejected' as const } : o)
                };
            }
            return u;
        });
    }, []);

    // 4. Roulette Logic
    const canSpin = useCallback((user: User): boolean => {
        if (!user.lastSpinDate) return true;

        const lastSpin = new Date(user.lastSpinDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastSpin.getTime());
        // diffDays removed as it was unused and causing lint warning.

        // Fix: Math.ceil of (0) is 0. If diff is 0ms, it is 0 days. 
        // Logic: if diffTime < 7 days in ms, false.
        const cooldownMs = ROULETTE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
        return diffTime >= cooldownMs;
    }, []);

    const spinRoulette = useCallback((user: User): { result: RoulettePrize, updatedUser: User } => {
        if (!canSpin(user)) {
            throw new Error('Cooldown active');
        }

        // Weighted Random Selection
        const random = Math.random() * 100;
        let cumulativeProbability = 0;
        let selectedPrize: RoulettePrize = ROULETTE_PRIZES[0];

        for (const prize of ROULETTE_PRIZES) {
            cumulativeProbability += prize.probability;
            if (random <= cumulativeProbability) {
                selectedPrize = prize;
                break;
            }
        }

        // Update User
        // Create a deep copy to return new state, but component handles state update usually?
        // Hook returns updatedUser object, consumer must update it in state/context.
        let updatedUser = { ...user, lastSpinDate: Date.now() };

        if (selectedPrize.type === 'points') {
            updatedUser.points = (updatedUser.points || 0) + selectedPrize.value;
            updatedUser.loyaltyTier = calculateLoyaltyTier(updatedUser.points);
        } else if (selectedPrize.type === 'cashback') {
            updatedUser.cashbackBalance_usd = (updatedUser.cashbackBalance_usd || 0) + selectedPrize.value;
        }

        return { result: selectedPrize, updatedUser };
    }, [canSpin]);

    return {
        processOrderRewards,
        confirmOrderRewards,
        rejectOrder,
        canSpin,
        spinRoulette
    };
};
