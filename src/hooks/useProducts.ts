import { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '../types';
import { SAMPLE_PRODUCTS } from '../data/products';
import { debounce, safeLocalStorage } from '../utils/debounce';

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);

    // Debounced save function
    const saveProductsDebounced = useRef(
        debounce((newProducts: Product[]) => {
            safeLocalStorage.setItem('rayburger_products', JSON.stringify(newProducts));
        }, 500)
    ).current;

    // Initialize products from localStorage or fallback to sample data
    // AND try to fetch from Cloud (Supabase) to get latest updates
    useEffect(() => {
        const loadProducts = async () => {
            // 1. Load from LocalStorage first (Fast render)
            const storedProducts = safeLocalStorage.getItem('rayburger_products');
            let initialProducts = SAMPLE_PRODUCTS;

            if (storedProducts) {
                try {
                    initialProducts = JSON.parse(storedProducts);
                    setProducts(initialProducts);
                } catch (error) {
                    console.error("Failed to parse products", error);
                    setProducts(SAMPLE_PRODUCTS);
                }
            } else {
                setProducts(SAMPLE_PRODUCTS);
            }

            // 2. Fetch from Cloud (Background update)
            try {
                // Dynamic import to avoid issues if Supabase checks fail initially
                const { supabase } = await import('../lib/supabase');
                if (supabase) {
                    const { data, error } = await supabase
                        .from('rb_products')
                        .select('*');

                    if (!error && data && data.length > 0) {
                        // Merge or replace? For simplicity and consistency: Replace.
                        // Ideally we should merge if user has local pending changes, but for clients, Cloud is Truth.
                        setProducts(data as Product[]);
                        safeLocalStorage.setItem('rayburger_products', JSON.stringify(data));
                    }
                }
            } catch (err) {
                // Silent fail if cloud is unreachable
            }
        };

        loadProducts();
    }, []);

    useEffect(() => {
        const handleStorageChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            // IGNORE if the update came from THIS hook instance
            if (customEvent.detail?.source === 'useProducts') return;

            if (customEvent.type === 'rayburger_products_updated') {
                const storedProducts = safeLocalStorage.getItem('rayburger_products');
                if (storedProducts) {
                    try {
                        setProducts(JSON.parse(storedProducts));
                    } catch (error) {
                        console.error("Failed to parse products on update", error);
                    }
                }
            }
        };

        window.addEventListener('rayburger_products_updated', handleStorageChange);
        return () => window.removeEventListener('rayburger_products_updated', handleStorageChange);
    }, []);

    const saveProducts = useCallback((newProducts: Product[]) => {
        setProducts(newProducts);
        saveProductsDebounced(newProducts);
        // Add a flag to indicate this update is internal
        window.dispatchEvent(new CustomEvent('rayburger_products_updated', { detail: { source: 'useProducts' } }));
    }, [saveProductsDebounced]);

    const addProduct = useCallback((product: Product) => {
        const newProducts = [...products, product];
        saveProducts(newProducts);
    }, [products, saveProducts]);

    const updateProduct = useCallback((updatedProduct: Product) => {
        const newProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
        saveProducts(newProducts);
    }, [products, saveProducts]);

    const deleteProduct = useCallback((productId: number) => {
        const newProducts = products.filter(p => p.id !== productId);
        saveProducts(newProducts);
    }, [products, saveProducts]);

    const resetToSample = useCallback(() => {
        if (confirm('¿Estás seguro de que quieres borrar el menú actual y cargar el menú oficial del código? Se perderán los cambios manuales.')) {
            saveProducts(SAMPLE_PRODUCTS);
        }
    }, [saveProducts]);

    return {
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        resetToSample
    };
};
