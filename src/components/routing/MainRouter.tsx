import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Storefront from '../../Storefront';
import AdminDashboard from '../admin/AdminDashboard';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import Toast from '../ui/Toast';
import { useState, useCallback } from 'react';

const MainRouter: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser, registeredUsers, updateUsers } = useAuth();
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
                {/* Storefront Route */}
                <Route path="/" element={<Storefront />} />

                {/* Admin Route - Protected */}
                <Route
                    path="/admin"
                    element={
                        currentUser?.role === 'admin' ? (
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
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {isToastVisible && <Toast message={toastMessage} onClose={closeToast} />}
        </>
    );
};

export default MainRouter;
