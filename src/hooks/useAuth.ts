import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../types';
import { calculateLoyaltyTier } from '../utils/helpers';
import { debounce, safeLocalStorage } from '../utils/debounce';
import { hashPassword, isLegacyPassword } from '../utils/security';
import { useCloudSync } from './useCloudSync';

export const useAuth = () => {
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
                    let usersList = parsedUsers.map(migrateUser);

                    // SEED ADMIN IF MISSING (Self-Healing)
                    const adminExists = usersList.some(u => u.role === 'admin');
                    if (!adminExists) {
                        usersList.push({
                            name: 'Administrador Ray',
                            email: 'admin@rayburger.com',
                            passwordHash: 'raimundo27811341', // Legacy plain text, will auto-hash on login
                            phone: '0000000000',
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

        const updatedUserInList = registeredUsers.find(u => u.email === currentUser.email);

        // If user not found in list, don't do anything (prevents loops)
        if (!updatedUserInList) {
            return;
        }
        if (updatedUserInList) {
            const currentStr = JSON.stringify(currentUser);
            const updatedStr = JSON.stringify(updatedUserInList);

            if (currentStr !== updatedStr) {
                const hasCriticalChanges =
                    updatedUserInList.points !== currentUser.points ||
                    updatedUserInList.loyaltyTier !== currentUser.loyaltyTier ||
                    updatedUserInList.orders?.length !== currentUser.orders?.length ||
                    updatedUserInList.passwordHash !== currentUser.passwordHash;

                if (hasCriticalChanges) {
                    isUpdatingRef.current = true;
                    setCurrentUser(updatedUserInList);
                    saveCurrentUserDebounced(updatedUserInList);
                    setTimeout(() => { isUpdatingRef.current = false; }, 100);
                }
            }
        }
    }, [registeredUsers, currentUser, saveCurrentUserDebounced]);

    // Sync with other tabs/instances via storage events
    useEffect(() => {
        const syncUsersWithLocalStorage = () => {
            if (isUpdatingRef.current) return;

            // Basic debounce for sync events
            const now = Date.now();
            if (now - lastSyncTimeRef.current < 2000) { // Increased to 2s
                syncAttemptsRef.current++;
                if (syncAttemptsRef.current > 5) { // Increased retry limit
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

                    // DEEP EQUALITY CHECK (Expensive but safe against loops)
                    // We only compare critical fields to avoid false positives on non-essential data
                    const currentJson = JSON.stringify(registeredUsers);
                    const storedJson = JSON.stringify(storedUsers);

                    if (currentJson !== storedJson) {
                        isUpdatingRef.current = true;
                        setRegisteredUsers(storedUsers);
                        // Longer cooldown to let state settle
                        setTimeout(() => { isUpdatingRef.current = false; }, 500);
                    }
                } catch (e) {
                    console.error("Failed to sync users", e);
                }
            }
        };

        window.addEventListener('storage', syncUsersWithLocalStorage);
        // Note: 'rayburger_users_updated' purely internal if we add dispatchers in future
        window.addEventListener('rayburger_users_updated', syncUsersWithLocalStorage);

        return () => {
            window.removeEventListener('storage', syncUsersWithLocalStorage);
            window.removeEventListener('rayburger_users_updated', syncUsersWithLocalStorage);
        };
    }, [registeredUsers]);

    const login = useCallback(async (identifier: string, password: string) => {
        const inputHash = await hashPassword(password);
        let userIndex = registeredUsers.findIndex(u => (u.email === identifier || u.phone === identifier));

        if (userIndex === -1) return false;

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
            return true;
        }
        return false;
    }, [registeredUsers, saveCurrentUserDebounced]);

    const logout = useCallback(() => {
        setCurrentUser(null);
        safeLocalStorage.removeItem('rayburger_current_user');
    }, []);

    const register = useCallback(async (newUserInput: User) => {
        if (registeredUsers.some(u => u.phone === newUserInput.phone || u.email === newUserInput.email)) {
            console.warn("User already exists");
            return false;
        }

        const passwordHash = await hashPassword(newUserInput.passwordHash);
        const newUser: User = {
            ...newUserInput,
            passwordHash,
            points: 50,
            lastPointsUpdate: Date.now(),
            loyaltyTier: calculateLoyaltyTier(50)
        };

        if (newUser.referredByCode) {
            const referrer = registeredUsers.find(u => u.referralCode === newUser.referredByCode);
            if (!referrer || newUser.referralCode === newUser.referredByCode) {
                console.warn("Invalid referral");
                return false;
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
        // Instant sync for critical user data (points, roles, etc)
        const usersToSync = users.map(u => ({ ...u, id: u.email }));
        await pushToCloud('rb_users', usersToSync);
    }, [pushToCloud]);

    return {
        currentUser,
        registeredUsers,
        login,
        logout,
        register,
        updateUsers
    };
};
