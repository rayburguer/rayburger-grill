import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';

const AdminRoute: React.FC = () => {
    const { currentUser } = useAuth();
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdminStatus = async () => {
            // 1. Check if we have a user in context first (fast check)
            if (currentUser?.role === 'admin') {
                setIsAdmin(true);
                setIsVerifying(false);
                return;
            }

            // 2. Fallback: Double check with Supabase DB directly (secure check)
            // This prevents "flicker" if context is slow to load
            if (currentUser?.email) {
                const { data } = await supabase
                    .from('rb_users')
                    .select('role')
                    .eq('email', currentUser.email)
                    .single();

                if (data?.role === 'admin') {
                    setIsAdmin(true);
                }
            }

            setIsVerifying(false);
        };

        checkAdminStatus();
    }, [currentUser]);

    if (isVerifying) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                Verificando permisos...
            </div>
        );
    }

    return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;
