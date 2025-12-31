import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Search, TrendingUp, ShieldCheck, Trash2, X } from 'lucide-react';

// Components
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ProductCard from '../../components/products/ProductCard';
import ProductCardSkeleton from '../../components/ui/ProductCardSkeleton';
import ProductDetailModal from '../../components/products/ProductDetailModal';
import CartModal from '../../components/cart/CartModal';
import CheckoutModal from '../../components/checkout/CheckoutModal';
import RegisterModal from '../../components/auth/RegisterModal';
import LoginModal from '../../components/auth/LoginModal';
import UserProfileModal from '../../components/user/UserProfileModal';
// import AdminDashboard from '../../components/admin/AdminDashboard'; // REMOVED redundancy
import HeroSection from '../../components/layout/HeroSection';
import FAQSection from '../../components/layout/FAQSection';
import OrderStatusTracker from '../../components/ui/OrderStatusTracker';
import SurveyModal from '../../components/feedback/SurveyModal';
import Toast from '../../components/ui/Toast';
import FloatingCart from '../../components/ui/FloatingCart';
import InstallPrompt from '../../components/ui/InstallPrompt';
import RouletteModal from '../../components/loyalty/RouletteModal';
import { RankingSection } from '../../components/sections/RankingSection';
import { IngredientVoting } from '../../components/voting/IngredientVoting';
import { BottomNavigation } from '../../components/ui/BottomNavigation';

import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useProducts } from '../../hooks/useProducts';
// import { useLoyalty } from '../../hooks/useLoyalty'; // Not used
import { useSurveys } from '../../hooks/useSurveys';
import { useSettings } from '../../hooks/useSettings';
import { useCloudSync } from '../../hooks/useCloudSync';
import { useSecureCheckout } from '../../hooks/useSecureCheckout';
import { getDeviceFingerprint } from '../../utils/helpers';
import { mapDbUserToApp } from '../../utils/dbMapper';

// Data & Config
import { ALL_CATEGORIES_KEY, SKIP_LINK_ID } from '../../config/constants'; // Fix path
import { generateUuid, normalizePhone } from '../../utils/helpers';
import '../../index.css';
import { Product, User, Order } from '../../types'; // Fix path
import { generateWhatsAppLink } from '../../utils/whatsapp'; // Fix path

// --- STABILIZED SUB-COMPONENTS ---
const MemoizedHeader = React.memo(Header);
const MemoizedFooter = React.memo(Footer);

