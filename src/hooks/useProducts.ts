import { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '../types';
import { SAMPLE_PRODUCTS } from '../data/products';
import { debounce, safeLocalStorage } from '../utils/debounce';
import { useCloudSync } from './useCloudSync';

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const { replaceInCloud } = useCloudSync();

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
            let currentProducts = SAMPLE_PRODUCTS;

            if (storedProducts) {
                try {
                    currentProducts = JSON.parse(storedProducts);
                    setProducts(currentProducts);
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
                        const cloudProducts = data as Product[];

                        // Safely merge cloud products or use them if they are valid
                        setProducts(cloudProducts);
                        safeLocalStorage.setItem('rayburger_products', JSON.stringify(cloudProducts));
                    } else if (data && data.length === 0) {
                        console.warn("☁️ Cloud menu is empty. Keeping local menu for safety.");
                    }
                }
            } catch (err) {
                // Silent fail if cloud is unreachable
            }
        };

        loadProducts();
    }, [replaceInCloud]);

    useEffect(() => {
        const handleStorageChange = (e: Event) => {
            const customEvent = e as CustomEvent;
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
        window.dispatchEvent(new CustomEvent('rayburger_products_updated', { detail: { source: 'useProducts' } }));
    }, [saveProductsDebounced]);

    const addProduct = useCallback(async (product: Product) => {
        const newProducts = [...products, product];
        saveProducts(newProducts);
        await replaceInCloud('rb_products', newProducts);
    }, [products, saveProducts, replaceInCloud]);

    const updateProduct = useCallback(async (updatedProduct: Product) => {
        const newProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
        saveProducts(newProducts);
        await replaceInCloud('rb_products', newProducts);
    }, [products, saveProducts, replaceInCloud]);

    const deleteProduct = useCallback(async (productId: number) => {
        const newProducts = products.filter(p => p.id !== productId);
        saveProducts(newProducts);
        await replaceInCloud('rb_products', newProducts);
    }, [products, saveProducts, replaceInCloud]);

    const resetToSample = useCallback(async () => {
        if (confirm('¿Estás seguro de que quieres borrar el menú actual y cargar el menú oficial del código? Se perderán los cambios manuales y se sobrescribirá la nube.')) {
            saveProducts(SAMPLE_PRODUCTS);
            const { error } = await replaceInCloud('rb_products', SAMPLE_PRODUCTS);

            if (error) {
                alert(`❌ Error al limpiar la nube: ${error}. Los cambios se guardaron solo localmente.`);
            } else {
                alert('✅ Menú Oficial restaurado y NUBE LIMPIA. El "menú loco" ha sido eliminado.');
            }
        }
    }, [saveProducts, replaceInCloud]);

    return {
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        resetToSample
    };
};
