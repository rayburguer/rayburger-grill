
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, ArrowLeft, ArrowRight } from 'lucide-react';

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
import RecommendationSection from './components/recommendations/RecommendationSection';
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
import { SuggestionSection } from './components/sections/SuggestionSection';
import { RankingSection } from './components/sections/RankingSection';
import { UNLOCK_THRESHOLD } from './config/constants';

// Hooks
import { useCart } from './hooks/useCart';
import { useAuth } from './hooks/useAuth';
import { useProducts } from './hooks/useProducts';
import { useLoyalty } from './hooks/useLoyalty';
import { useSurveys } from './hooks/useSurveys';
import { useSettings } from './hooks/useSettings';

// Data & Config
import { ALL_CATEGORIES_KEY, SKIP_LINK_ID } from './config/constants';
import { generateUuid } from './utils/helpers';
import { Product, User, Order } from './types';
import { generateWhatsAppLink } from './utils/whatsapp';


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
            const parsed = JSON.parse(saved);
            if (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000) return parsed;
        }
        return null;
    });

    const [isRouletteOpen, setIsRouletteOpen] = useState<boolean>(false);
    const [initialRefCode, setInitialRefCode] = useState<string>('');

    // Toast State
    const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');

    // Hooks usage
    const { cart, addToCart, removeFromCart, updateCartItemQuantity, clearCart, totalUsd } = useCart();
    const { currentUser, registeredUsers, login, logout, register, updateUsers } = useAuth();
    const { products } = useProducts();
    const { tasaBs, updateTasa, guestOrders, addGuestOrder, updateGuestOrders } = useSettings();
    const { addSurvey } = useSurveys();
    const { processOrderRewards } = useLoyalty();

    // FIND FAVORITES FOR 10/10 UX - Memoized to prevent recalculation on every render
    const favoriteBurgers = useMemo(() => {
        if (!currentUser?.orders?.length) return [];
        const itemCounts: Record<string, { count: number, item: any }> = {};
        currentUser.orders.flatMap(o => o.items).forEach(item => {
            if (!itemCounts[item.name]) itemCounts[item.name] = { count: 0, item };
            itemCounts[item.name].count += item.quantity;
        });
        return Object.values(itemCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map(f => f.item.name);
    }, [currentUser?.orders]);

    // Locked Feature Logic
    const isLockedFeatures = (registeredUsers?.length || 0) < UNLOCK_THRESHOLD;

    const handleOpenLeaderboard = () => {
        if (isLockedFeatures) {
            showToast("🔒 ¡Muy Pronto! Se desbloquea al llegar a " + UNLOCK_THRESHOLD + " usuarios.");
            return;
        }
        setIsLeaderboardOpen(true);
    };

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

    const openCheckout = useCallback(() => {
        closeCart();
        setIsCheckoutOpen(true);
    }, [closeCart]);
    const closeCheckout = useCallback(() => setIsCheckoutOpen(false), []);

    const openRegister = useCallback(() => {
        setIsLoginModalOpen(false);
        setIsRegisterModalOpen(true);
    }, []);
    const closeRegister = useCallback(() => setIsRegisterModalOpen(false), []);

    const openLogin = useCallback(() => {
        setIsRegisterModalOpen(false);
        setIsLoginModalOpen(true);
    }, []);
    const closeLogin = useCallback(() => setIsLoginModalOpen(false), []);

    const openProductDetail = useCallback((product: Product) => {
        setSelectedProductForDetail(product);
        setIsProductDetailModalOpen(true);
    }, []);
    const closeProductDetail = useCallback(() => {
        setIsProductDetailModalOpen(false);
        setSelectedProductForDetail(null);
    }, []);

    const openUserProfileModal = useCallback(() => setIsUserProfileModalOpen(true), []);
    const closeUserProfileModal = useCallback(() => setIsUserProfileModalOpen(false), []);

    const handleSelectProduct = (product: Product) => {
        openProductDetail(product);
    };

    const openAdminDashboard = useCallback(() => setIsAdminDashboardOpen(true), []);
    const closeAdminDashboard = useCallback(() => setIsAdminDashboardOpen(false), []);

    const handleLogout = useCallback(() => {
        logout();
        showToast("Sesión cerrada. ¡Hasta pronto!");
    }, [logout, showToast]);

    const handleUserRegistration = useCallback((newUser: User) => {
        const success = register(newUser);
        if (success) {
            showToast("¡Registro exitoso! Bienvenid @" + newUser.name + ".");
            closeRegister();
        } else {
            showToast("Error en el registro. Verifica el código de referido o si el usuario ya existe.");
        }
    }, [register, showToast, closeRegister]);

    const handleLoginSubmit = useCallback((email: string, password: string) => {
        const success = login(email, password);
        if (success) {
            closeLogin();
            showToast("¡Bienvenido de nuevo!");
        } else {
            showToast("Credenciales inválidas.");
        }
    }, [login, closeLogin, showToast]);

    const handleOrderConfirmed = useCallback((buyerEmail: string, buyerName?: string, deliveryInfo?: { method: 'delivery' | 'pickup', fee: number, phone: string }) => {
        let message = "¡Pedido recibido! Pronto nos pondremos en contacto.";
        let currentOrder: any;

        // Process rewards (Points, Cashback, Referrals)
        // If no email, processOrderRewards returns null (Guest)
        const result = processOrderRewards(buyerEmail, cart, totalUsd, registeredUsers, deliveryInfo);

        if (!result) {
            // Guest checkout - order processed
            currentOrder = {
                orderId: generateUuid(),
                timestamp: Date.now(),
                totalUsd: totalUsd + (deliveryInfo?.fee || 0),
                items: cart.map(item => ({ name: item.name, quantity: item.quantity, price_usd: item.finalPrice_usd })),
                pointsEarned: 0,
                status: 'pending',
                deliveryMethod: deliveryInfo?.method || 'pickup',
                deliveryFee: deliveryInfo?.fee || 0,
                customerName: buyerName || "Invitado",
                customerPhone: deliveryInfo?.phone || ""
            };

            addGuestOrder(currentOrder); // PERSIST GUEST ORDER

            // Create a temporary guest user object for WhatsApp generator
            const guestUser: User = {
                name: buyerName || "Invitado",
                email: buyerEmail || "Sin email",
                phone: deliveryInfo?.phone || "",
                passwordHash: "",
                referralCode: "",
                points: 0,
                loyaltyTier: "Bronze",
                role: "customer",
                orders: [currentOrder]
            };

            // WHATSAPP REDIRECT (Guest) - Direct synchronous call
            const link = generateWhatsAppLink(currentOrder, guestUser, cart);
            window.open(link, '_blank');

            showToast(message); // Toast for guest
            clearCart();
            closeCheckout();

            // Allow survey for guest
            setLastOrderId(currentOrder.orderId);
            setTimeout(() => setIsSurveyModalOpen(true), 2000);
            return;
        } else {
            const { updatedUsers, orderSummary } = result;

            // Updated processing message
            message += " Tu pedido está pendiente de verificación.";
            message += "\n🎁 " + orderSummary.pointsEarned + " Puntos reservados.";
            // Referrer gets cashback, not the buyer directly in this summary context for the toast
            // but we could mention if they earned something for their referrer? No, that's private.
            message += "\n(Se liberarán cuando el admin apruebe tu pago)";

            updateUsers(updatedUsers);

            // Get the last order added to the user
            const buyer = updatedUsers.find(u => u.email === buyerEmail);
            if (buyer && buyer.orders.length > 0) {
                currentOrder = buyer.orders[buyer.orders.length - 1];

                // WHATSAPP REDIRECT (Registered User) - Direct synchronous call
                const link = generateWhatsAppLink(currentOrder, buyer, cart);
                window.open(link, '_blank');
            }
        }

        showToast(message);
        clearCart();
        closeCheckout();

        // PERSIST ACTIVE ORDER FOR TRACKING
        if (currentOrder) {
            setActiveOrder(currentOrder);
            localStorage.setItem('rayburger_active_order', JSON.stringify(currentOrder));
        }

        // Trigger Survey
        setLastOrderId('recent-order');
        setTimeout(() => setIsSurveyModalOpen(true), 1500);

    }, [cart, totalUsd, registeredUsers, updateUsers, clearCart, closeCheckout, showToast, processOrderRewards, addGuestOrder]);

    // Simulate initial loading
    useEffect(() => {
        const timer = setTimeout(() => setIsLoadingProducts(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const handleSurveySubmit = useCallback((survey: any) => {
        addSurvey(survey);
        setIsSurveyModalOpen(false);
        showToast("¡Gracias por tu opinión! Nos ayuda a mejorar.");
    }, [addSurvey, showToast]);


    // Helper for adding to cart (wraps hook + modal closing + toast)
    const handleAddToCart = useCallback((product: Product, quantity: number, selectedOptions: { [optionId: string]: boolean }, finalPrice: number) => {
        const type = addToCart(product, quantity, selectedOptions, finalPrice);
        showToast(quantity + "x " + product.name + " " + (type === 'new' ? '(personalizado) ' : '') + "añadido al carrito!");

        // CONFETTI EFFECT! 🎉
        import('./utils/confetti').then(({ triggerConfetti }) => {
            triggerConfetti();
        });

        closeProductDetail();
    }, [addToCart, showToast, closeProductDetail]);

    // NEW: Handle Reorder - adds all items from previous order to cart
    const handleReorder = useCallback((order: Order) => {
        let addedCount = 0;
        order.items.forEach(item => {
            // Find product by name in current products
            const product = products.find(p => p.name === item.name);
            if (product && product.isAvailable !== false) {
                addToCart(product, item.quantity, {}, item.price_usd);
                addedCount += item.quantity;
            }
        });

        if (addedCount > 0) {
            showToast(`🔄 ¡${addedCount} items agregados al carrito!`);
            openCart();

            // Confetti!
            import('./utils/confetti').then(({ triggerConfetti }) => {
                triggerConfetti();
            });
        } else {
            showToast("Algunos productos ya no están disponibles.");
        }
    }, [products, addToCart, showToast, openCart]);


    // Filtering Logic - Memoized categories to prevent recalculation
    const categories = useMemo(() => {
        if (!products.length) return [ALL_CATEGORIES_KEY];

        const uniqueCategories = new Set(products.map(p => p.category));
        const cats = Array.from(uniqueCategories);

        // Custom Sort Order - Optimized for Customer Experience
        const ordered = ['Hamburguesas', 'Perros', 'Combos', 'Extras', 'Bebidas', 'Salsas'];

        return [ALL_CATEGORIES_KEY, ...cats.sort((a, b) => {
            const indexA = ordered.indexOf(a);
            const indexB = ordered.indexOf(b);
            // If both found, sort by index
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            // If only A found, A comes first
            if (indexA !== -1) return -1;
            // If only B found, B comes first
            if (indexB !== -1) return 1;
            // If neither, alphabetical
            return a.localeCompare(b);
        })];
    }, [products]);

    const filteredProducts = useMemo(() => {
        let currentProducts = products;

        // 1. Search Filter (Global or constrained)
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            currentProducts = currentProducts.filter(p =>
                p.name.toLowerCase().includes(lowerCaseSearchTerm)
            );
            // Optional: If you want search to respect the selected category tab:
            if (selectedCategory !== ALL_CATEGORIES_KEY) {
                currentProducts = currentProducts.filter(p => p.category === selectedCategory);
            }
            return currentProducts;
        }

        // 2. Category Filter (No search)
        if (selectedCategory === ALL_CATEGORIES_KEY) {
            // New "Smart Menu" Logic: 
            // If ALL_CATEGORIES is selected, we return EMPTY list for the grid 
            // because we will render the Category Buttons instead.
            // UNLESS there is a search term.
            if (!searchTerm) return [];
        } else {
            currentProducts = currentProducts.filter(p => p.category === selectedCategory);
        }

        // Sort by Category Priority for Main View (Hamburguesas first)
        if (selectedCategory === ALL_CATEGORIES_KEY && !searchTerm) {
            // Logic moved to "Smart Menu" render section
            return [];
        }

        return currentProducts;
    }, [products, searchTerm, selectedCategory]);

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <a href={`#${SKIP_LINK_ID} `} className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-orange-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md">Saltar al contenido principal</a>

            {/* Quick Access Admin Button (Temporary for easy access) */}
            <div className="fixed top-24 right-4 z-40 lg:hidden">
                <button onClick={openAdminDashboard} className="bg-gray-800 p-2 rounded-full border border-gray-600 shadow-lg text-xs font-bold text-gray-500 hover:text-white">Admin</button>
            </div>

            <Header
                cartItemCount={cart.length}
                onOpenCart={openCart}
                currentUser={currentUser}
                onOpenRegister={openRegister}
                onOpenLogin={openLogin}
                onLogout={handleLogout}
                onOpenProfile={openUserProfileModal}
                activeOrder={activeOrder}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center pt-24 pb-24 lg:pb-12 px-4">

                {/* HERO SECTION - Always Visible on Home */}
                {selectedCategory === ALL_CATEGORIES_KEY && !searchTerm && (
                    <HeroSection onCtaClick={() => {
                        document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
                    }} />
                )}

                {/* TOP RANKING / RECOMMENDATIONS - Show on Home */}
                {selectedCategory === ALL_CATEGORIES_KEY && !searchTerm && (
                    <>
                        <div className="w-full max-w-6xl mb-4 mt-8 px-4 flex items-center gap-2">
                            <TrendingUp className="text-orange-500" />
                            <h2 className="text-2xl font-black text-white italic uppercase">Lo Más Vendido</h2>
                        </div>
                        <RankingSection
                            products={products}
                            onSelectProduct={handleSelectProduct}
                        />
                    </>
                )}

                {/* SEARCH BAR (Always visible) */}
                <div id="menu-section" className="w-full max-w-xl mt-8 mb-6 relative z-30">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="¿Qué se te antoja hoy? (Ej: Doble Carne...)"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-800/80 backdrop-blur-xl text-white border border-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 placeholder-gray-500 text-lg shadow-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-6 h-6 group-focus-within:text-orange-500 transition-colors" />
                    </div>
                </div>

                {/* CATEGORY TABS (Scrollable) */}
                <div className="w-full max-w-6xl mb-8 overflow-x-auto pb-4 scrollbar-hide">
                    <div className="flex gap-3 px-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-2 rounded-full whitespace-nowrap font-bold transition-all text-sm uppercase tracking-wide
                                    ${selectedCategory === category
                                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-900/50 scale-105'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* PRODUCT LISTING (Conditional Render) */}
                <div className="w-full max-w-6xl pb-10">
                    {isLoadingProducts ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : (
                        <>
                            {/* CASE 1: SEARCH ACTIVE OR SPECIFIC CATEGORY SELECTED -> Show Grid */}
                            {(searchTerm || selectedCategory !== ALL_CATEGORIES_KEY) && (
                                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    <AnimatePresence>
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map((product, index) => (
                                                <motion.div
                                                    key={product.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
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

                            {/* CASE 2: MAIN HOME VIEW (ALL CATEGORIES) -> Show Sections (Hamburgers First) */}
                            {(!searchTerm && selectedCategory === ALL_CATEGORIES_KEY) && (
                                <div className="space-y-16">
                                    {/* We use the 'categories' array which is already sorted per user request (Hamburguesas first) */}
                                    {categories.filter(c => c !== ALL_CATEGORIES_KEY).map((categoryName) => {
                                        const categoryProducts = products.filter(p => p.category === categoryName);
                                        if (categoryProducts.length === 0) return null;

                                        return (
                                            <motion.section
                                                key={categoryName}
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true, margin: "-50px" }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <div className="flex items-center gap-4 mb-6">
                                                    <h2 className="text-3xl font-black text-white italic uppercase">{categoryName}</h2>
                                                    <div className="h-1 flex-1 bg-gray-800 rounded-full">
                                                        <div className="h-full w-20 bg-orange-600 rounded-full"></div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                    {categoryProducts.map((product) => (
                                                        <ProductCard
                                                            key={product.id}
                                                            product={product}
                                                            onOpenProductDetail={openProductDetail}
                                                        />
                                                    ))}
                                                </div>
                                            </motion.section>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <SuggestionSection />

                <SuggestionSection />

                {/* FAQ Section */}
                <div className="mt-20 w-full bg-gradient-to-t from-black/50 to-transparent pt-10 pb-20">
                    <FAQSection />
                </div>
            </main>

            <Footer />

            {/* Modals */}
            <CartModal
                isOpen={isCartOpen}
                onClose={closeCart}
                cart={cart}
                totalUsd={totalUsd}
                onRemoveItem={removeFromCart}
                onUpdateItemQuantity={updateCartItemQuantity}
                onProceedToCheckout={openCheckout}
                allProducts={products}
                onQuickAdd={(product) => handleAddToCart(product, 1, {}, product.basePrice_usd)}
            />
            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={closeCheckout}
                totalUsd={totalUsd}
                tasaBs={tasaBs}
                onOrderConfirmed={handleOrderConfirmed}
                currentUser={currentUser}
            />
            {/* Auth Modals */}
            <RegisterModal
                isOpen={isRegisterModalOpen}
                onClose={closeRegister}
                onRegister={handleUserRegistration}
                registeredUsers={registeredUsers}
                onOpenLogin={openLogin}
                initialReferralCode={initialRefCode}
            />
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={closeLogin}
                onLogin={handleLoginSubmit}
                onOpenRegister={openRegister}
            />
            <ProductDetailModal
                isOpen={isProductDetailModalOpen}
                onClose={closeProductDetail}
                product={selectedProductForDetail}
                onAddToCart={handleAddToCart}
            />
            <UserProfileModal
                isOpen={isUserProfileModalOpen}
                onClose={closeUserProfileModal}
                user={currentUser}
                onShowToast={showToast}
                onReorder={handleReorder}
            />
            {/* NEW: Admin Dashboard */}
            <AdminDashboard
                isOpen={isAdminDashboardOpen}
                onClose={closeAdminDashboard}
                registeredUsers={registeredUsers}
                updateUsers={updateUsers}
                tasaBs={tasaBs}
                onUpdateTasa={updateTasa}
                guestOrders={guestOrders}
                updateGuestOrders={updateGuestOrders}
            />
            {/* NEW: Survey Modal */}
            <SurveyModal
                isOpen={isSurveyModalOpen}
                onClose={() => setIsSurveyModalOpen(false)}
                onSubmit={handleSurveySubmit}
                orderId={lastOrderId}
                userId={currentUser?.email}
            />
            {/* NEW: Leaderboard Modal */}
            <LeaderboardModal
                isOpen={isLeaderboardOpen}
                onClose={() => setIsLeaderboardOpen(false)}
                users={registeredUsers}
            />
            {/* NEW: Roulette Modal */}
            <RouletteModal
                isOpen={isRouletteOpen}
                onClose={() => setIsRouletteOpen(false)}
                currentUser={currentUser}
                onUpdateUser={(updatedUser) => {
                    // Update user in auth context logic implies refreshing "registeredUsers" and "currentUser"
                    // Since "updateUsers" handles the array, we must update the specific user inside it.
                    const updatedList = registeredUsers.map(u => u.email === updatedUser.email ? updatedUser : u);
                    updateUsers(updatedList);
                }}
                onShowToast={showToast}
            />

            {isToastVisible && <Toast message={toastMessage} onClose={closeToast} />}

            <FloatingCart
                count={cart.length}
                totalUsd={totalUsd}
                onClick={openCart}
            />

            {/* 10/10 UX Order Tracker */}
            <OrderStatusTracker
                order={activeOrder}
                onClose={() => {
                    setActiveOrder(null);
                    localStorage.removeItem('rayburger_active_order');
                }}
            />

            <InstallPrompt />
        </div >
    );
};

export default App;