const Storefront: React.FC = () => {
    const navigate = useNavigate();
    // State
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES_KEY);
    const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

    // Modals State
    const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
    const [initialReferralCode, setInitialReferralCode] = useState("");


    const [isProductDetailModalOpen, setIsProductDetailModalOpen] = useState<boolean>(false);
    const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
    const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState<boolean>(false);
    const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
    const [lastOrderId, setLastOrderId] = useState<string>('');
    const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
        const saved = localStorage.getItem('rayburger_active_order');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000) return parsed;
            } catch { return null; }
        }
        return null;
    });

    const [isRouletteOpen, setIsRouletteOpen] = useState<boolean>(false);
    const [isCashierMode, setIsCashierMode] = useState<boolean>(false);

    // Toast State
    const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');

    // Accordion State
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'Hamburguesas': false, // Collapsed by default for cleaner Mobile UX
        'Perros': false,
        'Combos': false,
        'Bebidas': false,
        'Salsas': false,
        'Extras': false
    });

    const toggleCategory = useCallback((cat: string) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    }, []);

    // Hooks usage
    const { cart, addToCart, removeFromCart, updateCartItemQuantity, clearCart, totalUsd } = useCart();
    const { currentUser, registeredUsers, login, logout, register, updateUsers } = useAuth();
    const { products } = useProducts();
    const { tasaBs, addGuestOrder } = useSettings();
    const { addSurvey } = useSurveys();
    // const { processOrderRewards } = useLoyalty(); // Not used
    const { processSecureOrder } = useSecureCheckout();
    useCloudSync(); // Hook remains for its internal effects if any, but we don't need the return val

    // Toast Handlers
    const showToast = useCallback((message: string) => {
        setToastMessage(message);
        setIsToastVisible(true);
    }, []);

    // --- DEEP LINKING & URL PARAMS ---
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        // 1. Check for referrals / promos
        const promo = params.get('promo');
        const ref = params.get('ref');

        if ((promo || ref) && !currentUser) {
            setInitialReferralCode(promo || ref || "");
            setIsRegisterModalOpen(true);
            showToast("🎁 ¡Código detectado!");
        }

        // 2. Check for Admin Deep Link
        const isAdminAction = params.get('admin');
        if (isAdminAction === 'orders') {
            navigate('/admin');
        }

        // 3. Check for Cashier Mode
        if (params.get('mode') === 'cashier') {
            setIsCashierMode(true);
            showToast("👮 MODO CAJERO ACTIVO");
        }

        // Clean URL if any params existed (but keep mode for persistence if needed? No, better keep it in state)
        if (promo || ref || isAdminAction || params.get('mode')) {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [currentUser, navigate, showToast]);

    // VISITOR TRACKING
    useEffect(() => {
        const trackVisit = async () => {
            const hasVisited = sessionStorage.getItem('rb_visited');
            if (!hasVisited && supabase) {
                try {
                    await supabase.rpc('increment_visitors');
                    sessionStorage.setItem('rb_visited', 'true');
                } catch (e) {
                    console.error("Failed to track visit", e);
                }
            }
        };
        trackVisit();
    }, []);

    const closeToast = useCallback(() => {
        setIsToastVisible(false);
        setToastMessage('');
    }, []);

    // Modal Handlers
    const openCart = useCallback(() => setIsCartOpen(true), []);
    const closeCart = useCallback(() => setIsCartOpen(false), []);
    const openCheckout = useCallback(() => { closeCart(); setIsCheckoutOpen(true); }, [closeCart]);
    const closeCheckout = useCallback(() => setIsCheckoutOpen(false), []);
    const openRegister = useCallback(() => { setIsLoginModalOpen(false); setIsRegisterModalOpen(true); }, []);
    const closeRegister = useCallback(() => setIsRegisterModalOpen(false), []);
    const openLogin = useCallback(() => { setIsRegisterModalOpen(false); setIsLoginModalOpen(true); }, []);
    const closeLogin = useCallback(() => setIsLoginModalOpen(false), []);
    const openUserProfileModal = useCallback(() => setIsUserProfileModalOpen(true), []);
    const closeUserProfileModal = useCallback(() => setIsUserProfileModalOpen(false), []);

    const openProductDetail = useCallback((product: Product) => {
        setSelectedProductForDetail(product);
        setIsProductDetailModalOpen(true);
    }, []);
    const closeProductDetail = useCallback(() => {
        setIsProductDetailModalOpen(false);
        setSelectedProductForDetail(null);
    }, []);

    const handleSelectProduct = (product: Product) => {
        openProductDetail(product);
    };


    // Aggressive Admin Path Detection REMOVED
    // Navigation is now handled by the Router in MainRouter.tsx

    // Auto-sync REMOVED - Too risky if local storage is cleared and syncs sample data to cloud.
    // Use manual sync buttons in Admin Dashboard instead.

    const handleLogout = useCallback(() => {
        logout();
        showToast("Sesión cerrada. ¡Hasta pronto!");
    }, [logout, showToast]);

    const handleUserRegistration = useCallback(async (newUser: User) => {
        const success = await register(newUser);
        if (success) {
            showToast("¡Registro exitoso! Bienvenido " + newUser.name);
            closeRegister();
        } else {
            showToast("Error en el registro.");
        }
    }, [register, showToast, closeRegister]);

    const handleLoginSubmit = useCallback(async (email: string, password: string) => {
        const loggedInUser = await login(email, password);
        if (loggedInUser) {
            closeLogin();
            showToast("¡Bienvenido de nuevo!");

            // AUTOMATIC REDIRECT FOR ADMINS
            if (loggedInUser.role === 'admin') {
                window.location.href = '/admin';
            }

            return true;
        } else {
            // showToast("Credenciales inválidas."); // Removed to let Modal handle it inline? Or keep both? Keeping both is fine, but inline is better. 
            // Actually, let's keep toast as backup, but return success so modal knows to shake/error.
            showToast("Credenciales inválidas.");
            return false;
        }
    }, [login, closeLogin, showToast]);

    const handleOrderConfirmed = useCallback(async (
        buyerEmail: string,
        buyerName?: string,
        deliveryInfo?: { method: 'delivery' | 'pickup', fee: number, phone: string },
        newRegistrationData?: { password: string },
        balanceUsed_usd: number = 0,
        isInternal: boolean = false,
        paymentStatus: 'pending' | 'paid' = 'paid',
        paymentMethod: string = 'whatsapp_link'
    ) => {
        let finalUser = currentUser;

        // 🛡️ SEAMLESS REGISTRATION (Phase 3: Secure RPC)
        if (!currentUser && newRegistrationData && buyerName && deliveryInfo?.phone && supabase) {
            const fullPhone = normalizePhone(deliveryInfo.phone);
            const { data } = await supabase.rpc('rpc_register_user', {
                p_phone: fullPhone,
                p_name: buyerName,
                p_password_hash: newRegistrationData.password,
                p_email: buyerEmail || `${fullPhone}@rayburger.app`,
                p_fingerprint: getDeviceFingerprint()
            });

            if (data?.success) {
                // Fetch the ground-truth user from cloud
                const { data: userData } = await supabase
                    .from('rb_users')
                    .select('*')
                    .eq('id', data.data)
                    .single();

                if (userData) {
                    finalUser = mapDbUserToApp(userData);
                    await register(finalUser); // Updates local AuthContext state
                    showToast("🎉 ¡Cuenta de socio creada y bono de $0.50 activo!");
                }
            } else {
                showToast(`⚠️ No se pudo crear cuenta: ${data?.error || 'Error desconocido'}`);
            }
        }

        // 🛡️ SECURE CHECKOUT (Phase 3: Secure RPC)
        let currentOrder: Order | null = null;
        const paymentType = balanceUsed_usd > 0 ? 'wallet' : 'whatsapp_link';

        if (finalUser?.id) {
            const checkoutResult = await processSecureOrder(
                finalUser.id,
                cart,
                totalUsd + (deliveryInfo?.fee || 0),
                paymentType,
                finalUser.name,
                deliveryInfo?.phone || finalUser.phone,
                balanceUsed_usd
            );

            if (checkoutResult.success) {
                if (checkoutResult.multiplierUsed && checkoutResult.multiplierUsed > 1) {
                    showToast(`🚀 ¡MULTIPLICADOR ACTIVADO! Ganaste ${checkoutResult.multiplierUsed}x puntos.`);
                }

                // Create the order object for the UI (Ground Truth comes from server, but we build UI representation)
                currentOrder = {
                    orderId: generateUuid(),
                    timestamp: Date.now(),
                    totalUsd: totalUsd + (deliveryInfo?.fee || 0),
                    items: cart.map(item => ({
                        name: item.name,
                        quantity: item.quantity,
                        price_usd: item.finalPrice_usd,
                        selectedOptions: item.selectedOptions
                    })),
                    pointsEarned: 0, // 0 until approved
                    pointsPotential: checkoutResult.pointsPotential || 0,
                    status: isInternal ? 'delivered' : 'pending',
                    deliveryMethod: deliveryInfo?.method || 'pickup',
                    deliveryFee: deliveryInfo?.fee || 0,
                    customerName: finalUser.name,
                    customerPhone: finalUser.phone,
                    balanceUsed_usd: balanceUsed_usd,
                    cashierMode: isInternal,
                    paymentStatus: paymentStatus,
                    paymentMethod: paymentMethod as any,
                    rewardsEarned_usd: 0
                };

                // REFRESH PROFILE: Ensure local points and balance are correct after order
                const { data: refreshedUser } = supabase ? await supabase
                    .from('rb_users')
                    .select('*')
                    .eq('id', finalUser.id)
                    .single() : { data: null };
                if (refreshedUser) {
                    const updatedAppUser = mapDbUserToApp(refreshedUser);
                    updateUsers(registeredUsers.map(u => u.email === updatedAppUser.email ? updatedAppUser : u));
                }

                if (!isInternal && currentOrder) {
                    const link = generateWhatsAppLink(currentOrder, finalUser, cart, tasaBs);
                    window.open(link, '_blank');
                } else if (isInternal) {
                    showToast("✅ PEDIDO REGISTRADO EN EL PANEL");
                }
            } else {
                showToast(`⛔ ERROR AL PROCESAR: ${checkoutResult.error}`);
                return; // ABORT
            }
        } else {
            // GUEST FLOW (Standard)
            currentOrder = {
                orderId: generateUuid(),
                timestamp: Date.now(),
                totalUsd: totalUsd + (deliveryInfo?.fee || 0),
                items: cart.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price_usd: item.finalPrice_usd,
                    selectedOptions: item.selectedOptions
                })),
                pointsEarned: 0,
                status: isInternal ? 'delivered' : 'pending',
                deliveryMethod: deliveryInfo?.method || 'pickup',
                deliveryFee: deliveryInfo?.fee || 0,
                customerName: buyerName || "Invitado",
                customerPhone: deliveryInfo?.phone || "",
                balanceUsed_usd: 0,
                cashierMode: isInternal,
                paymentStatus: paymentStatus,
                paymentMethod: paymentMethod as any,
                rewardsEarned_usd: 0
            };
            addGuestOrder(currentOrder);

            if (!isInternal && currentOrder) {
                const guestUser: User = {
                    name: buyerName || "Invitado", email: buyerEmail || "Sin email", phone: deliveryInfo?.phone ? `+58${normalizePhone(deliveryInfo.phone)}` : "",
                    passwordHash: "", referralCode: "", walletBalance_usd: 0, lifetimeSpending_usd: 0, loyaltyTier: "Bronze", role: 'customer', orders: [currentOrder],
                    points: 0
                };
                const link = generateWhatsAppLink(currentOrder, guestUser, cart, tasaBs);
                window.open(link, '_blank');
            } else if (isInternal) {
                showToast("✅ VENTA (GUEST) REGISTRADA");
            }
        }

        clearCart();
        closeCheckout();
        if (currentOrder) {
            setActiveOrder(currentOrder);
            localStorage.setItem('rayburger_active_order', JSON.stringify(currentOrder));
        }
        setLastOrderId('recent-order');

        // Show survey only if enough time passed since last survey (e.g. 7 days to not annoy, but reward is 30 days)
        if (currentUser) {
            const lastSurvey = currentUser.lastSurveyDate || 0;
            if (Date.now() - lastSurvey > 7 * 24 * 60 * 60 * 1000) {
                setTimeout(() => setIsSurveyModalOpen(true), 1500);
            }
        } else {
            // Guest always sees it
            setTimeout(() => setIsSurveyModalOpen(true), 1500);
        }
    }, [cart, totalUsd, registeredUsers, updateUsers, clearCart, closeCheckout, showToast, addGuestOrder, register, currentUser, processSecureOrder, tasaBs]);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoadingProducts(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const handleSurveySubmit = useCallback((survey: any) => {
        addSurvey(survey);

        // Award 20 points ($0.20) for completing the survey (ONCE EVERY 30 DAYS)
        if (currentUser && survey.userId) {
            const lastSurvey = currentUser.lastSurveyDate || 0;
            const now = Date.now();
            const cooldown = 30 * 24 * 60 * 60 * 1000;

            if (now - lastSurvey > cooldown) {
                const updatedUsers = registeredUsers.map(u =>
                    u.email === currentUser.email
                        ? { ...u, walletBalance_usd: (u.walletBalance_usd || 0) + 0.20, lastSurveyDate: now }
                        : u
                );
                updateUsers(updatedUsers);
                showToast("¡Gracias por tu opinión! +$0.20 en tu Billetera 🎁");
            } else {
                showToast("¡Gracias por tu opinión! (Ya recibiste tu bono este mes)");
            }
        } else {
            showToast("¡Gracias por tu opinión!");
        }

        setIsSurveyModalOpen(false);
    }, [addSurvey, currentUser, registeredUsers, updateUsers, showToast]);

    const handleAddToCart = useCallback((product: Product, quantity: number, selectedOptions: { [optionId: string]: boolean }, finalPrice: number) => {
        addToCart(product, quantity, selectedOptions, finalPrice);
        showToast(quantity + "x " + product.name + " añadido!");
        import('../../utils/confetti').then(({ triggerConfetti }) => triggerConfetti());
        closeProductDetail();
    }, [addToCart, showToast, closeProductDetail]);

    const handleReorder = useCallback((order: Order) => {
        let addedCount = 0;
        order.items.forEach(item => {
            const product = products.find(p => p.name === item.name);
            if (product && product.isAvailable !== false) {
                addToCart(product, item.quantity, item.selectedOptions || {}, item.price_usd);
                addedCount += item.quantity;
            }
        });
        if (addedCount > 0) {
            showToast(`🔄 ¡${addedCount} items agregados!`);
            openCart();
            import('../../utils/confetti').then(({ triggerConfetti }) => triggerConfetti());
        }
    }, [products, addToCart, showToast, openCart]);

    const handleQuickAddToCart = useCallback((product: Product) => {
        // Add product directly with quantity 1 and base price (no customizations)
        addToCart(product, 1, {}, product.basePrice_usd);
        showToast(`✅ ${product.name} añadido!`);
        import('../../utils/confetti').then(({ triggerConfetti }) => triggerConfetti());
    }, [addToCart, showToast]);

    const categories = useMemo(() => {
        if (!products.length) return [ALL_CATEGORIES_KEY];
        const cats = Array.from(new Set(products.map(p => p.category)));
        const ordered = ['Hamburguesas', 'Perros', 'Combos', 'Extras', 'Bebidas', 'Salsas'];
        return [ALL_CATEGORIES_KEY, ...cats.sort((a, b) => {
            const indexA = ordered.indexOf(a), indexB = ordered.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        })];
    }, [products]);

    const filteredProducts = useMemo(() => {
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            let cur = products.filter(p => p.name.toLowerCase().includes(lowSearch));
            if (selectedCategory !== ALL_CATEGORIES_KEY) cur = cur.filter(p => p.category === selectedCategory);
            return cur;
        }
        if (selectedCategory === ALL_CATEGORIES_KEY) return [];
        return products.filter(p => p.category === selectedCategory);
    }, [products, searchTerm, selectedCategory]);

    // --- ADMIN BYPASS REMOVED (Handled by MainRouter) ---
    /*
    if (window.location.pathname === '/admin') {
        ...
    }
    */

    // --- SECURE ADMIN ACCESS HANDLER ---
    const handleAdminAccess = useCallback(() => {
        if (currentUser && currentUser.role === 'admin') {
            navigate('/admin');
        } else if (currentUser) {
            showToast("⛔ Acceso denegado. Solo personal autorizado.");
        } else {
            showToast("🔐 Inicia sesión como Administrador para entrar.");
            openLogin();
        }
    }, [currentUser, navigate, showToast, openLogin]);

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-orange-500 selection:text-white">
            {/* CASHIER MODE BANNER */}
            {isCashierMode && (
                <div className="sticky top-0 z-[100] bg-orange-600 text-white px-4 py-2 flex items-center justify-between gap-2 shadow-xl border-b border-orange-500/30 backdrop-blur-md bg-orange-600/90">
                    <div className="flex items-center gap-2 min-w-0">
                        <ShieldCheck size={18} className="shrink-0" />
                        <span className="font-black uppercase tracking-tight text-[10px] sm:text-xs truncate">Sesión: Venta Manual</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={clearCart}
                            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1 transition-all active:scale-95"
                        >
                            <Trash2 size={10} /> Limpiar
                        </button>
                        <button
                            onClick={() => setIsCashierMode(false)}
                            className="hover:text-white/80 transition-colors p-1"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}
            <a href={`#${SKIP_LINK_ID}`} className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-orange-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md">Saltar al contenido principal</a>

            <MemoizedHeader
                cartItemCount={cart.length}
                onOpenCart={openCart}
                currentUser={currentUser}
                onOpenRegister={openRegister}
                onOpenLogin={openLogin}
                onLogout={handleLogout}
                onOpenProfile={openUserProfileModal}
                onOpenRoulette={() => setIsRouletteOpen(true)}
                activeOrder={activeOrder}
            />

            <main className="flex-1 flex flex-col items-center pt-24 pb-24 lg:pb-12 px-4 whitespace-normal">
                {selectedCategory === ALL_CATEGORIES_KEY && !searchTerm && (
                    <>
                        <HeroSection onCtaClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })} user={currentUser} />

                        {/* CTA GIGANTE: VER MENÚ COMPLETO */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="w-full max-w-4xl mb-8 px-4"
                        >
                            <button
                                onClick={() => {
                                    setSelectedCategory('Hamburguesas');
                                    document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="w-full py-6 px-8 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-3xl font-black text-2xl uppercase tracking-wide shadow-2xl hover:shadow-orange-600/50 transition-all hover:scale-[1.02] flex items-center justify-center gap-4 group"
                            >
                                🍔 Ver Menú Completo
                                <svg className="w-8 h-8 transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </motion.div>
                    </>
                )}

                {selectedCategory === ALL_CATEGORIES_KEY && !searchTerm && (
                    <>
                        <div className="w-full max-w-6xl mb-4 mt-8 px-4 flex items-center gap-2">
                            <TrendingUp className="text-orange-500" />
                            <h2 className="text-2xl font-black text-white italic uppercase">Lo Más Vendido</h2>
                        </div>
                        <RankingSection products={products} onSelectProduct={handleSelectProduct} />
                        {/* RecommendationSection REMOVED - Burger Ideal now only in Header for consistency */}
                    </>
                )}

                <div id="menu-section" className="w-full max-w-xl mt-8 mb-6 relative z-30">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="¿Qué se te antoja hoy?"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-800/80 backdrop-blur-xl text-white border border-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder-gray-500 text-lg shadow-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-6 h-6 group-focus-within:text-orange-500 transition-colors" />
                    </div>
                </div>

                <div className="w-full max-w-6xl mb-8 overflow-x-auto pb-4 scrollbar-hide">
                    <div className="flex gap-3 px-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-2 rounded-full whitespace-nowrap font-bold transition-all text-sm uppercase tracking-wide ${selectedCategory === category ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full max-w-6xl pb-10">
                    {isLoadingProducts ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : (
                        <>
                            {(searchTerm || selectedCategory !== ALL_CATEGORIES_KEY) && (
                                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    <AnimatePresence>
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map((product, index) => (
                                                <motion.div key={product.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                                                    <ProductCard product={product} onOpenProductDetail={openProductDetail} onQuickAdd={handleQuickAddToCart} />
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="col-span-full text-center py-20">
                                                <p className="text-2xl text-gray-500 font-bold">No encontramos productos 😢</p>
                                                <button onClick={() => { setSearchTerm(''); setSelectedCategory(ALL_CATEGORIES_KEY); }} className="mt-4 text-orange-500 underline">Volver al inicio</button>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                            {(!searchTerm && selectedCategory === ALL_CATEGORIES_KEY) && (
                                <div className="space-y-6">
                                    {categories.filter(c => c !== ALL_CATEGORIES_KEY).map((categoryName) => {
                                        const categoryProducts = products.filter(p => p.category === categoryName);
                                        if (categoryProducts.length === 0) return null;

                                        const isExpanded = expandedCategories[categoryName] ?? true;
                                        const isMini = categoryName === 'Extras' || categoryName === 'Salsas' || categoryName === 'Bebidas';

                                        return (
                                            <motion.section
                                                key={categoryName}
                                                className="bg-gray-900/40 backdrop-blur-md rounded-3xl border border-gray-800/50 overflow-hidden transition-all duration-300 hover:border-orange-500/20"
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                            >
                                                {/* Header colapsable */}
                                                <button
                                                    onClick={() => toggleCategory(categoryName)}
                                                    className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{categoryName}</h2>
                                                        <span className="bg-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full text-white">
                                                            {categoryProducts.length}
                                                        </span>
                                                    </div>
                                                    <div className={`p-2 rounded-full bg-gray-800 group-hover:bg-orange-600 transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </button>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                                            className="px-6 pb-8"
                                                        >
                                                            {/* Linea divisoria */}
                                                            <div className="h-px w-full bg-gradient-to-r from-orange-600/50 to-transparent mb-6"></div>

                                                            {isMini ? (
                                                                // CHIPS LAYOUT (For Extras, Sauces, Drinks)
                                                                <div className="flex flex-wrap gap-3">
                                                                    {categoryProducts.map((product) => (
                                                                        <button
                                                                            key={product.id}
                                                                            onClick={() => openProductDetail(product)}
                                                                            className="flex items-center gap-3 bg-gray-800/50 hover:bg-orange-600 border border-gray-700 hover:border-orange-400 rounded-2xl pl-2 pr-4 py-2 transition-all group/chip"
                                                                        >
                                                                            <img src={product.image} alt={product.name} className="w-10 h-10 rounded-xl object-cover" />
                                                                            <div className="text-left">
                                                                                <p className="font-bold text-white text-sm leading-tight">{product.name}</p>
                                                                                <p className="text-orange-400 group-hover/chip:text-white text-xs font-black">${product.basePrice_usd.toFixed(2)}</p>
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                // STANDARD GRID LAYOUT
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                                    {categoryProducts.map((product) => <ProductCard key={product.id} product={product} onOpenProductDetail={openProductDetail} onQuickAdd={handleQuickAddToCart} />)}
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.section>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <IngredientVoting />
                <div className="mt-10 w-full"><FAQSection /></div>
            </main>

            <MemoizedFooter onAdminClick={handleAdminAccess} />

            <CartModal
                isOpen={isCartOpen} onClose={closeCart} cart={cart} totalUsd={totalUsd}
                onRemoveItem={removeFromCart} onUpdateItemQuantity={updateCartItemQuantity}
                onProceedToCheckout={openCheckout} allProducts={products}
                onQuickAdd={(product) => addToCart(product, 1, {}, product.basePrice_usd)}
            />
            <CheckoutModal
                isOpen={isCheckoutOpen} onClose={closeCheckout} totalUsd={totalUsd} tasaBs={tasaBs}
                onOrderConfirmed={handleOrderConfirmed} currentUser={currentUser}
                isCashierMode={isCashierMode}
            />
            <RegisterModal
                isOpen={isRegisterModalOpen}
                onClose={closeRegister}
                onRegister={handleUserRegistration}
                registeredUsers={registeredUsers}
                onOpenLogin={() => { closeRegister(); openLogin(); }}
                initialReferralCode={initialReferralCode}
            />
            <LoginModal isOpen={isLoginModalOpen} onClose={closeLogin} onLogin={handleLoginSubmit} onOpenRegister={openRegister} />
            <ProductDetailModal key={selectedProductForDetail?.id || 'none'} isOpen={isProductDetailModalOpen} onClose={closeProductDetail} product={selectedProductForDetail} onAddToCart={handleAddToCart} />
            <UserProfileModal
                isOpen={isUserProfileModalOpen}
                onClose={closeUserProfileModal}
                user={currentUser}
                onShowToast={showToast}
                onReorder={handleReorder}
                onClaimAdmin={() => {
                    if (!currentUser) return;
                    // FORCE IMMEDIATE STORAGE UPDATE
                    const upgradedUser: User = { ...currentUser, role: 'admin' };
                    const updatedList = registeredUsers.map(u => u.email === currentUser.email ? upgradedUser : u);

                    try {
                        localStorage.setItem('rayburger_registered_users', JSON.stringify(updatedList));
                        localStorage.setItem('rayburger_current_user', JSON.stringify(upgradedUser));
                        updateUsers(updatedList);
                        showToast("👑 ¡Larga vida al Rey! Eres Admin. (Recargando...)");
                        setTimeout(() => window.location.reload(), 500);
                    } catch {
                        showToast("Error al guardar privilegios.");
                    }
                }}
            />
            {/* AdminDashboard modal instance removed to avoid redundancy with MainRouter's /admin route */}
            <SurveyModal isOpen={isSurveyModalOpen} onClose={() => setIsSurveyModalOpen(false)} onSubmit={handleSurveySubmit} orderId={lastOrderId} userId={currentUser?.email} />
            <RouletteModal
                isOpen={isRouletteOpen} onClose={() => setIsRouletteOpen(false)} currentUser={currentUser}
                onUpdateUser={(updatedUser: User) => {
                    const updatedList = registeredUsers.map(u => u.email === updatedUser.email ? updatedUser : u);
                    updateUsers(updatedList);
                }}
                onShowToast={showToast}
            />
            {isToastVisible && <Toast message={toastMessage} onClose={closeToast} />}

            {/* Mobile-First: Bottom Navigation (Replaces FloatingCart on mobile) */}
            <BottomNavigation
                cartItemCount={cart.length}
                totalUsd={totalUsd}
                onOpenCart={openCart}
                onOpenCheckout={openCheckout}
                isVisible={cart.length > 0}
            />

            {/* Desktop: Floating Cart (Hidden on mobile) */}
            <div className="hidden lg:block">
                <FloatingCart count={cart.length} totalUsd={totalUsd} onClick={openCart} />
            </div>
            {activeOrder && <OrderStatusTracker order={activeOrder} onClose={() => { setActiveOrder(null); localStorage.removeItem('rayburger_active_order'); }} />}
            <InstallPrompt />
        </div>
    );
};

export default Storefront;
