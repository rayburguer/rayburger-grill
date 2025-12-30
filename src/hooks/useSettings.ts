import { useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_TASA_BS } from '../config/constants';
import { Order } from '../types';
import { debounce, safeLocalStorage } from '../utils/debounce';

import { useCloudSync } from './useCloudSync';

export const useSettings = () => {
    const { pushToCloud } = useCloudSync();

    const [tasaBs, setTasaBs] = useState<number>(() => {
        const saved = safeLocalStorage.getItem('rayburger_tasa');
        return saved ? Number(saved) : INITIAL_TASA_BS;
    });

    const [guestOrders, setGuestOrders] = useState<Order[]>(() => {
        const saved = safeLocalStorage.getItem('rayburger_guest_orders');
        return saved ? JSON.parse(saved) : [];
    });

    // Debounced save functions for local storage
    const saveTasaLocal = useRef(
        debounce((tasa: number) => {
            safeLocalStorage.setItem('rayburger_tasa', tasa.toString());
        }, 500)
    ).current;

    const saveGuestOrdersLocal = useRef(
        debounce((orders: Order[]) => {
            safeLocalStorage.setItem('rayburger_guest_orders', JSON.stringify(orders));
        }, 500)
    ).current;

    // Sync between tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'rayburger_tasa' && e.newValue) {
                const val = Number(e.newValue);
                if (!isNaN(val) && val !== tasaBs) {
                    setTasaBs(val);
                }
            }
            if (e.key === 'rayburger_guest_orders' && e.newValue) {
                try {
                    const orders = JSON.parse(e.newValue);
                    setGuestOrders(orders);
                } catch (err) {
                    console.error("Failed to sync guest orders from storage", err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [tasaBs]);

    const updateTasa = useCallback(async (newTasa: number) => {
        if (newTasa > 0) {
            setTasaBs(newTasa);
            saveTasaLocal(newTasa);
            // Instant sync to cloud
            await pushToCloud('rb_settings', [{ id: 'tasa', value: newTasa }]);
        }
    }, [pushToCloud, saveTasaLocal]);

    const addGuestOrder = useCallback(async (order: Order) => {
        setGuestOrders(prev => {
            const newList = [...prev, order];
            saveGuestOrdersLocal(newList);

            // Push to cloud using the absolute latest list
            pushToCloud('rb_orders', newList.map(o => ({ ...o, id: o.orderId })));

            return newList;
        });
    }, [pushToCloud, saveGuestOrdersLocal]);

    const updateGuestOrders = useCallback(async (updatedOrders: Order[]) => {
        setGuestOrders(updatedOrders);
        saveGuestOrdersLocal(updatedOrders);
        await pushToCloud('rb_orders', updatedOrders.map(o => ({ ...o, id: o.orderId })));
    }, [pushToCloud, saveGuestOrdersLocal]);

    return {
        tasaBs,
        updateTasa,
        guestOrders,
        addGuestOrder,
        updateGuestOrders
    };
};
