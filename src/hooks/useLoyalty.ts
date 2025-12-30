import { useCallback } from 'react';
import { User, Order, CartItem } from '../types';
import { REWARD_TIER_RATES, REFERRAL_REWARD_RATE, ROULETTE_COOLDOWN_DAYS, ROULETTE_PRIZES, RoulettePrize } from '../config/constants';
import { calculateLoyaltyTier, generateUuid } from '../utils/helpers';
import { supabase } from '../lib/supabase';

interface ProcessOrderResult {
    updatedUsers: User[];
    orderSummary: {
        rewardEarned: number; // Reward en $
        referrerReward: number; // Reward en $ para el referidor
    };
}

export const useLoyalty = () => {

    // Calcula recompensa como % del monto según tier
    const calculateRewards = (totalUsd: number, currentTier: string, multiplier: number = 1) => {
        let rate = REWARD_TIER_RATES.Bronze;
        if (currentTier === 'Silver') rate = REWARD_TIER_RATES.Silver;
        if (currentTier === 'Gold') rate = REWARD_TIER_RATES.Gold;

        const reward = totalUsd * rate * multiplier;
        return { reward };
    };

    // 1. Calculate and Create PENDING Order
    const processOrderRewards = useCallback((
        buyerEmail: string,
        cartItems: CartItem[],
        totalUsd: number, // Subtotal de productos
        allUsers: User[],
        deliveryInfo?: { method: 'delivery' | 'pickup', fee: number, phone: string },
        balanceUsed: number = 0
    ): ProcessOrderResult | null => {

        const buyer = allUsers.find(u => u.email === buyerEmail);
        if (!buyer) return null;

        const tierAtPurchase = buyer.loyaltyTier || 'Bronze';
        const multiplier = buyer.nextPurchaseMultiplier || 1;

        // Las recompensas se calculan sobre el total pagado (restando el balance usado si aplica)
        // O mejor: sobre el subtotal de productos para incentivar compra.
        let { reward } = calculateRewards(totalUsd, tierAtPurchase, multiplier);

        // Administrador NO gana recompensas por sus propias compras
        if (buyer.role === 'admin') reward = 0;

        // Referidor gana RECOMPENSA (2% del monto) solo en el primer pedido aprobado del referido
        let referrerBonus = 0;
        if (buyer.referredByCode) {
            const referrer = allUsers.find(u => u.referralCode === buyer.referredByCode);
            if (referrer) {
                referrerBonus = totalUsd * REFERRAL_REWARD_RATE;
            }
        }

        const newOrder: Order = {
            orderId: generateUuid(),
            timestamp: Date.now(),
            totalUsd: totalUsd + (deliveryInfo?.fee || 0),
            items: cartItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price_usd: item.finalPrice_usd,
                selectedOptions: item.selectedOptions
            })),
            pointsEarned: 0, // Deprecated
            rewardsEarned_usd: reward,
            status: 'pending',
            deliveryMethod: deliveryInfo?.method || 'pickup',
            deliveryFee: deliveryInfo?.fee || 0,
            paymentMethod: 'whatsapp_link',
            paymentStatus: 'pending',
            customerName: buyer.name,
            customerPhone: deliveryInfo?.phone || buyer.phone,
            balanceUsed_usd: balanceUsed
        };

        const updatedUsers = allUsers.map(u => {
            if (u.email === buyerEmail) {
                return {
                    ...u,
                    orders: [...u.orders, newOrder],
                    // We don't deduct balance here yet, we wait for confirmation?
                    // Actually, for better consistency, we should deduct immediately if confirmed or wait.
                    // Let's deduct immediately to prevent double spending if order is place.
                    walletBalance_usd: Math.max(0, u.walletBalance_usd - balanceUsed)
                };
            }
            return u;
        });

        return {
            updatedUsers,
            orderSummary: {
                rewardEarned: reward,
                referrerReward: referrerBonus,
            }
        };

    }, []);

    // 2. Approve Order (Actually apply rewards and update tier)
    const confirmOrderRewards = useCallback((
        orderId: string,
        buyerEmail: string,
        allUsers: User[]
    ): User[] => {
        const buyer = allUsers.find(u => u.email === buyerEmail);
        if (!buyer) return allUsers;

        const order = buyer.orders.find(o => o.orderId === orderId);
        if (!order || order.status === 'approved') return allUsers;

        return allUsers.map(u => {
            if (u.email === buyerEmail) {
                const updatedOrders = u.orders.map(o => o.orderId === orderId ? { ...o, status: 'approved' as const } : o);

                // Update Wallet and Spend
                const newLifetimeSpend = u.lifetimeSpending_usd + (order.totalUsd - (order.balanceUsed_usd || 0));
                const newWalletBalance = u.walletBalance_usd + order.rewardsEarned_usd;

                return {
                    ...u,
                    walletBalance_usd: newWalletBalance,
                    lifetimeSpending_usd: newLifetimeSpend,
                    orders: updatedOrders,
                    nextPurchaseMultiplier: 1,
                    loyaltyTier: calculateLoyaltyTier(newLifetimeSpend)
                };
            }

            // Referrer Bonus (Only on first approved purchase)
            if (buyer.referredByCode && u.referralCode === buyer.referredByCode && u.role !== 'admin') {
                const previouslyApproved = buyer.orders.filter(o => o.orderId !== orderId && o.status === 'approved');
                if (previouslyApproved.length === 0) {
                    const referrerReward = order.totalUsd * REFERRAL_REWARD_RATE;
                    const newStats = { ...(u.referralStats || { totalReferred: 0, referredThisMonth: 0, referredToday: 0 }) };
                    newStats.totalReferred += 1;

                    // VIRAL AMBASSADOR LOGIC:
                    // Add referral spend to Referrer's Lifetime Spending to help them level up!
                    const newLifetimeSpend = (u.lifetimeSpending_usd || 0) + order.totalUsd;
                    const newTier = calculateLoyaltyTier(newLifetimeSpend);

                    return {
                        ...u,
                        walletBalance_usd: u.walletBalance_usd + referrerReward,
                        lifetimeSpending_usd: newLifetimeSpend,
                        loyaltyTier: newTier, // UPGRADE TIER IF APPLICABLE
                        referralStats: newStats
                    }
                }
            }

            return u;
        });
    }, []);

    // 3. Reject Order (Restore balance if was used)
    const rejectOrder = useCallback((orderId: string, buyerEmail: string, allUsers: User[]) => {
        return allUsers.map(u => {
            if (u.email === buyerEmail) {
                const order = u.orders.find(o => o.orderId === orderId);
                const restoredBalance = order?.balanceUsed_usd || 0;

                return {
                    ...u,
                    walletBalance_usd: u.walletBalance_usd + restoredBalance,
                    orders: u.orders.map(o => o.orderId === orderId ? { ...o, status: 'rejected' as const } : o)
                };
            }
            return u;
        });
    }, []);

    // 4. Roulette Logic
    const canSpin = useCallback((user: User): boolean => {
        if (!user.lastSpinDate) return true;
        const lastSpin = user.lastSpinDate;
        const now = Date.now();
        const cooldownMs = ROULETTE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
        return (now - lastSpin) >= cooldownMs;
    }, []);

    const spinRoulette = useCallback((user: User): { result: RoulettePrize, updatedUser: User } => {
        if (!canSpin(user)) throw new Error('Cooldown active');

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

        let updatedUser = { ...user, lastSpinDate: Date.now() };
        if (selectedPrize.type === 'usd') {
            updatedUser.walletBalance_usd += selectedPrize.value;
        }

        return { result: selectedPrize, updatedUser };
    }, [canSpin]);

    // 5. SECURE SERVER-SIDE PAYMENT
    const processWalletPayment = useCallback(async (userId: string, amount: number): Promise<{ success: boolean, error?: string }> => {
        if (!supabase) return { success: false, error: 'No connection' };
        if (amount <= 0) return { success: true }; // No deduction needed

        try {
            const { data, error } = await supabase.rpc('process_wallet_payment', {
                p_user_id: userId,
                p_amount: amount
            });

            if (error) throw error;

            // data matches the JSON returned by Postgres function
            if (data && data.success) {
                return { success: true };
            } else {
                return { success: false, error: data?.error || 'Payment failed' };
            }

        } catch (e: any) {
            console.error("Secure Payment Error:", e);
            return { success: false, error: e.message || 'Server error' };
        }
    }, []);

    return {
        processOrderRewards,
        confirmOrderRewards,
        rejectOrder,
        canSpin,
        spinRoulette,
        processWalletPayment
    };
};
