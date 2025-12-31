import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Storefront from '../../pages/client/Storefront'; // Correct path
import AdminRoute from '../auth/guards/AdminRoute'; // Import AdminRoute
import Toast from '../ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';

// Lazy Load AdminDashboard
const AdminDashboard = React.lazy(() => import('../admin/AdminDashboard'));

// Loading Spinner Component
const AdminLoading = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-orange-500 font-bold animate-pulse">Cargando Panel Admin...</p>
        </div>
    </div>
);
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
                        <React.Suspense fallback={<AdminLoading />}>
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
                        </React.Suspense>
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
