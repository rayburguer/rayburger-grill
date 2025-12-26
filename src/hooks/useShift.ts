import { useState, useCallback, useEffect } from 'react';
import { Order } from '../types';

export const useShift = () => {
    const [localOrders, setLocalOrders] = useState<Order[]>(() => {
        const saved = localStorage.getItem('rayburger_local_shift_orders');
        return saved ? JSON.parse(saved) : [];
    });

    const [isSatelliteMode, setIsSatelliteMode] = useState(() => {
        return localStorage.getItem('rayburger_pos_mode') === 'satellite';
    });

    // Persist local orders whenever they change
    useEffect(() => {
        localStorage.setItem('rayburger_local_shift_orders', JSON.stringify(localOrders));
    }, [localOrders]);

    // Persist mode
    useEffect(() => {
        localStorage.setItem('rayburger_pos_mode', isSatelliteMode ? 'satellite' : 'master');
    }, [isSatelliteMode]);

    const addLocalOrder = useCallback((order: Order) => {
        setLocalOrders(prev => [order, ...prev]);
    }, []);

    const clearShift = useCallback(() => {
        if (window.confirm('¿Estás seguro de cerrar el turno? Esto borrará las ventas locales de este equipo.')) {
            setLocalOrders([]);
            localStorage.removeItem('rayburger_local_shift_orders');
        }
    }, []);

    const exportShiftData = useCallback(() => {
        const data = {
            version: '1.0',
            timestamp: Date.now(),
            orders: localOrders
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `turno_rayburger_${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        // Also provide as base64 string for easy WhatsApp sharing if needed
        const base64 = btoa(JSON.stringify(data));
        return base64;
    }, [localOrders]);

    return {
        localOrders,
        addLocalOrder,
        clearShift,
        exportShiftData,
        isSatelliteMode,
        setIsSatelliteMode
    };
};
