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

    // Debounced save functions
    const saveTasaDebounced = useRef(
        debounce((tasa: number) => {
            safeLocalStorage.setItem('rayburger_tasa', tasa.toString());
        }, 500)
    ).current;

    const saveGuestOrdersDebounced = useRef(
        debounce((orders: Order[]) => {
            safeLocalStorage.setItem('rayburger_guest_orders', JSON.stringify(orders));
        }, 500)
    ).current;

    useEffect(() => {
        saveTasaDebounced(tasaBs);
    }, [tasaBs, saveTasaDebounced]);

    useEffect(() => {
        saveGuestOrdersDebounced(guestOrders);
    }, [guestOrders, saveGuestOrdersDebounced]);

    const updateTasa = useCallback(async (newTasa: number) => {
        if (newTasa > 0) {
            setTasaBs(newTasa);
            // Sync tasa to cloud (we use a specific key for this in cloud sync)
            await pushToCloud('rb_settings', [{ id: 'tasa', value: newTasa }]);
        }
    }, [pushToCloud]);

    const addGuestOrder = useCallback(async (order: Order) => {
        setGuestOrders(prev => {
            const newList = [...prev, order];
            // Since this is inside setGuestOrders, we can't easily await here.
            // But we can trigger a cloud push with the NEW total list.
            return newList;
        });

        // Better flow: get current list and push
        const currentOrders = JSON.parse(safeLocalStorage.getItem('rayburger_guest_orders') || '[]');
        const updatedList = [...currentOrders, order];
        await pushToCloud('rb_orders', updatedList.map(o => ({ ...o, id: o.orderId })));
    }, [pushToCloud]);

    const updateGuestOrders = useCallback(async (updatedOrders: Order[]) => {
        setGuestOrders(updatedOrders);
        await pushToCloud('rb_orders', updatedOrders.map(o => ({ ...o, id: o.orderId })));
    }, [pushToCloud]);

    return {
        tasaBs,
        updateTasa,
        guestOrders,
        addGuestOrder,
        updateGuestOrders
    };
};
