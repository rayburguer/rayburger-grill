import { useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_TASA_BS } from '../config/constants';
import { Order } from '../types';
import { debounce, safeLocalStorage } from '../utils/debounce';

export const useSettings = () => {
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

    const updateTasa = useCallback((newTasa: number) => {
        if (newTasa > 0) setTasaBs(newTasa);
    }, []);

    const addGuestOrder = useCallback((order: Order) => {
        setGuestOrders(prev => [...prev, order]);
    }, []);

    const updateGuestOrders = useCallback((updatedOrders: Order[]) => {
        setGuestOrders(updatedOrders);
    }, []);

    return {
        tasaBs,
        updateTasa,
        guestOrders,
        addGuestOrder,
        updateGuestOrders
    };
};
