import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp } from 'lucide-react';

// Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProductCard from './components/products/ProductCard';
import ProductCardSkeleton from './components/ui/ProductCardSkeleton';
import ProductDetailModal from './components/products/ProductDetailModal';
import CartModal from './components/cart/CartModal';
import CheckoutModal from './components/checkout/CheckoutModal';
import RegisterModal from './components/auth/RegisterModal';
import LoginModal from './components/auth/LoginModal';
import UserProfileModal from './components/user/UserProfileModal';
import AdminDashboard from './components/admin/AdminDashboard';
import HeroSection from './components/layout/HeroSection';
import FAQSection from './components/layout/FAQSection';
import OrderStatusTracker from './components/ui/OrderStatusTracker';
import SurveyModal from './components/feedback/SurveyModal';
import LeaderboardModal from './components/loyalty/LeaderboardModal';
import Toast from './components/ui/Toast';
import FloatingCart from './components/ui/FloatingCart';
import InstallPrompt from './components/ui/InstallPrompt';
import RouletteModal from './components/loyalty/RouletteModal';
import { RankingSection } from './components/sections/RankingSection';
import { IngredientVoting } from './components/voting/IngredientVoting';

// Hooks
import { useCart } from './hooks/useCart';
import { useAuth } from './hooks/useAuth';
import { useProducts } from './hooks/useProducts';
import { useLoyalty } from './hooks/useLoyalty';
import { useSurveys } from './hooks/useSurveys';
import { useSettings } from './hooks/useSettings';
import { useCloudSync } from './hooks/useCloudSync';

// Data & Config
import { ALL_CATEGORIES_KEY, SKIP_LINK_ID } from './config/constants';
import { generateUuid } from './utils/helpers';
import { Product, User, Order } from './types';
import { generateWhatsAppLink } from './utils/whatsapp';

// --- STABILIZED SUB-COMPONENTS ---
const MemoizedHeader = React.memo(Header);
const MemoizedFooter = React.memo(Footer);

