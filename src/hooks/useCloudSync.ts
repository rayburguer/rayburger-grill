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
                if (products.length > 0) {
                    // USE PUSH (UPSERT) INSTEAD OF REPLACE FOR AUTO-SYNC
                    results.push(await pushToCloud('rb_products', products));
                }
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

    const pullFromCloud = useCallback(async () => {
        if (!supabase) return { error: 'Supabase client not initialized' };

        setIsSyncing(true);
        const errors = [];

        try {
            console.log("☁️ STARTING MANUAL PULL FROM CLOUD...");

            // 1. PRODUCTS
            const { data: products, error: prodError } = await supabase.from('rb_products').select('*');
            if (prodError) errors.push(`Products: ${prodError.message}`);
            else if (products) {
                // Map back customizable options if needed (currently stored as is)
                localStorage.setItem('rayburger_products', JSON.stringify(products));
                // Force UI update
                window.dispatchEvent(new CustomEvent('rayburger_products_updated', { detail: { source: 'cloud_pull' } }));
                console.log(`✅ Pulled ${products.length} products`);
            }

            // 2. USERS
            const { data: users, error: userError } = await supabase.from('rb_users').select('*');
            if (userError) errors.push(`Users: ${userError.message}`);
            else if (users) {
                // Map back ID -> Email if needed, but we use email as ID in sync logic
                const localUsers = users.map(u => {
                    const { id, ...rest } = u; // Remove Supabase ID if it conflicts, but our ID is email
                    return { ...rest };
                });
                localStorage.setItem('rayburger_registered_users', JSON.stringify(localUsers));
                window.dispatchEvent(new CustomEvent('rayburger_users_updated', { detail: { source: 'cloud_pull' } }));
                console.log(`✅ Pulled ${users.length} users`);
            }

            // 3. SETTINGS (Tasa)
            const { data: settings, error: setError } = await supabase.from('rb_settings').select('*').eq('id', 'tasa').single();
            if (!setError && settings) {
                localStorage.setItem('rayburger_tasa', settings.value.toString());
                console.log(`✅ Pulled Tasa: ${settings.value}`);
            }

            // 4. GUEST ORDERS
            const { data: orders, error: ordError } = await supabase.from('rb_orders').select('*');
            if (ordError) errors.push(`Orders: ${ordError.message}`);
            else if (orders) {
                const localOrders = orders.map(o => {
                    const { id, ...rest } = o;
                    return { ...rest, orderId: id }; // Map ID back to orderId
                });
                localStorage.setItem('rayburger_guest_orders', JSON.stringify(localOrders));
                console.log(`✅ Pulled ${orders.length} orders`);
            }

            const now = Date.now();
            setLastSync(now);
            localStorage.setItem('rayburger_last_cloud_sync', now.toString());

            if (errors.length > 0) {
                console.error("❌ Pull errors:", errors);
                return { error: errors.join(', ') };
            }

            return { error: null };

        } catch (err: any) {
            console.error("💥 CRITICAL PULL ERROR:", err);
            return { error: err.message };
        } finally {
            setIsSyncing(false);
        }
    }, []);

    return {
        isSyncing,
        lastSync,
        pushToCloud,
        replaceInCloud,
        fetchFromCloud,
        migrateAllToCloud,
        pullFromCloud
    };
};
