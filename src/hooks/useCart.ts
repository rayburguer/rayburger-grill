import { useState, useCallback, useMemo } from 'react';
import { Product, CartItem } from '../types';

export const useCart = () => {
    const [cart, setCart] = useState<CartItem[]>([]);

    // Helper para crear una string canónica de las opciones seleccionadas
    const getOptionsString = (options: { [optionId: string]: boolean }) => {
        return JSON.stringify(Object.keys(options).sort().map(key => ({ id: key, selected: options[key] })));
    };

    const addToCart = useCallback((product: Product, quantity: number, selectedOptions: { [optionId: string]: boolean }, finalPrice: number) => {
        let itemAddedType = "new"; // 'new' or 'existing'
        setCart((prevCart) => {
            const newOptionsString = getOptionsString(selectedOptions);
            const existingItemIndex = prevCart.findIndex(
                (item) => item.id === product.id && getOptionsString(item.selectedOptions) === newOptionsString
            );

            if (existingItemIndex > -1) {
                itemAddedType = "existing";
                const updatedCart = [...prevCart];
                const existingItem = updatedCart[existingItemIndex];
                updatedCart[existingItemIndex] = {
                    ...existingItem,
                    quantity: existingItem.quantity + quantity,
                };
                return updatedCart;
            } else {
                const newItem: CartItem = {
                    ...product,
                    cartItemId: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                    quantity: quantity,
                    selectedOptions: selectedOptions,
                    finalPrice_usd: finalPrice,
                };
                return [...prevCart, newItem];
            }
        });
        return itemAddedType;
    }, []);

    const removeFromCart = useCallback((cartItemId: string) => {
        setCart((prevCart) => prevCart.filter(item => item.cartItemId !== cartItemId));
    }, []);

    const updateCartItemQuantity = useCallback((cartItemId: string, newQuantity: number) => {
        setCart((prevCart) => {
            return prevCart.map(item =>
                item.cartItemId === cartItemId
                    ? { ...item, quantity: Math.max(1, Math.min(99, newQuantity)) } // Min: 1, Max: 99
                    : item
            );
        });
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const totalUsd = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.finalPrice_usd * item.quantity, 0);
    }, [cart]);

    return {
        cart,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        totalUsd
    };
};
