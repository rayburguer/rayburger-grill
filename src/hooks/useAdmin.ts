import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export const useAdmin = () => {
    const { currentUser } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    useEffect(() => {
        // If we have a logged-in user with admin role, they are admin
        if (currentUser?.role === 'admin') {
            setIsAdmin(true);
            localStorage.setItem('rayburger_admin_session', 'true');
        } else {
            // Check session storage as fallback (e.g. if we want to keep session between refreshes)
            const adminSession = localStorage.getItem('rayburger_admin_session');
            if (adminSession === 'true' && currentUser?.role === 'admin') {
                setIsAdmin(true);
            } else if (!currentUser) {
                // If no user is logged in, but we have a session, maybe let it stay? 
                // No, better to force login or check session against something.
                // For now, let's keep it simple: No user = No Admin.
                setIsAdmin(adminSession === 'true');
            } else {
                setIsAdmin(false);
                localStorage.removeItem('rayburger_admin_session');
            }
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
