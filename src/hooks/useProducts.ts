import { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '../types';
import { SAMPLE_PRODUCTS } from '../data/products';
import { debounce, safeLocalStorage } from '../utils/debounce';
import { useCloudSync } from './useCloudSync';

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const { pushToCloud, deleteFromCloud } = useCloudSync();

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
                }

                // 🛠️ FEATURE DOCTOR: Auto-Inject "Con/Sin" options for Vegetables and Sauces
                const standardOptions = [
                    { id: 'opt_veg', name: 'Vegetales (Lechuga/Tomate)', price_usd: 0, defaultIncluded: true },
                    { id: 'opt_onion', name: 'Cebolla', price_usd: 0, defaultIncluded: true },
                    { id: 'opt_sauces', name: 'Salsas Tradicionales', price_usd: 0, defaultIncluded: true },
                ];

                const enrichedProducts = currentProducts.map(p => {
                    if (['Hamburguesas', 'Perros'].includes(p.category)) {
                        const hasVeg = p.customizableOptions?.some(o => o.id.includes('veg') || o.id.includes('onion'));
                        if (!hasVeg) {
                            return {
                                ...p,
                                customizableOptions: [...(p.customizableOptions || []), ...standardOptions]
                            };
                        }
                    }
                    return p;
                });

                if (JSON.stringify(enrichedProducts) !== JSON.stringify(currentProducts)) {
                    console.log("🥬 Feature Doctor: Standard options (Veg/Sauces) injected.");
                    currentProducts = enrichedProducts;
                    safeLocalStorage.setItem('rayburger_products', JSON.stringify(enrichedProducts));
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
                // 🛡️ SECURITY FIX: Use pushToCloud (upsert) instead of replaceInCloud to avoid nuclear deletion of custom manual products
                pushToCloud('rb_products', syncedProducts);
            }

            // 2. ALWAYS Pull from Cloud to sync with Master Menu
            // This ensures PC edits are propagated to Phone immediately.
            try {
                const { supabase: supabaseClient } = await import('../lib/supabase');
                if (supabaseClient) {
                    const { data, error } = await supabaseClient.from('rb_products').select('*');

                    if (!error && data && data.length > 0) {
                        const cloudProducts = data as Product[];
                        console.log("☁️ Menu synced from Cloud Master.");

                        // Merge Strategy: Cloud products overwrite local ones with same ID, 
                        // but we keep local-only products (might be drafts).
                        // Actually, for consistency, Cloud should be MASTER.
                        setProducts(cloudProducts);
                        safeLocalStorage.setItem('rayburger_products', JSON.stringify(cloudProducts));
                    }
                }
            } catch (err) {
                console.warn("☁️ Could not sync menu from cloud, using local cache.", err);
            }
        };

        loadProducts();
    }, [pushToCloud]); // ✅ FIXED: Added pushToCloud dependency

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
        // 🚀 SUCCESS: Targeted Push (no nuclear risk)
        await pushToCloud('rb_products', [product]);
    }, [products, saveProducts, pushToCloud]);

    const updateProduct = useCallback(async (updatedProduct: Product) => {
        const newProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
        saveProducts(newProducts);
        // 🚀 SUCCESS: Targeted Update
        await pushToCloud('rb_products', [updatedProduct]);
    }, [products, saveProducts, pushToCloud]);

    const deleteProduct = useCallback(async (productId: number) => {
        const newProducts = products.filter(p => p.id !== productId);
        saveProducts(newProducts);
        // 🚀 SUCCESS: Targeted Delete
        await deleteFromCloud('rb_products', productId.toString());
    }, [products, saveProducts, deleteFromCloud]);

    const resetToSample = useCallback(async () => {
        if (confirm('¿Estás seguro de que quieres borrar el menú actual y cargar el menú oficial del código? Se perderán los cambios manuales.')) {
            // We use pushToCloud to ensure the official items exist. 
            // We don't use 'replace' because we want to avoid accidental mass deletion.
            saveProducts(SAMPLE_PRODUCTS);
            const { error } = await pushToCloud('rb_products', SAMPLE_PRODUCTS);

            if (error) {
                alert(`❌ Error al limpiar la nube: ${error}. Los cambios se guardaron solo localmente.`);
            } else {
                alert('✅ Menú Oficial restaurado. Los productos oficiales han sido actualizados en la nube.');
            }
        }
    }, [saveProducts, pushToCloud]);

    return {
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        resetToSample
    };
};
