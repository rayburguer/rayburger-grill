import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export const useAdmin = () => {
    const { currentUser } = useAuth();
    const [isSessionAdmin, setIsSessionAdmin] = useState(() => sessionStorage.getItem('rayburger_admin_verified') === 'true');

    const isAdmin = currentUser?.role === 'admin' || isSessionAdmin;

    const loginAdmin = useCallback((password: string) => {
        if (password === '412781') {
            setIsSessionAdmin(true);
            // Use sessionStorage: Clears when the tab/browser is closed (safer than localStorage)
            sessionStorage.setItem('rayburger_admin_verified', 'true');
            return true;
        }
        return false;
    }, []);

    const logoutAdmin = useCallback(() => {
        setIsSessionAdmin(false);
        sessionStorage.removeItem('rayburger_admin_verified');
        localStorage.removeItem('rayburger_admin_session'); // Cleanup legacy
    }, []);

    return {
        isAdmin,
        loginAdmin,
        logoutAdmin
    };
};
