import { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '../types';
import { SAMPLE_PRODUCTS } from '../data/products';
import { debounce, safeLocalStorage } from '../utils/debounce';
import { useCloudSync } from './useCloudSync';

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const { replaceInCloud } = useCloudSync();

    // Flag to prevent re-initialization
    const initializedRef = useRef(false);

    // Debounced save function
    const saveProductsDebounced = useRef(
        debounce((newProducts: Product[]) => {
            safeLocalStorage.setItem('rayburger_products', JSON.stringify(newProducts));
        }, 500)
    ).current;

    // Initialize products from localStorage or fallback to sample data
    useEffect(() => {
        // Only initialize once
        if (initializedRef.current) return;
        initializedRef.current = true;

        const loadProducts = async () => {
            // 1. Load from LocalStorage (Primary Source of Truth)
            const storedProducts = safeLocalStorage.getItem('rayburger_products');
            let currentProducts: Product[] = [];

            if (storedProducts) {
                try {
                    currentProducts = JSON.parse(storedProducts);
                } catch (error) {
                    console.error("Failed to parse products", error);
                }
            }

            // 🛠️ DATA REPAIR DOCTOR: 
            // If we have data but categories are weird (template categories), fix them.
            if (currentProducts.length > 0) {
                const fixedProducts = currentProducts.map(p => {
                    // Map old template categories to canonical ones
                    if (['Clásica', 'Premium', 'Especial'].includes(p.category)) {
                        return { ...p, category: 'Hamburguesas' };
                    }
                    if (['Acompañamiento'].includes(p.category)) {
                        return { ...p, category: 'Extras' };
                    }
                    return p;
                });

                // Compare if anything changed
                if (JSON.stringify(fixedProducts) !== JSON.stringify(currentProducts)) {
                    console.log("🩺 Menu Doctor: Fixed incorrect categories detected in local storage.");
                    currentProducts = fixedProducts;
                    safeLocalStorage.setItem('rayburger_products', JSON.stringify(fixedProducts));
                }
                setProducts(currentProducts);
            } else {
                // If local is EMPTY, we use SAMPLE_PRODUCTS first
                setProducts(SAMPLE_PRODUCTS);
                currentProducts = SAMPLE_PRODUCTS;
            }

            // 🛠️ PHOTO SYNC DOCTOR: 
            // If we have local products but they still use Unsplash while code has official photos,
            // we force update the image paths but keep prices and descriptions.
            const needsPhotoUpdate = currentProducts.some(p => {
                const official = SAMPLE_PRODUCTS.find(s => s.id === p.id);
                return official && official.image.startsWith('/') && p.image.includes('unsplash');
            });

            if (needsPhotoUpdate) {
                console.log("📸 Photo Doctor: New professional photos detected. Syncing...");
                const syncedProducts = currentProducts.map(p => {
                    const official = SAMPLE_PRODUCTS.find(s => s.id === p.id);
                    if (official && official.image.startsWith('/') && p.image.includes('unsplash')) {
                        return { ...p, image: official.image };
                    }
                    return p;
                });
                setProducts(syncedProducts);
                currentProducts = syncedProducts;
                safeLocalStorage.setItem('rayburger_products', JSON.stringify(syncedProducts));
                // We don't await here to not block the boot, but we update cloud in background
                replaceInCloud('rb_products', syncedProducts);
            }

            // 2. Fetch from Cloud ONLY IF LOCAL IS EMPTY (Initialization Phase)
            // Or if we are using sample data and want to check if there's a real cloud version
            const isUsingSampleData = !storedProducts;

            if (isUsingSampleData) {
                try {
                    const { supabase } = await import('../lib/supabase');
                    if (supabase) {
                        const { data, error } = await supabase.from('rb_products').select('*');

                        if (!error && data && data.length > 0) {
                            const cloudProducts = data as Product[];
                            console.log("☁️ Seeding from Cloud...");
                            setProducts(cloudProducts);
                            safeLocalStorage.setItem('rayburger_products', JSON.stringify(cloudProducts));
                        }
                    }
                } catch (err) {
                    // Silent fail
                }
            }
        };

        loadProducts();
    }, []); // ✅ FIXED: Removed replaceInCloud dependency to prevent infinite loop

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