const App: React.FC = () => {
    // State
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES_KEY);
    const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

    // Modals State
    const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
    const [isProductDetailModalOpen, setIsProductDetailModalOpen] = useState<boolean>(false);
    const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
    const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState<boolean>(false);
    const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
    const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
    const [lastOrderId, setLastOrderId] = useState<string>('');
    const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
        const saved = localStorage.getItem('rayburger_active_order');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000) return parsed;
            } catch (e) { return null; }
        }
        return null;
    });

    const [isRouletteOpen, setIsRouletteOpen] = useState<boolean>(false);
    const [initialRefCode, setInitialRefCode] = useState<string>('');

    // Toast State
    const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');

    // Accordion State
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'Hamburguesas': true,
        'Perros': true,
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
    const { tasaBs, updateTasa, guestOrders, addGuestOrder, updateGuestOrders } = useSettings();
    const { addSurvey } = useSurveys();
    const { processOrderRewards } = useLoyalty();
    const { migrateAllToCloud } = useCloudSync();

    // Toast Handlers
    const showToast = useCallback((message: string) => {
        setToastMessage(message);
        setIsToastVisible(true);
    }, []);

    // Check URL for referral code on mount
    const refProcessed = React.useRef(false);
    useEffect(() => {
        if (refProcessed.current) return;
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref && !currentUser) {
            setInitialRefCode(ref);
            setIsRegisterModalOpen(true);
            showToast("🎁 ¡Código de referido detectado!");
            refProcessed.current = true;
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [currentUser, showToast]);

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

    const openAdminDashboard = useCallback(() => setIsAdminDashboardOpen(true), []);
    const closeAdminDashboard = useCallback(() => setIsAdminDashboardOpen(false), []);

    // Deep Link Detection: Auto-open Admin if URL has admin params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const adminParam = params.get('admin');
        const orderIdParam = params.get('orderId');

        if (adminParam === 'orders' && orderIdParam) {
            // Open Admin Dashboard automatically
            setIsAdminDashboardOpen(true);
            // Clean URL params after opening (optional, for cleaner UX)
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // Auto-sync to cloud every 5 minutes (300000ms) for data protection
    useEffect(() => {
        const syncInterval = setInterval(async () => {
            try {
                await migrateAllToCloud();
                // console.debug('✅ Auto-sync completado');
            } catch (error) {
                console.error('❌ Error en auto-sync:', error);
            }
        }, 5 * 60 * 1000); // 5 minutes

        // Cleanup on unmount
        return () => clearInterval(syncInterval);
    }, [migrateAllToCloud]);

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
        const success = await login(email, password);
        if (success) {
            closeLogin();
            showToast("¡Bienvenido de nuevo!");
        } else {
            // showToast("Credenciales inválidas."); // Removed to let Modal handle it inline? Or keep both? Keeping both is fine, but inline is better. 
            // Actually, let's keep toast as backup, but return success so modal knows to shake/error.
            showToast("Credenciales inválidas.");
        }
        return success;
    }, [login, closeLogin, showToast]);

    const handleOrderConfirmed = useCallback(async (buyerEmail: string, buyerName?: string, deliveryInfo?: { method: 'delivery' | 'pickup', fee: number, phone: string }, newRegistrationData?: { password: string }, pointsUsed: number = 0) => {
        let message = "¡Pedido recibido! Pronto nos pondremos en contacto.";
        let finalUser = currentUser;

        // SEAMLESS REGISTRATION LOGIC
        if (!currentUser && newRegistrationData && buyerName && deliveryInfo?.phone) {
            const newUser: User = {
                name: buyerName,
                email: buyerEmail,
                phone: deliveryInfo.phone,
                passwordHash: newRegistrationData.password,
                referralCode: `RB-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                points: 50, // Welcome Bonus included in register() usually, but safe to set
                loyaltyTier: 'Bronze',
                role: 'customer',
                orders: [],
                lastPointsUpdate: Date.now()
            };

            // Attempt to register
            const success = await register(newUser);
            if (success) {
                finalUser = newUser; // Use the new user for rewards processing
                showToast("🎉 ¡Cuenta creada! Te has ganado $50 de bienvenida.");
            } else {
                showToast("⚠️ No se pudo crear la cuenta (¿Email usado?), pero procesaremos tu pedido.");
            }
        }

        let currentOrder: any;

        const result = processOrderRewards(buyerEmail, cart, totalUsd, registeredUsers, deliveryInfo);

        // If we have a user (either existing or newly registered)
        if (finalUser) {
            // Re-process rewards with the correct user context if needed, 
            // but processOrderRewards likely uses the email to find the user in registeredUsers.
            // Since register() updates registeredUsers asynchronously, we might need to rely on the fact 
            // that 'registeredUsers' in this closure might be stale.
            // HOWEVER, processOrderRewards takes 'registeredUsers' as arg.
            // If we just registered, 'registeredUsers' state here might not have the new user yet 
            // because React state updates in the next render cycle.

            // WORKAROUND: Create a temporary updated list for the calculation
            let currentUsersList = registeredUsers;
            if (!currentUser && finalUser) { // If we just registered
                currentUsersList = [...registeredUsers, finalUser];
            }

            const resultWithNewUser = processOrderRewards(buyerEmail, cart, totalUsd, currentUsersList, deliveryInfo);

            if (resultWithNewUser) {
                const { updatedUsers, orderSummary } = resultWithNewUser;

                // DEDUCT POINTS IF USED
                let finalUpdatedUsers = updatedUsers;
                if (pointsUsed > 0) {
                    finalUpdatedUsers = updatedUsers.map(u => {
                        if (u.email === buyerEmail) {
                            return { ...u, points: Math.max(0, u.points - pointsUsed) };
                        }
                        return u;
                    });
                    showToast(`💎 ${pointsUsed} puntos canjeados = $${(pointsUsed / 100).toFixed(2)} de descuento`);
                }

                updateUsers(finalUpdatedUsers);
                const buyer = finalUpdatedUsers.find(u => u.email === buyerEmail);
                if (buyer && buyer.orders.length > 0) {
                    currentOrder = buyer.orders[buyer.orders.length - 1];
                    const link = generateWhatsAppLink(currentOrder, buyer, cart);
                    window.open(link, '_blank');
                }
                showToast(message + "\n🎁 " + orderSummary.pointsEarned + " Puntos procesados.");
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
                status: 'pending',
                deliveryMethod: deliveryInfo?.method || 'pickup',
                deliveryFee: deliveryInfo?.fee || 0,
                customerName: buyerName || "Invitado",
                customerPhone: deliveryInfo?.phone || ""
            };
            addGuestOrder(currentOrder);
            const guestUser: User = {
                name: buyerName || "Invitado", email: buyerEmail || "Sin email", phone: deliveryInfo?.phone || "",
                passwordHash: "", referralCode: "", points: 0, loyaltyTier: "Bronze", role: 'customer', orders: [currentOrder]
            };
            const link = generateWhatsAppLink(currentOrder, guestUser, cart);
            window.open(link, '_blank');
            showToast(message);
        }

        clearCart();
        closeCheckout();
        if (currentOrder) {
            setActiveOrder(currentOrder);
            localStorage.setItem('rayburger_active_order', JSON.stringify(currentOrder));
        }
        setLastOrderId('recent-order');
        setTimeout(() => setIsSurveyModalOpen(true), 1500);
    }, [cart, totalUsd, registeredUsers, updateUsers, clearCart, closeCheckout, showToast, processOrderRewards, addGuestOrder, register, currentUser]);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoadingProducts(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const handleSurveySubmit = useCallback((survey: any) => {
        addSurvey(survey);
        setIsSurveyModalOpen(false);
        showToast("¡Gracias por tu opinión!");
    }, [addSurvey, showToast]);

    const handleAddToCart = useCallback((product: Product, quantity: number, selectedOptions: { [optionId: string]: boolean }, finalPrice: number) => {
        addToCart(product, quantity, selectedOptions, finalPrice);
        showToast(quantity + "x " + product.name + " añadido!");
        import('./utils/confetti').then(({ triggerConfetti }) => triggerConfetti());
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
            import('./utils/confetti').then(({ triggerConfetti }) => triggerConfetti());
        }
    }, [products, addToCart, showToast, openCart]);

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

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <a href={`#${SKIP_LINK_ID}`} className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-orange-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md">Saltar al contenido principal</a>

            <MemoizedHeader
                cartItemCount={cart.length}
                onOpenCart={openCart}
                currentUser={currentUser}
                onOpenRegister={openRegister}
                onOpenLogin={openLogin}
                onLogout={handleLogout}
                onOpenProfile={openUserProfileModal}
                onOpenAdmin={openAdminDashboard}
                onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
                onOpenRoulette={() => setIsRouletteOpen(true)}
                activeOrder={activeOrder}
            />

            <main className="flex-1 flex flex-col items-center pt-24 pb-24 lg:pb-12 px-4 whitespace-normal">
                {selectedCategory === ALL_CATEGORIES_KEY && !searchTerm && (
                    <HeroSection onCtaClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })} />
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
                                                    <ProductCard product={product} onOpenProductDetail={openProductDetail} />
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
                                                                    {categoryProducts.map((product) => <ProductCard key={product.id} product={product} onOpenProductDetail={openProductDetail} />)}
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

                {/* SuggestionSection REMOVED - Keeping only IngredientVoting for cleaner UX */}
                <IngredientVoting />
                <div className="mt-20 w-full bg-gradient-to-t from-black/50 to-transparent pt-10 pb-20"><FAQSection /></div>
            </main>

            <MemoizedFooter />

            <CartModal
                isOpen={isCartOpen} onClose={closeCart} cart={cart} totalUsd={totalUsd}
                onRemoveItem={removeFromCart} onUpdateItemQuantity={updateCartItemQuantity}
                onProceedToCheckout={openCheckout} allProducts={products}
                onQuickAdd={(product) => addToCart(product, 1, {}, product.basePrice_usd)}
            />
            <CheckoutModal
                isOpen={isCheckoutOpen} onClose={closeCheckout} totalUsd={totalUsd} tasaBs={tasaBs}
                onOrderConfirmed={handleOrderConfirmed} currentUser={currentUser}
            />
            <RegisterModal
                isOpen={isRegisterModalOpen} onClose={closeRegister} onRegister={handleUserRegistration}
                registeredUsers={registeredUsers} onOpenLogin={openLogin} initialReferralCode={initialRefCode}
            />
            <LoginModal isOpen={isLoginModalOpen} onClose={closeLogin} onLogin={handleLoginSubmit} onOpenRegister={openRegister} />
            <ProductDetailModal isOpen={isProductDetailModalOpen} onClose={closeProductDetail} product={selectedProductForDetail} onAddToCart={handleAddToCart} />
            <UserProfileModal
                isOpen={isUserProfileModalOpen}
                onClose={closeUserProfileModal}
                user={currentUser}
                onShowToast={showToast}
                onReorder={handleReorder}
                onClaimAdmin={() => {
                    if (!currentUser) return;
                    // FORCE IMMEDIATE STORAGE UPDATE (Bypassing debounce race conditions)
                    const upgradedUser: User = { ...currentUser, role: 'admin' };
                    const updatedList = registeredUsers.map(u => u.email === currentUser.email ? upgradedUser : u);

                    try {
                        localStorage.setItem('rayburger_registered_users', JSON.stringify(updatedList));
                        localStorage.setItem('rayburger_current_user', JSON.stringify(upgradedUser));

                        // Update React State as well just in case
                        updateUsers(updatedList);

                        showToast("👑 ¡Larga vida al Rey! Eres Admin. (Recargando...)");
                        setTimeout(() => window.location.reload(), 500);
                    } catch (e) {
                        console.error("Failed to force-save admin upgrade", e);
                        showToast("Error al guardar privilegios. Intenta de nuevo.");
                    }
                }}
            />
            <AdminDashboard
                isOpen={isAdminDashboardOpen} onClose={closeAdminDashboard} registeredUsers={registeredUsers}
                updateUsers={updateUsers} tasaBs={tasaBs} onUpdateTasa={updateTasa} guestOrders={guestOrders} updateGuestOrders={updateGuestOrders}
                onShowToast={showToast}
            />
            <SurveyModal isOpen={isSurveyModalOpen} onClose={() => setIsSurveyModalOpen(false)} onSubmit={handleSurveySubmit} orderId={lastOrderId} userId={currentUser?.email} />
            <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} users={registeredUsers} />
            <RouletteModal
                isOpen={isRouletteOpen} onClose={() => setIsRouletteOpen(false)} currentUser={currentUser}
                onUpdateUser={(updatedUser) => {
                    const updatedList = registeredUsers.map(u => u.email === updatedUser.email ? updatedUser : u);
                    updateUsers(updatedList);
                }}
                onShowToast={showToast}
            />
            {isToastVisible && <Toast message={toastMessage} onClose={closeToast} />}
            <FloatingCart count={cart.length} totalUsd={totalUsd} onClick={openCart} />
            <OrderStatusTracker order={activeOrder} onClose={() => { setActiveOrder(null); localStorage.removeItem('rayburger_active_order'); }} />
            <InstallPrompt />
        </div>
    );
};

export default App;
