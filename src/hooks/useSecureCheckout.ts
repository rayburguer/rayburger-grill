import { useCallback } from 'react';
import { CartItem } from '../types';
import { supabase } from '../lib/supabase';

interface CheckoutResult {
    success: boolean;
    error?: string;
    pointsEarned?: number;
    pointsPotential?: number;
    referralBonus?: number;
    multiplierUsed?: number;
}

export const useSecureCheckout = () => {

    /**
     * 🛡️ SECURE CHECKOUT: Calls backend RPC to process order
     */
    const processSecureOrder = useCallback(async (
        userId: string,
        cartItems: CartItem[],
        totalUsd: number,
        paymentMethod: string,
        customerName?: string,
        customerPhone?: string,
        balanceUsedUsd: number = 0
    ): Promise<CheckoutResult> => {

        if (!supabase) {
            return { success: false, error: 'Database unavailable' };
        }

        try {
            const itemsJson = cartItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price_usd: item.finalPrice_usd,
                selectedOptions: item.selectedOptions || {}
            }));

            const { data, error } = await supabase.rpc('rpc_process_order', {
                p_user_id: userId,
                p_total_usd: totalUsd,
                p_items: itemsJson,
                p_payment_method: paymentMethod,
                p_customer_name: customerName,
                p_customer_phone: customerPhone,
                p_balance_used_usd: balanceUsedUsd
            });

            if (error) throw error;
            if (!data?.success) return { success: false, error: data?.error };

            return {
                success: true,
                multiplierUsed: data.multiplier_used,
                pointsPotential: data.points_potential
            };

        } catch (err: any) {
            return { success: false, error: err.message || 'System error' };
        }
    }, []);

    /**
     * 🛡️ APPROVE ORDER: Awards points and referrals securely
     */
    const approveSecureOrder = useCallback(async (orderId: string): Promise<CheckoutResult> => {
        if (!supabase) return { success: false, error: 'No connection' };
        try {
            const { data, error } = await supabase.rpc('rpc_approve_order', { p_order_id: orderId });
            if (error) throw error;
            return data?.success ? { success: true, pointsEarned: data.points_earned } : { success: false, error: data?.error };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, []);

    /**
     * 🛡️ REJECT ORDER: Refunds balance securely
     */
    const rejectSecureOrder = useCallback(async (orderId: string): Promise<CheckoutResult> => {
        if (!supabase) return { success: false, error: 'No connection' };
        try {
            const { data, error } = await supabase.rpc('rpc_reject_order', { p_order_id: orderId });
            if (error) throw error;
            return data?.success ? { success: true } : { success: false, error: data?.error };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, []);

    return {
        processSecureOrder,
        approveSecureOrder,
        rejectSecureOrder
    };
};
