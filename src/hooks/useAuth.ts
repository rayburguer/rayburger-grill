import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../types';
import { calculateLoyaltyTier } from '../utils/helpers';
import { debounce, safeLocalStorage } from '../utils/debounce';

export const useAuth = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);

    // Ref to track if we're in the middle of an update to prevent circular updates
    const isUpdatingRef = useRef(false);

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
                    setRegisteredUsers(parsedUsers.map(migrateUser));
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
    }, []); // Empty dependency array - only run once on mount

    // Save registeredUsers to localStorage with debouncing
    useEffect(() => {
        if (registeredUsers.length > 0) {
            saveUsersDebounced(registeredUsers);
        }
    }, [registeredUsers, saveUsersDebounced]);

    // Sync currentUser with registeredUsers - OPTIMIZED to prevent infinite loops
    useEffect(() => {
        if (isUpdatingRef.current || !currentUser || !Array.isArray(registeredUsers)) {
            return;
        }

        const updatedUserInList = registeredUsers.find(u => u.email === currentUser.email);
        if (updatedUserInList) {
            // Only update if there are actual changes
            const hasChanges =
                updatedUserInList.points !== currentUser.points ||
                updatedUserInList.loyaltyTier !== currentUser.loyaltyTier ||
                updatedUserInList.orders?.length !== currentUser.orders?.length ||
                updatedUserInList.referralCode !== currentUser.referralCode;

            if (hasChanges) {
                isUpdatingRef.current = true;
                setCurrentUser(updatedUserInList);
                saveCurrentUserDebounced(updatedUserInList);
                // Reset flag after state update completes
                setTimeout(() => {
                    isUpdatingRef.current = false;
                }, 0);
            }
        }
    }, [registeredUsers]); // Removed currentUser from dependencies to break circular loop

    const login = useCallback((identifier: string, password: string) => {
        const user = registeredUsers.find(u =>
            (u.email === identifier || u.phone === identifier) && u.passwordHash === password
        );
        if (user) {
            setCurrentUser(user);
            saveCurrentUserDebounced(user);
            return true;
        }
        return false;
    }, [registeredUsers, saveCurrentUserDebounced]);

    const logout = useCallback(() => {
        setCurrentUser(null);
        safeLocalStorage.removeItem('rayburger_current_user');
    }, []);

    const register = useCallback((newUserInput: User) => {
        // 1. Enforce uniqueness for Phone
        if (registeredUsers.some(u => u.phone === newUserInput.phone)) {
            console.warn("User with this phone already exists");
            return false;
        }

        const newUser: User = {
            ...newUserInput, // Spread input properties
            points: 50, // WELCOME BONUS
            lastPointsUpdate: Date.now(), // Iniciamos contador
            loyaltyTier: calculateLoyaltyTier(50)
        };

        // Anti-Fraud check blocks
        if (newUser.referredByCode) {
            // Check if referral code exists
            const referrer = registeredUsers.find(u => u.referralCode === newUser.referredByCode);
            if (!referrer) {
                console.warn("Invalid referral code");
                return false;
            }

            // Block if trying to use own code (shouldn't happen, but extra safety)
            if (newUser.referralCode === newUser.referredByCode) {
                console.warn("Cannot use your own referral code");
                return false;
            }
        }

        setRegisteredUsers(prevUsers => [...prevUsers, newUser]);
        setCurrentUser(newUser); // Auto-login
        saveCurrentUserDebounced(newUser);
        return true;
    }, [registeredUsers, saveCurrentUserDebounced]);

    const updateUsers = useCallback((users: User[]) => {
        setRegisteredUsers(users);
    }, []);

    return {
        currentUser,
        registeredUsers,
        login,
        logout,
        register,
        updateUsers
    };
};
