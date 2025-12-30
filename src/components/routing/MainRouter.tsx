import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Storefront from '../../pages/client/Storefront'; // Correct path
import AdminRoute from '../auth/guards/AdminRoute'; // Import AdminRoute
import AdminDashboard from '../admin/AdminDashboard';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import Toast from '../ui/Toast';
const MainRouter: React.FC = () => {
    const navigate = useNavigate();
    const { registeredUsers, updateUsers } = useAuth();
    const { tasaBs, updateTasa, guestOrders, updateGuestOrders } = useSettings();
    const [isToastVisible, setIsToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setIsToastVisible(true);
    }, []);

    const closeToast = useCallback(() => {
        setIsToastVisible(false);
    }, []);

    return (
        <>
            <Routes>
                {/* 🛒 VISTA CLIENTE (Pública) */}
                <Route path="/" element={<Storefront />} />

                {/* 🔐 VISTA ADMIN (Protegida) */}
                <Route path="/admin" element={<AdminRoute />}>
                    <Route index element={
                        <AdminDashboard
                            isOpen={true}
                            onClose={() => navigate('/')}
                            registeredUsers={registeredUsers}
                            updateUsers={updateUsers}
                            tasaBs={tasaBs}
                            onUpdateTasa={updateTasa}
                            guestOrders={guestOrders}
                            updateGuestOrders={updateGuestOrders}
                            onShowToast={showToast}
                        />
                    } />
                    {/* Aquí podrías agregar más subrutas: /admin/products, /admin/orders, etc. */}
                </Route>

                {/* 🔄 REDIRECCIONES */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {isToastVisible && <Toast message={toastMessage} onClose={closeToast} />}
        </>
    );
};

export default MainRouter;
