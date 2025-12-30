import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User } from '../types';
import { calculateLoyaltyTier, normalizePhone } from '../utils/helpers';
import { safeLocalStorage } from '../utils/debounce';
import { hashPassword, isLegacyPassword } from '../utils/security';
import { useCloudSync } from '../hooks/useCloudSync';

interface AuthContextType {
    currentUser: User | null;
    registeredUsers: User[];
    login: (identifier: string, password: string) => Promise<User | null>;
    logout: () => void;
    register: (newUser: User) => Promise<boolean>;
    updateUsers: (users: User[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
                loyaltyTier: u.loyaltyTier || calculateLoyaltyTier(u.points || 0),
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

        let userIndex = registeredUsers.findIndex(u => (u.email === identifier || normalizePhone(u.phone) === normalizedIdentifier));
        let user: User | undefined = registeredUsers[userIndex];

        // FALLBACK: If not found locally, try fetching from Supabase
        if (!user) {
            console.log("☁️ User not found locally, checking Supabase...");
            const { supabase } = await import('../lib/supabase');
            if (supabase) {
                const { data, error } = await supabase
                    .from('rb_users')
                    .select('*')
                    .or(`email.eq.${identifier},phone.eq.${normalizedIdentifier}`) // Check both
                    .single();

                if (data && !error) {
                    console.log("✅ User found in Cloud:", data.email);
                    user = data as User;
                    // We don't add to registeredUsers yet, valid logic will do it below if password matches
                }
            }
        }

        if (!user) return null;

        let isAuthenticated = false;
        let needsMigration = false;

        // Check password (supports legacy)
        if (user.passwordHash === inputHash) {
            isAuthenticated = true;
        } else if (isLegacyPassword(user.passwordHash) && user.passwordHash === password) {
            isAuthenticated = true;
            needsMigration = true;
        }

        if (isAuthenticated) {
            let userToLogin = user;
            if (needsMigration) {
                userToLogin = { ...user, passwordHash: inputHash };
            }

            // Update Local State if we fetched from cloud or migrated
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

    const register = useCallback(async (newUserInput: User) => {
        // Normalize phone: standard 10 digits
        const normalizedPhone = normalizePhone(newUserInput.phone);

        // Robust Check: Compare against normalized stored phones
        if (registeredUsers.some(u => normalizePhone(u.phone) === normalizedPhone || u.email === newUserInput.email)) {
            console.warn("User already exists locally (Phone/Email match)");
            return false;
        }

        // CLOUD CHECK: Prevent duplicates against Supabase
        const { supabase } = await import('../lib/supabase');
        if (supabase) {
            const { data } = await supabase
                .from('rb_users')
                .select('id')
                .or(`email.eq.${newUserInput.email},phone.eq.${normalizedPhone}`)
                .maybeSingle(); // Use maybeSingle to avoid 406 error if none found

            if (data) {
                console.warn("⛔ User already exists in Supabase!");
                return false;
            }
        }

        const passwordHash = await hashPassword(newUserInput.passwordHash);
        const newUser: User = {
            ...newUserInput,
            phone: normalizedPhone, // Store normalized phone
            passwordHash,
            points: 50,
            lastPointsUpdate: Date.now(),
            loyaltyTier: calculateLoyaltyTier(50)
        };

        if (newUser.referredByCode) {
            const referrer = registeredUsers.find(u => u.referralCode === newUser.referredByCode);
            // ANTI-FRAUD: Cannot refer self (same phone) and code must exist
            if (!referrer || referrer.phone === newUser.phone || newUser.referralCode === newUser.referredByCode) {
                console.warn("Invalid referral: Self-referral or code not found");
                newUser.referredByCode = undefined; // Strip invalid referral but allow registration
                newUser.nextPurchaseMultiplier = 1;
            }
        }

        const updatedList = [...registeredUsers, newUser];
        setRegisteredUsers(updatedList);
        setCurrentUser(newUser);
        saveCurrentUserImmediate(newUser);

        // Instant sync for new user
        const usersToSync = updatedList.map(u => ({ ...u, id: u.email }));
        await pushToCloud('rb_users', usersToSync);

        return true;
    }, [registeredUsers, saveCurrentUserImmediate, pushToCloud]);

    const updateUsers = useCallback(async (users: User[]) => {
        setRegisteredUsers(users);
        saveUsersImmediate(users); // Instant local persistence
        // Instant sync for critical user data (points, roles, etc)
        const usersToSync = users.map(u => ({ ...u, id: u.email }));
        await pushToCloud('rb_users', usersToSync);

        // Notify other components in the same tab, but mark the source
        window.dispatchEvent(new CustomEvent('rayburger_users_updated', { detail: { source: 'useAuth' } }));
    }, [pushToCloud, saveUsersImmediate]); // Fixed dependency

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

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
