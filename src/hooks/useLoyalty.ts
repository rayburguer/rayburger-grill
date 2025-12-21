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

    // NUEVO: Calcula puntos como % del monto según tier
    const calculateRewards = (totalUsd: number, currentTier: string) => {
        let rate = POINTS_TIER_RATES.Bronze; // 3% default
        if (currentTier === 'Silver') rate = POINTS_TIER_RATES.Silver; // 5%
        if (currentTier === 'Gold') rate = POINTS_TIER_RATES.Gold; // 8%

        // Puntos = monto × tasa × 100 (para convertir a puntos enteros)
        // Ejemplo: $10 × 0.03 × 100 = 30 puntos (3% de $10 = $0.30 = 30 pts)
        const points = Math.floor(totalUsd * rate * 100);
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

        // Deep copy
        let users = JSON.parse(JSON.stringify(allUsers)) as User[];
        const buyerIndex = users.findIndex(u => u.email === buyerEmail);

        // Guest Flow (Simplified)
        if (buyerIndex === -1) {
            return null;
        }

        let buyer = users[buyerIndex];
        const tierAtPurchase = buyer.loyaltyTier || 'Bronze';
        const { points } = calculateRewards(totalUsd, tierAtPurchase);

        // NUEVO: Referidor solo gana CASHBACK (2% del monto)
        // Ya NO gana puntos por traer amigos
        let referrerBonusCashback = 0;

        if (buyer.referredByCode) {
            const referrerIndex = users.findIndex(u => u.referralCode === buyer.referredByCode);
            if (referrerIndex > -1) {
                referrerBonusCashback = totalUsd * REFERRAL_CASHBACK_RATE; // 2% del monto total
            }
        }

        // Create Order Record with PENDING status
        const newOrder: Order = {
            orderId: generateUuid(),
            timestamp: Date.now(),
            totalUsd: totalUsd + (deliveryInfo?.fee || 0),
            items: cartItems.map(item => ({ name: item.name, quantity: item.quantity, price_usd: item.finalPrice_usd })),
            pointsEarned: points,
            referrerPointsEarned: 0, // Ya no damos puntos a referidores
            level2ReferrerPointsEarned: 0,
            status: 'pending',
            deliveryMethod: deliveryInfo?.method || 'pickup',
            deliveryFee: deliveryInfo?.fee || 0,
            customerName: buyer.name,
            customerPhone: deliveryInfo?.phone || buyer.phone
        };

        buyer.orders.push(newOrder); // Add order to history but don't give points yet
        users[buyerIndex] = buyer;

        return {
            updatedUsers: users,
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
        let users = JSON.parse(JSON.stringify(allUsers)) as User[];
        const buyerIndex = users.findIndex(u => u.email === buyerEmail);
        if (buyerIndex === -1) return users;

        let buyer = users[buyerIndex];
        const orderIndex = buyer.orders.findIndex(o => o.orderId === orderId);

        if (orderIndex === -1 || buyer.orders[orderIndex].status !== 'pending') {
            return users; // Order not found or already processed
        }

        const order = buyer.orders[orderIndex];

        // NUEVO: Solo aplicar PUNTOS al comprador (ya no cashback)
        buyer.points += order.pointsEarned;
        buyer.orders[orderIndex].status = 'approved';

        // REFERIDOR: Solo recibe CASHBACK (2% del monto)
        // Ya NO recibe puntos por traer amigos
        if (buyer.referredByCode) {
            const referrerIndex = users.findIndex(u => u.referralCode === buyer.referredByCode);
            if (referrerIndex > -1) {
                // Cashback 2% on ALL purchases
                const referrerCashback = order.totalUsd * REFERRAL_CASHBACK_RATE;
                users[referrerIndex].cashbackBalance_usd = (users[referrerIndex].cashbackBalance_usd || 0) + referrerCashback;

                // Check if first purchase for stats
                const previouslyApprovedOrders = buyer.orders.filter((o, idx) => idx !== orderIndex && o.status === 'approved');
                const isFirstApprovedPurchase = previouslyApprovedOrders.length === 0;

                if (isFirstApprovedPurchase) {
                    // Update referrer stats only on first purchase
                    if (!users[referrerIndex].referralStats) {
                        users[referrerIndex].referralStats = {
                            totalReferred: 0,
                            referredThisMonth: 0,
                            referredToday: 0
                        };
                    }
                    users[referrerIndex].referralStats.totalReferred += 1;
                }
            }
        }

        // Update buyer tier
        buyer.loyaltyTier = calculateLoyaltyTier(buyer.points);
        users[buyerIndex] = buyer;

        return users;
    }, []);

    // 3. Reject Order
    const rejectOrder = useCallback((orderId: string, buyerEmail: string, allUsers: User[]) => {
        let users = JSON.parse(JSON.stringify(allUsers)) as User[];
        const buyerIndex = users.findIndex(u => u.email === buyerEmail);
        if (buyerIndex === -1) return users;

        const orderIndex = users[buyerIndex].orders.findIndex(o => o.orderId === orderId);
        if (orderIndex > -1) {
            users[buyerIndex].orders[orderIndex].status = 'rejected';
        }
        return users;
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
