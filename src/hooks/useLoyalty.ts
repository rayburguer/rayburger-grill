import { useCallback } from 'react';
import { User, Order, CartItem } from '../types';
import { REWARD_TIER_RATES, REFERRAL_REWARD_RATE, ROULETTE_COOLDOWN_DAYS, ROULETTE_PRIZES, RoulettePrize } from '../config/constants';
import { generateUuid } from '../utils/helpers';
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

        // FUNDADOR CHECK: 3x Multiplier
        // User said "30 days". We check if code is FUNDADOR and if registration < 30 days?
        // OR we check if nextPurchaseMultiplier is set.
        // Current logic uses nextPurchaseMultiplier which is one-time.
        // Let's keep one-time but fix the expiry if needed? 
        // User asked: "el bono fundador revisa".
        // If we want 30 days, we should check registration date + code.

        let multiplier = buyer.nextPurchaseMultiplier || 1;

        if (buyer.referredByCode === 'FUNDADOR') {
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;
            const now = Date.now();
            if (buyer.registrationDate && (now - buyer.registrationDate < thirtyDays)) {
                multiplier = 3; // Force 3x if within 30 days
            }
        }

        // Las recompensas se calculan sobre el total pagado (restando el balance usado si aplica)
        // O mejor: sobre el subtotal de productos para incentivar compra.
        let { reward } = calculateRewards(totalUsd, tierAtPurchase, multiplier);

        // Administrador NO gana recompensas por sus propias compras
        if (buyer.role === 'admin') reward = 0;

        // Referidor gana RECOMPENSA (2% del monto) solo en el primer pedido aprobado del referido
        let referrerBonus = 0;
        if (buyer.referredByCode) {
            const referrer = allUsers.find(u => u.referralCode === buyer.referredByCode);
            // 🛡️ ETHICS CHECK: Referrer does NOT earn if they are an admin
            if (referrer && referrer.role !== 'admin') {
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

    // 2. Approve Order (UI Sync only - math happens in rpc_approve_order)
    const confirmOrderRewards = useCallback((
        orderId: string,
        buyerEmail: string,
        allUsers: User[]
    ): User[] => {
        return allUsers.map(u => {
            if (u.email === buyerEmail) {
                return {
                    ...u,
                    orders: u.orders.map(o => o.orderId === orderId ? { ...o, status: 'approved' as const, paymentStatus: 'paid' as const } : o)
                };
            }
            return u;
        });
    }, []);

    // 3. Reject Order (UI Sync only - refund happens in rpc_reject_order)
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
        const lastSpin = user.lastSpinDate;
        const now = Date.now();
        const cooldownMs = ROULETTE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
        return (now - lastSpin) >= cooldownMs;
    }, []);

    const spinRoulette = useCallback((user: User): { result: RoulettePrize, updatedUser: User } => {
        if (user.role === 'admin') throw new Error('Los administradores no participan en promociones');
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

        const updatedUser = {
            ...user,
            lastSpinDate: Date.now(),
            walletBalance_usd: selectedPrize.type === 'usd'
                ? user.walletBalance_usd + selectedPrize.value
                : user.walletBalance_usd
        };

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
