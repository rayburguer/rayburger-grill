import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Order } from '../types';
import { normalizePhone } from '../utils/helpers';

const sanitizeData = (table: string, data: any[]) => {
    if (table === 'rb_products') {
        // Keep customizableOptions! It's vital for the ordering flow.
        return data.map(({ ...rest }) => ({
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

    const deleteFromCloud = useCallback(async (table: string, id: string) => {
        if (!supabase) return { error: 'Supabase client not initialized' };
        setIsSyncing(true);
        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            return { error };
        } catch (err) {
            console.error(`Delete error for ${table}:`, err);
            return { error: err };
        } finally {
            setIsSyncing(false);
        }
    }, []);

    // replaceInCloud was DELETED to protect production data from accidental wipes.
    // Use pushToCloud (upsert) instead.

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

        // 0. Merge Duplicates (Auto-Cleaning on Migrate)
        // Ideally we do this explicitly, but let's keep it separate for safety. 
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

        // 2. Products (DEPRECATED AUTO-PUSH)
        // Products now only sync Cloud -> Local on pullFromCloud
        // Push only happens explicitly in ProductManagement.tsx
        /*
        const localProducts = localStorage.getItem('rayburger_products');
        if (localProducts) {
            // ...
        }
        */

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

        // 5. Surveys
        const localSurveys = localStorage.getItem('rayburger_surveys');
        if (localSurveys) {
            try {
                const surveys = JSON.parse(localSurveys);
                if (surveys.length > 0) {
                    results.push(await pushToCloud('rb_surveys', surveys));
                }
            } catch (e) {
                console.error("Error parsing surveys for sync:", e);
                results.push({ error: 'Parse error in surveys' });
            }
        }

        return results;
    }, [pushToCloud]); // - FIXED: Removed replaceInCloud dependency

    const pullFromCloud = useCallback(async (options?: { forceCleanLocal?: boolean }) => {
        if (!supabase) return { error: 'Supabase client not initialized' };

        setIsSyncing(true);
        const errors: string[] = [];
        const log = (msg: string) => console.log(`☁️ ${msg}`);

        try {
            log("STARTING MANUAL PULL...");

            // 1. PRODUCTS
            try {
                const { data: products, error } = await supabase.from('rb_products').select('*');
                if (error) throw error;
                if (products) {
                    localStorage.setItem('rayburger_products', JSON.stringify(products));
                    window.dispatchEvent(new CustomEvent('rayburger_products_updated', { detail: { source: 'cloud_pull' } }));
                    log(`Pulled ${products.length} products`);
                }
            } catch (e: any) {
                console.error("Sync Error (Products):", e);
                errors.push(`Products: ${e.message}`);
            }

            // 2. USERS (Intelligent Merge)
            try {
                const { data: users, error } = await supabase.from('rb_users').select('*');
                if (error) throw error;
                if (users) {
                    const currentLocalUsers = JSON.parse(localStorage.getItem('rayburger_registered_users') || '[]');
                    const localUsersMap = new Map<string, User>(currentLocalUsers.map((u: any) => [u.email, u as User]));
                    const remoteEmails = new Set(users.map(u => u.email));

                    const mergedUsers = users
                        .filter((u: any) => u.role !== 'deleted') // 🛡️ FILTER SOFT DELETED
                        .map((remoteUser: any) => {
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { id, ...rest } = remoteUser;
                            const localUser = localUsersMap.get(rest.email) as User | undefined;
                            if (!localUser) return { ...rest, points: rest.points || 0, walletBalance_usd: rest.walletBalance_usd || 0, lifetimeSpending_usd: rest.lifetimeSpending_usd || 0 };

                            // Name & Profile protection logic
                            const invalidNames = ['Cliente', 'Cliente Nuevo', 'Invitado', 'Sin Nombre'];
                            const isRemoteNameValid = rest.name && !invalidNames.includes(rest.name);
                            const isLocalNameValid = localUser.name && !invalidNames.includes(localUser.name);

                            // Prefer remote if valid, but keep local if remote is default/invalid
                            const mergedName = isRemoteNameValid ? rest.name : (isLocalNameValid ? localUser.name : (rest.name || 'Cliente'));
                            const mergedLastName = rest.lastName || localUser.lastName;
                            const mergedBirthDate = rest.birthDate || localUser.birthDate;

                            const statusPriority: Record<string, number> = { 'approved': 3, 'delivered': 2, 'pending': 1, 'rejected': 0 };

                            // Merge Orders
                            const remoteOrders = rest.orders || [];
                            const localOrders = localUser.orders || [];
                            const remoteOrderIds = new Set(remoteOrders.map((o: any) => o.orderId));

                            const mergedOrders = remoteOrders
                                .map((remoteOrder: any) => {
                                    const localOrder = localOrders.find((lo: any) => lo.orderId === remoteOrder.orderId);
                                    if (!localOrder) {
                                        // 🛡️ SYNC PROTECTION: If it's an old finalized order missing locally, ignore it.
                                        // This prevents "resurrecting" deleted junk from the cloud.
                                        const isFinalized = ['approved', 'rejected', 'delivered'].includes(remoteOrder.status);
                                        const isOld = (Date.now() - (remoteOrder.timestamp || 0)) > (24 * 60 * 60 * 1000); // 24 hours
                                        if (isFinalized && isOld) return null;
                                        return remoteOrder;
                                    }
                                    const localP = statusPriority[localOrder.status] || 0;
                                    const remoteP = statusPriority[remoteOrder.status] || 0;
                                    return localP > remoteP ? localOrder : remoteOrder;
                                })
                                .filter(Boolean); // Remove nulls from skipped old orders

                            // Resurrect recent local orders
                            const RECENT_WINDOW_MS = 15 * 60 * 1000;
                            const now = Date.now();
                            localOrders.forEach((localOrder: any) => {
                                if (!remoteOrderIds.has(localOrder.orderId)) {
                                    const isRecent = (now - localOrder.timestamp) < RECENT_WINDOW_MS;
                                    const isActive = !['approved', 'rejected', 'delivered'].includes(localOrder.status);
                                    if (isRecent || isActive) mergedOrders.push(localOrder);
                                }
                            });

                            const mergedPoints = Math.max(localUser.points || 0, rest.points || 0);
                            const mergedBalance = Math.max(localUser.walletBalance_usd || 0, rest.walletBalance_usd || 0);

                            return {
                                ...rest,
                                name: mergedName,
                                lastName: mergedLastName,
                                birthDate: mergedBirthDate,
                                orders: mergedOrders,
                                points: mergedPoints, // Keep solely for legacy safety
                                walletBalance_usd: mergedBalance, // IMPORTANT: unified wallet merge
                                passwordHash: rest.passwordHash || localUser.passwordHash || (rest as any).password || (localUser as any).password || '', // Prefer hash, fallback legacy
                                role: (rest.role === 'admin' || localUser.role === 'admin') ? 'admin' : (rest.role || localUser.role || 'customer')
                            };
                        });

                    // Add Local-Only Users (Only if not in forceCleanLocal mode)
                    if (!options?.forceCleanLocal) {
                        currentLocalUsers.forEach((localUser: any) => {
                            if (!remoteEmails.has(localUser.email)) mergedUsers.push(localUser);
                        });
                    }

                    // SANITY CHECK: Ensure absolute uniqueness by email before saving
                    const uniqueMap = new Map<string, any>();
                    mergedUsers.forEach((u: any) => {
                        if (u.email) {
                            const normalized = u.email.toLowerCase().trim();
                            if (!uniqueMap.has(normalized)) {
                                uniqueMap.set(normalized, u);
                            }
                        }
                    });
                    const finalUsers = Array.from(uniqueMap.values());

                    localStorage.setItem('rayburger_registered_users', JSON.stringify(finalUsers));
                    window.dispatchEvent(new CustomEvent('rayburger_users_updated', { detail: { source: 'cloud_pull' } }));
                    log(`Pulled ${users.length} users (Merged)`);
                }
            } catch (e: any) {
                console.error("Sync Error (Users):", e);
                errors.push(`Users: ${e.message}`);
            }

            // 3. SETTINGS
            try {
                const { data, error } = await supabase.from('rb_settings').select('*').eq('id', 'tasa').single();
                if (data && !error) {
                    localStorage.setItem('rayburger_tasa', data.value.toString());
                    log(`Pulled Tasa: ${data.value}`);
                }
            } catch {
                // Settings might not exist, ignore critical
            }

            // 4. GUEST ORDERS
            try {
                const { data: orders, error } = await supabase.from('rb_orders').select('*');
                if (error) throw error;
                if (orders) {
                    const mappedOrders = orders.map(o => {
                        const { id, ...rest } = o;
                        return { ...rest, orderId: id };
                    });
                    localStorage.setItem('rayburger_guest_orders', JSON.stringify(mappedOrders));
                    log(`Pulled ${orders.length} orders`);
                }
            } catch (e: any) {
                console.error("Sync Error (Orders):", e);
                errors.push(`Orders: ${e.message}`);
            }

            // 5. SURVEYS
            try {
                const { data: surveys, error } = await supabase.from('rb_surveys').select('*');
                if (error) throw error;
                if (surveys) {
                    localStorage.setItem('rayburger_surveys', JSON.stringify(surveys));
                    window.dispatchEvent(new CustomEvent('rayburger_surveys_updated', { detail: { source: 'cloud_pull' } }));
                    log(`Pulled ${surveys.length} surveys`);
                }
            } catch (e: any) {
                errors.push(`Surveys: ${e.message}`);
            }

            const now = Date.now();
            setLastSync(now);
            localStorage.setItem('rayburger_last_cloud_sync', now.toString());

            if (errors.length > 0) return { error: errors.join(', ') };
            return { error: null };

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

    const mergeDuplicates = useCallback(async () => {
        if (!supabase) return { error: 'No connection' };

        try {
            setIsSyncing(true);

            // 0. Sync local data first to avoid losing unpushed points/orders
            console.log("🔄 Syncing local data before merge...");
            await migrateAllToCloud();

            // 1. Fetch ALL users from Cloud
            const { data: users, error } = await supabase.from('rb_users').select('*');
            if (error) throw error;
            if (!users || users.length === 0) return { merged: 0, deleted: 0 };

            // 2. Group by Phone
            const groups: Record<string, any[]> = {};
            users.forEach((u: any) => {
                if (u.role === 'deleted') return; // Ignore soft deleted
                const phone = normalizePhone(u.phone || '');
                if (!phone) return;
                if (!groups[phone]) groups[phone] = [];
                groups[phone].push(u);
            });

            let deletedCount = 0;
            let mergedCount = 0;

            // 3. Process Groups
            for (const phone in groups) {
                const group = groups[phone];
                if (group.length < 2) continue; // No duplicates

                console.log(`Merging duplicates for ${phone} (${group.length} records)`);

                // Sort to find Master:
                // Prioritize users with 'admin' role, then most orders, then most points.
                group.sort((a, b) => {
                    if (a.role === 'admin' && b.role !== 'admin') return -1;
                    if (b.role === 'admin' && a.role !== 'admin') return 1;

                    const ordersA = (a.orders || []).length;
                    const ordersB = (b.orders || []).length;
                    if (ordersB !== ordersA) return ordersB - ordersA;

                    return (b.points || 0) - (a.points || 0);
                });

                const master = group[0];
                const victims = group.slice(1);

                // Merge Data
                let combinedPoints = master.points || 0;
                let combinedWallet = master.walletBalance_usd || 0;
                let combinedLifetime = master.lifetimeSpending_usd || 0;
                const allOrders = [...(master.orders || [])];

                // Profile merging to avoid losing names/info
                const invalidNames = ['Cliente', 'Cliente Nuevo', 'Invitado', 'Sin Nombre'];
                // Prioritize "Administrador Ray" or similar strings
                const isPowerName = (n: string) => n.toLowerCase().includes('administrador') || n.toLowerCase().includes('ray');

                let bestName = (master.name && !invalidNames.includes(master.name)) ? master.name : '';

                // If victims have a better "Admin" name, steal it
                victims.forEach(v => {
                    if (v.name && isPowerName(v.name) && (!bestName || !isPowerName(bestName))) {
                        bestName = v.name;
                    }
                });

                if (!bestName) bestName = (master.name && !invalidNames.includes(master.name)) ? master.name : '';
                let bestLastName = master.lastName || '';
                let bestBirthDate = master.birthDate;

                // Map of order IDs to avoid duplicating the EXACT same order object
                const seenOrderIds = new Set(allOrders.map((o: any) => o.orderId));

                victims.forEach(v => {
                    combinedPoints += (v.points || 0);
                    combinedWallet += (v.walletBalance_usd || 0);
                    combinedLifetime += (v.lifetimeSpending_usd || 0);

                    // Steal profile data if master doesn't have it
                    if (!bestName && v.name && !invalidNames.includes(v.name)) bestName = v.name;
                    if (!bestLastName && v.lastName) bestLastName = v.lastName;
                    if (!bestBirthDate && v.birthDate) bestBirthDate = v.birthDate;

                    if (v.orders && Array.isArray(v.orders)) {
                        v.orders.forEach((o: any) => {
                            if (!seenOrderIds.has(o.orderId)) {
                                allOrders.push(o);
                                seenOrderIds.add(o.orderId);
                            }
                        });
                    }
                });

                // Update Master in Cloud
                const { error: updateError } = await supabase
                    .from('rb_users')
                    .update({
                        name: bestName || master.name,
                        lastName: bestLastName || master.lastName,
                        birthDate: bestBirthDate || master.birthDate,
                        points: combinedPoints, // Legacy
                        walletBalance_usd: combinedWallet,
                        lifetimeSpending_usd: combinedLifetime,
                        orders: allOrders
                    })
                    .eq('id', master.id);

                if (updateError) {
                    console.error("Failed to update master", updateError);
                    continue;
                }

                // SOFT DELETE VICTIMS (Because RLS prevents hard DELETE for anon)
                const victimIds = victims.map(v => v.id);
                if (victimIds.length > 0) {
                    // Mark as deleted instead of removing row
                    const { error: delError } = await supabase
                        .from('rb_users')
                        .update({
                            role: 'deleted',
                            name: 'MERGED_DELETED',
                            phone: `DEL_${Date.now()}_${Math.random()}`.substring(0, 15),
                            email: `deleted_${Date.now()}_${Math.random()}@deleted.com`
                        })
                        .in('id', victimIds);

                    if (delError) console.error("Error soft-deleting victims:", delError);
                    deletedCount += victimIds.length;
                    mergedCount++;
                }
            }

            // 4. Force Pull to update Local State and CLEAN local duplicates
            await pullFromCloud({ forceCleanLocal: true });

            setIsSyncing(false);
            return { merged: mergedCount, deleted: deletedCount };

        } catch (e: any) {
            console.error("Merge error:", e);
            setIsSyncing(false);
            return { merged: 0, deleted: 0, error: e.message };
        }
    }, [pullFromCloud, migrateAllToCloud]);

    return {
        isSyncing,
        lastSync,
        pushToCloud,
        fetchFromCloud,
        migrateAllToCloud,
        pullFromCloud,
        wipeCloudData,
        deleteFromCloud,
        mergeDuplicates
    };
};
