import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export const useAdmin = () => {
    const { currentUser } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    useEffect(() => {
        // --- SECURE ACCESS: Admin status is STRICTLY tied to the authenticated user's role ---
        if (currentUser?.role === 'admin') {
            setIsAdmin(true);
        } else {
            // Memory check: If the user entered the correct master password in this session
            // we allow them to stay admin as a 'POS Terminal' mode, 
            // but we don't trust localStorage strings anymore.
            const sessionIsVerified = sessionStorage.getItem('rayburger_admin_verified') === 'true';
            if (sessionIsVerified) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        }
    }, [currentUser]);

    const loginAdmin = useCallback((password: string) => {
        if (password === '412781') {
            setIsAdmin(true);
            // Use sessionStorage: Clears when the tab/browser is closed (safer than localStorage)
            sessionStorage.setItem('rayburger_admin_verified', 'true');
            return true;
        }
        return false;
    }, []);

    const logoutAdmin = useCallback(() => {
        setIsAdmin(false);
        sessionStorage.removeItem('rayburger_admin_verified');
        localStorage.removeItem('rayburger_admin_session'); // Cleanup legacy
    }, []);

    return {
        isAdmin,
        loginAdmin,
        logoutAdmin
    };
};
