import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Order } from '../types';

const sanitizeData = (table: string, data: any[]) => {
    if (table === 'rb_products') {
        // Remove 'highlight' as it's missing in the actual Supabase schema
        // and any other non-essential fields to avoid schema cache conflicts.
        return data.map(({ highlight, customizableOptions, ...rest }) => ({
            ...rest,
            // We stringify customizableOptions if the DB expects text, 
            // but for now let's just omit them to be 100% safe for the restoration.
        }));
    }
    return data;
};

export const useCloudSync = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<number | null>(() => {
        const saved = localStorage.getItem('rayburger_last_cloud_sync');
        return saved ? Number(saved) : null;
    });

    const pushToCloud = useCallback(async (table: string, data: any[]) => {
        if (!supabase) return { error: 'Supabase client not initialized' };

        setIsSyncing(true);
        const sanitizedData = sanitizeData(table, data);
        try {
            const { error } = await supabase
                .from(table)
                .upsert(sanitizedData, { onConflict: 'id' });

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

    const replaceInCloud = useCallback(async (table: string, data: any[]) => {
        if (!supabase) return { error: 'Supabase client not initialized' };

        setIsSyncing(true);
        console.log(`🧹 NUCLEAR REPLACE starting for table: ${table}`);
        try {
            // 1. FETCH ALL IDs first (to be extra sure we know what to delete)
            const { data: existingItems, error: fetchError } = await supabase
                .from(table)
                .select('id');

            if (fetchError) {
                console.error(`❌ Initial fetch failed for ${table}:`, fetchError);
                throw fetchError;
            }

            if (existingItems && existingItems.length > 0) {
                const idsToDelete = existingItems.map(item => item.id);
                console.log(`🗑️ Found ${idsToDelete.length} items to delete. IDs:`, idsToDelete);

                // 2. DELETE BY ID LIST
                const { error: deleteError } = await supabase
                    .from(table)
                    .delete()
                    .in('id', idsToDelete);

                if (deleteError) {
                    console.error(`❌ Targeted delete failed for ${table}:`, deleteError);
                    throw deleteError;
                }
                console.log(`✅ Table ${table} successfully emptied.`);
            } else {
                console.log(`ℹ️ Table ${table} was already empty.`);
            }

            // 3. INSERT new data
            const sanitizedData = sanitizeData(table, data);
            console.log(`📥 Inserting ${sanitizedData.length} (sanitized) new items...`);
            const { error: insertError } = await supabase
                .from(table)
                .insert(sanitizedData);

            if (insertError) {
                console.error(`❌ Insert failed for ${table}:`, insertError);
                throw insertError;
            }

            const now = Date.now();
            setLastSync(now);
            localStorage.setItem('rayburger_last_cloud_sync', now.toString());
            console.log(`✨ Table ${table} fully replaced.`);
            return { error: null };
        } catch (err: any) {
            console.error(`💥 CRITICAL REPLACE ERROR:`, err);
            return { error: err.message || JSON.stringify(err) };
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
                results.push(await replaceInCloud('rb_products', products));
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

        // 4. Settings (Tasa)
        const localTasa = localStorage.getItem('rayburger_tasa');
        if (localTasa) {
            results.push(await pushToCloud('rb_settings', [{ id: 'tasa', value: Number(localTasa) }]));
        }

        return results;
    }, [pushToCloud, replaceInCloud]); // ✅ FIXED: Added replaceInCloud dependency

    return {
        isSyncing,
        lastSync,
        pushToCloud,
        replaceInCloud,
        fetchFromCloud,
        migrateAllToCloud
    };
};
