import React, { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User } from '../types';
import { normalizePhone } from '../utils/helpers';
import { safeLocalStorage } from '../utils/debounce';
import { hashPassword, isLegacyPassword } from '../utils/security';
import { useCloudSync } from '../hooks/useCloudSync';
import { mapDbUserToApp } from '../utils/dbMapper';
import { AuthContext } from './AuthContextType';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
    const { pushToCloud, pullFromCloud } = useCloudSync();

    // Flag to prevent recursive updates between sync cycles
    const isUpdatingRef = useRef(false);
    const syncAttemptsRef = useRef(0);
    const lastSyncTimeRef = useRef(Date.now());

    // Immediate localStorage save functions to avoid race conditions during refresh
    const saveUsersImmediate = useCallback((users: User[]) => {
        safeLocalStorage.setItem('rayburger_registered_users', JSON.stringify(users));
    }, []);

    const saveCurrentUserImmediate = useCallback((user: User | null) => {
        if (user) {
            safeLocalStorage.setItem('rayburger_current_user', JSON.stringify(user));
        } else {
            safeLocalStorage.removeItem('rayburger_current_user');
        }
    }, []);

    // Load data from localStorage on mount ONLY
    useEffect(() => {
        try {
            const migrateUser = (u: any): User => ({
                ...u,
                orders: Array.isArray(u.orders) ? u.orders : [],
                points: typeof u.points === 'number' ? u.points : 0,
                loyaltyTier: u.loyaltyTier || 'Bronze',
                referralCode: u.referralCode || `RB-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                lastPointsUpdate: u.lastPointsUpdate || Date.now()
            });

            const storedUsers = safeLocalStorage.getItem('rayburger_registered_users');
            if (storedUsers) {
                const parsedUsers = JSON.parse(storedUsers);
                if (Array.isArray(parsedUsers)) {
                    // SEED ADMIN IF MISSING (Self-Healing)
                    const usersList = parsedUsers.map(migrateUser);
                    setRegisteredUsers(usersList);
                }
            }

            const storedCurrentUser = safeLocalStorage.getItem('rayburger_current_user');
            if (storedCurrentUser) {
                const parsedUser = JSON.parse(storedCurrentUser);
                if (parsedUser && parsedUser.email) {
                    const migratedUser = migrateUser(parsedUser);

                    // Expiración lógica
                    const now = Date.now();
                    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
                    if (migratedUser.points > 0 && migratedUser.lastPointsUpdate && (now - migratedUser.lastPointsUpdate > THIRTY_DAYS)) {
                        migratedUser.points = 0;
                        migratedUser.lastPointsUpdate = now;
                    }
                    setCurrentUser(migratedUser);
                }
            }
        } catch (error) {
            console.error("Critical error loading data from localStorage:", error);
        }
    }, []);

    // Initial reconciliation with Cloud to ensure truth is preserved
    const initialSyncRef = useRef(false);
    useEffect(() => {
        if (!initialSyncRef.current && navigator.onLine) {
            initialSyncRef.current = true;
            console.log("☁️ Initializing Cloud Reconciliation...");
            pullFromCloud();
        }
    }, [pullFromCloud]);

    // Save registeredUsers to localStorage (Immediate for critical consistency)
    useEffect(() => {
        if (registeredUsers.length > 0) {
            saveUsersImmediate(registeredUsers);
        }
    }, [registeredUsers, saveUsersImmediate]);

    // Sync currentUser with registeredUsers
    useEffect(() => {
        if (isUpdatingRef.current || !currentUser || !Array.isArray(registeredUsers)) {
            return;
        }

        // Skip if registeredUsers is empty (initial state)
        if (registeredUsers.length === 0) {
            return;
        }

        // Find the OTHER immutable record of the user in the list
        const updatedUserInList = registeredUsers.find(u => u.email === currentUser.email);

        if (updatedUserInList) {
            const currentStr = JSON.stringify(currentUser);
            const updatedStr = JSON.stringify(updatedUserInList);

            if (currentStr !== updatedStr) {
                // Determine if the change is significant enough to warrant a state update
                const hasCriticalChanges =
                    updatedUserInList.points !== currentUser.points ||
                    updatedUserInList.loyaltyTier !== currentUser.loyaltyTier ||
                    updatedUserInList.role !== currentUser.role ||
                    updatedUserInList.orders?.length !== currentUser.orders?.length ||
                    updatedUserInList.passwordHash !== currentUser.passwordHash;

                if (hasCriticalChanges) {
                    isUpdatingRef.current = true;
                    setCurrentUser(updatedUserInList);
                    saveCurrentUserImmediate(updatedUserInList);
                    // cooldown to prevent rapid-fire updates
                    setTimeout(() => { isUpdatingRef.current = false; }, 300);
                }
            }
        }
    }, [registeredUsers, currentUser, saveCurrentUserImmediate]);

    // --- REALTIME LISTENER FOR SUPABASE ---
    useEffect(() => {
        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
            console.log("🔌 Initializing Supabase Realtime Listener...");
        }

        // Subscribe to changes in rb_users
        import('../lib/supabase').then(({ supabase }) => {
            if (!supabase) return;

            const channel = supabase
                .channel('public:rb_users')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'rb_users' }, (payload) => {
                    console.log('⚡ Realtime change received:', payload);

                    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                        // Dispatch event to force reload or update internal state
                        // Dispatch event to force reload or update internal state
                        // merging logic should happen in useCloudSync's pull or here directly for simple updates
                        // Ideally trigger a pull to handle complex merging
                        window.dispatchEvent(new CustomEvent('rayburger_users_updated', { detail: { source: 'realtime' } }));
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        });
    }, []);

    // Sync with other tabs/instances via storage events
    useEffect(() => {
        const syncUsersWithLocalStorage = (e: any) => {
            if (isUpdatingRef.current) return;

            // If the event was triggered by this specific tab's own setItem, ignore it
            // Note: Native 'storage' event doesn't fire in the same tab, but custom events might.
            if (e.detail?.source === 'useAuth') return;

            // Basic debounce for sync events
            const now = Date.now();
            if (now - lastSyncTimeRef.current < 2000) {
                syncAttemptsRef.current++;
                if (syncAttemptsRef.current > 5) {
                    console.warn("⚠️ Sync rate limit hit. Pausing sync for a moment.");
                    return;
                }
            } else {
                syncAttemptsRef.current = 0;
            }
            lastSyncTimeRef.current = now;

            const storedUsersString = safeLocalStorage.getItem('rayburger_registered_users');
            if (storedUsersString) {
                try {
                    const storedUsers = JSON.parse(storedUsersString) as User[];

                    const currentJson = JSON.stringify(registeredUsers);
                    const storedJson = JSON.stringify(storedUsers);

                    if (currentJson !== storedJson) {
                        isUpdatingRef.current = true;
                        setRegisteredUsers(storedUsers);
                        // Longer cooldown to let state settle
                        setTimeout(() => { isUpdatingRef.current = false; }, 1000);
                    }
                } catch (e) {
                    console.error("Failed to sync users", e);
                }
            }
        };

        window.addEventListener('storage', syncUsersWithLocalStorage);
        window.addEventListener('rayburger_users_updated', syncUsersWithLocalStorage);

        return () => {
            window.removeEventListener('storage', syncUsersWithLocalStorage);
            window.removeEventListener('rayburger_users_updated', syncUsersWithLocalStorage);
        };
    }, [registeredUsers]);



    const login = useCallback(async (identifier: string, password: string) => {
        const inputHash = await hashPassword(password);
        const normalizedIdentifier = normalizePhone(identifier);

        let user: User | undefined;

        // 🛡️ CLOUD-FIRST LOGIN: Always check Supabase first
        try {
            const { supabase } = await import('../lib/supabase');
            if (supabase) {
                const possibleEmail = identifier.includes('@') ? identifier : `${normalizedIdentifier}@rayburger.app`;
                const possibleEmailPrefixed = identifier.includes('@') ? identifier : `58${normalizedIdentifier}@rayburger.app`;

                // EMERGENCY BYPASS FOR OWNERS (2781)
                const ownerBases = ['4128344594', '4243439729', '4162101833', '4141621018']; // Added potential 414 variation if exists
                const isOwnerPhone = ownerBases.includes(normalizedIdentifier) || normalizedIdentifier.endsWith('8344594');

                console.log("🔍 Login Attempt:", {
                    original: identifier,
                    normalized: normalizedIdentifier,
                    isOwner: isOwnerPhone,
                    hasSupabase: !!supabase
                });

                if (isOwnerPhone && (password === '2781' || password === '412781')) {
                    console.log("👑 Emergency Owner Bypass Activated");
                }

                const { data: users, error } = await supabase
                    .from('rb_users')
                    .select('*')
                    .or(`email.eq.${identifier},email.eq.${possibleEmail},email.eq.${possibleEmailPrefixed},phone.eq.${normalizedIdentifier},phone.eq.58${normalizedIdentifier}`);

                if (users && users.length > 0 && !error) {
                    console.log(`✅ ${users.length} match(es) in Cloud. picking best account...`);
                    // Sort to pick admin first, then most points
                    const sorted = [...users].sort((a, b) => {
                        if (a.role === 'admin' && b.role !== 'admin') return -1;
                        if (b.role === 'admin' && a.role !== 'admin') return 1;
                        return (b.points || 0) - (a.points || 0);
                    });
                    user = mapDbUserToApp(sorted[0]);
                } else if (error) {
                    console.warn("☁️ Supabase lookup error:", error.message);
                }
            }
        } catch (cloudError) {
            console.warn("☁️ Cloud unavailable, checking local cache...", cloudError);
        }

        // FALLBACK: If cloud fails (offline), check localStorage
        if (!user) {
            const localUser = registeredUsers.find(u =>
                u.email === identifier || normalizePhone(u.phone) === normalizedIdentifier
            );
            if (localUser) {
                console.log("📦 User found in Local Cache");
                user = localUser;
            }
        }

        // --- EMERGENCY MASTER KEY CHECK (Before "User Not Found" block) ---
        const ownerBases = ['4128344594', '4243439729', '4162101833', '4141621018', '4122834459', '412834459'];
        const isOwner = ownerBases.includes(normalizedIdentifier) || normalizedIdentifier.endsWith('8344594');
        const isMasterKey = isOwner && (password === '2781' || password === '412781');

        if (isMasterKey) {
            console.log("👑 Admin Master Key Accepted (Override)");
            alert(' Llave Maestra (v2.0) Detectada. Creando Usuario Fantasma...');
            isAuthenticated = true;
            // If user wasn't found in DB/Cache, create a "Ghost Admin" to allow entry
            if (!user) {
                user = {
                    id: 'master-admin-ghost',
                    email: identifier.includes('@') ? identifier : `${normalizedIdentifier}@rayburger.app`,
                    phone: normalizedIdentifier,
                    name: 'Raimundo Dueño (Ghost)',
                    role: 'admin',
                    passwordHash: '2781',
                    points: 999999,
                    preferences: {},
                    walletBalance_usd: 0,
                    lifetimeSpending_usd: 0,
                    orders: [],
                    loyaltyTier: 'Diamond',
                    referralCode: 'GOLDEN-TICKET'
                } as User;
            }
        }

        if (!user && !isAuthenticated) {
            console.error("❌ Login Fail: User not found with identifier:", identifier);
            return null;
        }

        let needsMigration = false;
        // Logic below continues...

        // Check password (supports legacy)
        if (!isAuthenticated) {
            if (user.passwordHash === inputHash) {
                isAuthenticated = true;
            } else if (isLegacyPassword(user.passwordHash) && user.passwordHash === password) {
                isAuthenticated = true;
                needsMigration = true;
            }
        }

        if (isAuthenticated) {
            let userToLogin = user;
            if (needsMigration) {
                userToLogin = { ...user, passwordHash: inputHash };
            }

            // Update Local State Cache
            setRegisteredUsers(prev => {
                const existingIdx = prev.findIndex(u => u.email === userToLogin.email);
                if (existingIdx >= 0) {
                    const newList = [...prev];
                    newList[existingIdx] = userToLogin;
                    return newList;
                }
                return [...prev, userToLogin];
            });

            setCurrentUser(userToLogin);
            saveCurrentUserImmediate(userToLogin);

            // Sync this single user update back to cloud if migrated
            if (needsMigration) {
                pushToCloud('rb_users', [userToLogin]);
            }

            return userToLogin;
        }
        return null;
    }, [registeredUsers, saveCurrentUserImmediate, pushToCloud]);

    const logout = useCallback(() => {
        setCurrentUser(null);
        safeLocalStorage.removeItem('rayburger_current_user');
    }, []);

    const register = useCallback(async (newUser: User) => {
        // If user already comes from the server (has ID), we just update local state
        if (newUser.id) {
            setRegisteredUsers(prev => {
                const exists = prev.some(u => u.email === newUser.email);
                if (exists) return prev.map(u => u.email === newUser.email ? newUser : u);
                return [...prev, newUser];
            });
            setCurrentUser(newUser);
            saveCurrentUserImmediate(newUser);
            return true;
        }

        // --- LEGUEST/FALLBACK REGISTRATION (Should be replaced by RPC) ---
        const normalizedPhone = normalizePhone(newUser.phone);
        const { supabase } = await import('../lib/supabase');

        if (supabase) {
            const { data } = await supabase
                .from('rb_users')
                .select('id')
                .or(`email.eq.${newUser.email},phone.eq.${normalizedPhone}`)
                .maybeSingle();

            if (data) return false;
        }

        const passwordHash = await hashPassword(newUser.passwordHash);
        const userToRegister: User = {
            ...newUser,
            phone: normalizedPhone,
            passwordHash,
            points: 50,
            registrationDate: Date.now(),
            loyaltyTier: 'Bronze',
            role: 'customer',
            orders: []
        };

        const updatedList = [...registeredUsers, userToRegister];
        setRegisteredUsers(updatedList);
        setCurrentUser(userToRegister);
        saveCurrentUserImmediate(userToRegister);

        // Notify cloud (Legacy sync)
        await pushToCloud('rb_users', [userToRegister]);

        return true;
    }, [registeredUsers, saveCurrentUserImmediate, pushToCloud]);

    const updateUsers = useCallback(async (users: User[]) => {
        // 1. Instant state update for snappy UI
        setRegisteredUsers(users);

        // 2. Offload heavy processing to avoid blocking main thread (INP optimization)
        setTimeout(async () => {
            try {
                // Deduplicate orders within each user before saving
                const sanitizedUsers = users.map(user => {
                    if (!user.orders || user.orders.length === 0) return user;

                    const seen = new Set<string>();
                    const statusP: Record<string, number> = { 'approved': 4, 'delivered': 3, 'shipped': 2, 'preparing': 1, 'pending': 0 };

                    const dedupedOrders = [...user.orders].sort((a, b) => (statusP[b.status] || 0) - (statusP[a.status] || 0))
                        .filter(o => {
                            if (seen.has(o.orderId)) return false;
                            seen.add(o.orderId);
                            return true;
                        });

                    return { ...user, orders: dedupedOrders };
                });

                saveUsersImmediate(sanitizedUsers);

                const usersToSync = sanitizedUsers.map(u => ({ ...u, id: u.email }));
                await pushToCloud('rb_users', usersToSync);

                window.dispatchEvent(new CustomEvent('rayburger_users_updated', { detail: { source: 'useAuth' } }));
            } catch (err) {
                console.error("❌ Deferred update failed:", err);
            }
        }, 0);
    }, [pushToCloud, saveUsersImmediate]);

    return (
        <AuthContext.Provider value={{
            currentUser,
            registeredUsers,
            login,
            logout,
            register,
            updateUsers
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// useAuthContext hook is now in src/hooks/useAuth.ts
