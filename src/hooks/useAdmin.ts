import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export const useAdmin = () => {
    const { currentUser } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    useEffect(() => {
        // --- PERSISTENCE: Check if there's a manual admin session active ---
        const manualAdmin = localStorage.getItem('rayburger_admin_session') === 'true';

        // If we have a logged-in user with admin role, syncing is good
        if (currentUser?.role === 'admin') {
            setIsAdmin(true);
            localStorage.setItem('rayburger_admin_session', 'true');
        } else if (manualAdmin) {
            // If we have manual session, let it stay even if currentUser is customer or guest.
            // This is "POS Mode": the terminal stays admin even if users register on it.
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    }, [currentUser]);

    const loginAdmin = useCallback((password: string) => {
        if (password === 'raimundo27811341') {
            setIsAdmin(true);
            localStorage.setItem('rayburger_admin_session', 'true');
            return true;
        }
        return false;
    }, []);

    const logoutAdmin = useCallback(() => {
        setIsAdmin(false);
        localStorage.removeItem('rayburger_admin_session');
    }, []);

    return {
        isAdmin,
        loginAdmin,
        logoutAdmin
    };
};
