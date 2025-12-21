import { useState, useEffect, useCallback } from 'react';

export const useAdmin = () => {
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    useEffect(() => {
        const adminSession = localStorage.getItem('rayburger_admin_session');
        if (adminSession === 'true') {
            setIsAdmin(true);
        }
    }, []);

    const loginAdmin = useCallback((password: string) => {
        // Simple hardcoded password for demo purposes
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
