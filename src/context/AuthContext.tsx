import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User } from '../types';
import { calculateLoyaltyTier } from '../utils/helpers';
import { debounce, safeLocalStorage } from '../utils/debounce';
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
    const { pushToCloud } = useCloudSync();

    // Flag to prevent recursive updates between sync cycles
    const isUpdatingRef = useRef(false);
    const syncAttemptsRef = useRef(0);
    const lastSyncTimeRef = useRef(Date.now());

    // Debounced localStorage save functions
    const saveUsersDebounced = useRef(
        debounce((users: User[]) => {
            safeLocalStorage.setItem('rayburger_registered_users', JSON.stringify(users));
        }, 500)
    ).current;

    const saveCurrentUserDebounced = useRef(
        debounce((user: User | null) => {
            if (user) {
                safeLocalStorage.setItem('rayburger_current_user', JSON.stringify(user));
            } else {
                safeLocalStorage.removeItem('rayburger_current_user');
            }
        }, 300)
    ).current;

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
                    const masterEmails = ['raimundovivas17@gmail.com'];
                    const masterPhones = ['04128344594', '04243439729', '04162101833'];

                    let usersList = parsedUsers.map(migrateUser);

                    // Ensure all master credentials have admin role
                    usersList = usersList.map(u => {
                        if (masterEmails.includes(u.email) || masterPhones.includes(u.phone)) {
                            return { ...u, role: 'admin' as const };
                        }
                        return u;
                    });

                    const adminExists = usersList.some(u => masterEmails.includes(u.email));
                    if (!adminExists) {
                        usersList.push({
                            name: 'Administrador Ray',
                            email: 'raimundovivas17@gmail.com',
                            passwordHash: '412781', // Admin pass for master
                            phone: '04128344594',
                            role: 'admin',
                            points: 1000,
                            loyaltyTier: 'Diamond',
                            referralCode: 'ADMIN-MASTER',
                            orders: [],
                            lastPointsUpdate: Date.now()
                        });
                    }
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

    // Save registeredUsers to localStorage
    useEffect(() => {
        if (registeredUsers.length > 0) {
            saveUsersDebounced(registeredUsers);
        }
    }, [registeredUsers, saveUsersDebounced]);

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
                    saveCurrentUserDebounced(updatedUserInList);
                    // cooldown to prevent rapid-fire updates
                    setTimeout(() => { isUpdatingRef.current = false; }, 300);
                }
            }
        }
    }, [registeredUsers, currentUser, saveCurrentUserDebounced]);

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
        let userIndex = registeredUsers.findIndex(u => (u.email === identifier || u.phone === identifier));

        if (userIndex === -1) return null;

        const user = registeredUsers[userIndex];
        let isAuthenticated = false;
        let needsMigration = false;

        if (user.passwordHash === inputHash) {
            isAuthenticated = true;
        } else if (isLegacyPassword(user.passwordHash) && user.passwordHash === password) {
            isAuthenticated = true;
            needsMigration = true;
        }

        if (isAuthenticated) {
            let userToLogin = user;
            if (needsMigration) {
                const updatedUser = { ...user, passwordHash: inputHash };
                const newUsersList = [...registeredUsers];
                newUsersList[userIndex] = updatedUser;
                setRegisteredUsers(newUsersList);
                userToLogin = updatedUser;
            }
            setCurrentUser(userToLogin);
            saveCurrentUserDebounced(userToLogin);
            return userToLogin;
        }
        return null;
    }, [registeredUsers, saveCurrentUserDebounced]);

    const logout = useCallback(() => {
        setCurrentUser(null);
        safeLocalStorage.removeItem('rayburger_current_user');
    }, []);

    const register = useCallback(async (newUserInput: User) => {
        // Normalize phone: remove all non-digits
        const normalizedPhone = newUserInput.phone.replace(/\D/g, '');

        // Robust Check: Compare against normalized stored phones
        if (registeredUsers.some(u => u.phone.replace(/\D/g, '') === normalizedPhone || u.email === newUserInput.email)) {
            console.warn("User already exists (Phone/Email match)");
            return false;
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
        saveCurrentUserDebounced(newUser);

        // Instant sync for new user
        const usersToSync = updatedList.map(u => ({ ...u, id: u.email }));
        await pushToCloud('rb_users', usersToSync);

        return true;
    }, [registeredUsers, saveCurrentUserDebounced, pushToCloud]);

    const updateUsers = useCallback(async (users: User[]) => {
        setRegisteredUsers(users);
        saveUsersDebounced(users);
        // Instant sync for critical user data (points, roles, etc)
        const usersToSync = users.map(u => ({ ...u, id: u.email }));
        await pushToCloud('rb_users', usersToSync);

        // Notify other components in the same tab, but mark the source
        window.dispatchEvent(new CustomEvent('rayburger_users_updated', { detail: { source: 'useAuth' } }));
    }, [pushToCloud, saveUsersDebounced]); // Fixed dependency

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
