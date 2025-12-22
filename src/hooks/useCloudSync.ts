import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Order } from '../types';

export const useCloudSync = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<number | null>(() => {
        const saved = localStorage.getItem('rayburger_last_cloud_sync');
        return saved ? Number(saved) : null;
    });

    const pushToCloud = useCallback(async (table: string, data: any[]) => {
        if (!supabase) return { error: 'Supabase client not initialized' };

        setIsSyncing(true);
        try {
            // Upsert works by using the primary key. 
            // We assume IDs or emails are primary keys depending on the table.
            const { error } = await supabase
                .from(table)
                .upsert(data, { onConflict: 'id' }); // Adjust conflict key as needed

            if (!error) {
                const now = Date.now();
                setLastSync(now);
                localStorage.setItem('rayburger_last_cloud_sync', now.toString());
            }
            return { error };
        } catch (err) {
            console.error(`Sync error for ${table}:`, err);
            return { error: err };
        } finally {
            setIsSyncing(false);
        }
    }, []);

    const fetchFromCloud = useCallback(async (table: string) => {
        if (!supabase) return { data: null, error: 'Supabase client not initialized' };

        setIsSyncing(true);
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*');
            return { data, error };
        } catch (err) {
            console.error(`Fetch error for ${table}:`, err);
            return { data: null, error: err };
        } finally {
            setIsSyncing(false);
        }
    }, []);

    const migrateAllToCloud = useCallback(async () => {
        const results = [];

        // 1. Users
        const localUsers = localStorage.getItem('rayburger_registered_users');
        if (localUsers) {
            try {
                const users = (JSON.parse(localUsers) as any[]).map((u: User) => ({
                    ...u,
                    id: u.email // Supabase primary key mapping
                }));
                results.push(await pushToCloud('rb_users', users));
            } catch (e) {
                console.error("Error parsing users:", e);
                results.push({ error: 'Parse error in users' });
            }
        }

        // 2. Products
        const localProducts = localStorage.getItem('rayburger_products');
        if (localProducts) {
            try {
                const products = JSON.parse(localProducts);
                results.push(await pushToCloud('rb_products', products));
            } catch (e) {
                console.error("Error parsing products:", e);
                results.push({ error: 'Parse error in products' });
            }
        }

        // 3. Guest Orders
        const localGuestOrders = localStorage.getItem('rayburger_guest_orders');
        if (localGuestOrders) {
            try {
                const orders = (JSON.parse(localGuestOrders) as any[]).map((o: Order) => ({
                    ...o,
                    id: o.orderId // Map orderId to id for Supabase
                }));
                results.push(await pushToCloud('rb_orders', orders));
            } catch (e) {
                console.error("Error parsing orders:", e);
                results.push({ error: 'Parse error in orders' });
            }
        }

        return results;
    }, [pushToCloud]);

    return {
        isSyncing,
        lastSync,
        pushToCloud,
        fetchFromCloud,
        migrateAllToCloud
    };
};
