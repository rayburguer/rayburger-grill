import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Order } from '../types';

const sanitizeData = (table: string, data: any[]) => {
    if (table === 'rb_products') {
        // Keep customizableOptions! It's vital for the ordering flow.
        return data.map(({ highlight, ...rest }) => ({
            ...rest
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

            // 2. USERS (with intelligent merge)
            const { data: users, error: userError } = await supabase.from('rb_users').select('*');
            if (userError) errors.push(`Users: ${userError.message}`);
            else if (users) {
                // Get current local users
                const currentLocalUsers = JSON.parse(localStorage.getItem('rayburger_registered_users') || '[]');
                const localUsersMap = new Map(currentLocalUsers.map((u: any) => [u.email, u]));

                // Merge remote users with local, preserving advanced order statuses
                const mergedUsers = users.map(remoteUser => {
                    const { id, ...rest } = remoteUser;
                    const localUser = localUsersMap.get(rest.email);

                    if (!localUser) {
                        // New user from cloud, just use it
                        return rest;
                    }

                    // Merge orders: preserve local status if more advanced
                    const statusPriority: Record<string, number> = {
                        'approved': 3,
                        'delivered': 2,
                        'pending': 1,
                        'rejected': 0
                    };

                    const remoteOrdersMap = new Map((rest.orders || []).map((o: any) => [o.orderId, o]));
                    const localOrders = localUser.orders || [];

                    const mergedOrders = (rest.orders || []).map((remoteOrder: any) => {
                        const localOrder = localOrders.find((lo: any) => lo.orderId === remoteOrder.orderId);

                        if (!localOrder) return remoteOrder;

                        // Compare status priority
                        const localPriority = statusPriority[localOrder.status || 'pending'] || 0;
                        const remotePriority = statusPriority[remoteOrder.status || 'pending'] || 0;

                        // If local is more advanced, use local order
                        return localPriority > remotePriority ? localOrder : remoteOrder;
                    });

                    // Add any local orders that don't exist in remote
                    localOrders.forEach((localOrder: any) => {
                        if (!remoteOrdersMap.has(localOrder.orderId)) {
                            mergedOrders.push(localOrder);
                        }
                    });

                    return { ...rest, orders: mergedOrders };
                });

                localStorage.setItem('rayburger_registered_users', JSON.stringify(mergedUsers));
                window.dispatchEvent(new CustomEvent('rayburger_users_updated', { detail: { source: 'cloud_pull' } }));
                console.log(`✅ Pulled ${users.length} users (with intelligent merge)`);
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

    const wipeCloudData = useCallback(async (cutoffTimestamp?: number) => {
        if (!supabase) return { error: 'Supabase client not initialized' };

        setIsSyncing(true);
        console.log(`🔥 CLOUD WIPE INITIATED (Cutoff: ${cutoffTimestamp ? new Date(cutoffTimestamp).toLocaleString() : 'ALL'})`);

        try {
            // 1. DELETE ORDERS
            let query = supabase.from('rb_orders').delete();

            if (cutoffTimestamp) {
                // Safe mode: Delete only OLD orders
                query = query.lt('timestamp', cutoffTimestamp);
            } else {
                // Nuclear mode: Delete ALL
                query = query.neq('id', '00000000-0000-0000-0000-000000000000');
            }

            const { error: ordersError } = await query;
            if (ordersError) throw ordersError;

            // 2. USERS HANDLING
            // If partial wipe (cutoff provided), WE PROTECT USERS.
            // "no puede pasar nada con la info de clientes de ayer"
            // So we only wipe users if it's a full nuclear reset (no cutoff).
            if (!cutoffTimestamp) {
                const { error: usersError } = await supabase.from('rb_users').delete().neq('id', 'nobody');
                if (usersError) throw usersError;
            } else {
                console.log("🛡️ Skipping User deletion to protect client data.");
            }

            const now = Date.now();
            setLastSync(now);
            localStorage.setItem('rayburger_last_cloud_sync', now.toString());

            console.log("✅ CLOUD DATA CLEANED SUCCESSFULLY");
            return { error: null };

        } catch (err: any) {
            console.error("💥 CLOUD WIPE ERROR:", err);
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
        pullFromCloud,
        wipeCloudData // EXPORT NEW FUNCTION
    };
};
