import React, { useState, useMemo } from 'react';
import { Product, Order, User } from '../../types';
import { Plus, Minus, Trash2, ShoppingBag, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { useCart } from '../../hooks/useCart'; // We might reuse cart logic or build a simple local one for POS

interface QuickPOSProps {
    products: Product[];
    tasaBs: number;
    onProcessOrder: (orderData: any) => Promise<void>;
}

export const QuickPOS: React.FC<QuickPOSProps> = ({ products, tasaBs, onProcessOrder }) => {
    // Local POS Cart State
    const [posCart, setPosCart] = useState<{ product: Product; quantity: number }[]>([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pago_movil' | 'zelle'>('pago_movil');

    // Filter out unavailable products
    const availableProducts = useMemo(() => products.filter(p => p.isAvailable !== false), [products]);

    // Categories for filter
    const categories = useMemo(() => ['Todos', ...Array.from(new Set(availableProducts.map(p => p.category)))], [availableProducts]);
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    const addToPosCart = (product: Product) => {
        setPosCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromPosCart = (productId: number) => {
        setPosCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: number, delta: number) => {
        setPosCart(prev => {
            return prev.map(item => {
                if (item.product.id === productId) {
                    const newQty = item.quantity + delta;
                    if (newQty <= 0) return item; // Don't remove, just stay at 1 or handle removal explicitly
                    return { ...item, quantity: newQty };
                }
                return item;
            });
        });
    };

    const cartTotalUsd = posCart.reduce((sum, item) => sum + (item.product.basePrice_usd * item.quantity), 0);
    const cartTotalBs = cartTotalUsd * tasaBs;

    const filteredProducts = selectedCategory === 'Todos'
        ? availableProducts
        : availableProducts.filter(p => p.category === selectedCategory);

    const [customerPhone, setCustomerPhone] = useState('');

    const handleCheckout = async () => {
        if (posCart.length === 0) return;

        // Construct simplified order object
        const orderData = {
            items: posCart.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                price_usd: item.product.basePrice_usd,
            })),
            totalUsd: cartTotalUsd,
            paymentMethod: paymentMethod,
            deliveryMethod: 'pickup',
            deliveryFee: 0,
            customerName: customerPhone ? 'Cliente Registrado' : 'Cliente en Local', // Placeholder name if phone provided
            customerPhone: customerPhone || undefined, // Store phone if provided
            status: 'approved'
        };

        if (customerPhone) {
            // WhatsApp Link for receipt (simulated)
            const message = `🧾 *Recibo Ray Burger*\n\nGracias por tu compra de $${cartTotalUsd.toFixed(2)}.\n\nDisfruta tu pedido! 🍔`;
            const whatsappUrl = `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }

        await onProcessOrder(orderData);
        setPosCart([]);
        setCustomerPhone('');
        setIsCheckingOut(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* Top Bar: Categories */}
            <div className="flex overflow-x-auto gap-2 p-2 bg-gray-800 border-b border-gray-700 hide-scrollbar shrink-0">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-colors ${selectedCategory === cat
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-700 text-gray-300'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Main Content Area: Products Grid + Cart Sidebar */}
            <div className="flex flex-1 overflow-hidden">
                {/* Product Grid (Left/Top) */}
                <div className="flex-1 overflow-y-auto p-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToPosCart(product)}
                                className="relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-sm hover:border-orange-500 active:scale-95 transition-all text-left flex flex-col h-32 md:h-40"
                            >
                                <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
                                <div className="relative h-full flex flex-col justify-end p-2 md:p-3">
                                    <span className="font-bold text-white text-sm md:text-base leading-tight drop-shadow-md">{product.name}</span>
                                    <span className="text-orange-400 font-extrabold text-xs md:text-sm mt-0.5">${product.basePrice_usd}</span>
                                </div>
                                {/* Count Badge */}
                                {posCart.find(i => i.product.id === product.id) && (
                                    <div className="absolute top-1 right-1 bg-orange-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg border border-orange-400">
                                        {posCart.find(i => i.product.id === product.id)?.quantity}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cart Summary (Right/Bottom Panel on Mobile? No, simple bottom bar on mobile) */}
                {/* For this specific request "Mobile First POS", let's use a bottom drawer style for mobile, and sidebar for desktop if space permits. 
                    Actually, let's keep it simple: A permanent bottom bar showing total + "Charge" button that opens details.
                */}
            </div>

            {/* Bottom Floating Bar */}
            <div className="bg-gray-800 border-t border-gray-700 p-3 shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                        <span className="text-gray-400 text-xs font-bold uppercase">Total ({posCart.reduce((a, b) => a + b.quantity, 0)} items)</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-white text-2xl font-black">${cartTotalUsd.toFixed(2)}</span>
                            <span className="text-gray-500 text-sm font-mono">Bs. {cartTotalBs.toFixed(2)}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCheckingOut(true)}
                        disabled={posCart.length === 0}
                        className={`px-8 py-3 rounded-xl font-bold text-lg shadow-lg flex items-center gap-2 ${posCart.length === 0
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-500'
                            }`}
                    >
                        <span>Cobrar</span>
                        <ShoppingBag size={20} />
                    </button>
                </div>
            </div>

            {/* Checkout Modal Overlay */}
            {isCheckingOut && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
                    <div className="bg-gray-900 w-full sm:max-w-md sm:rounded-2xl border-t sm:border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50 rounded-t-2xl">
                            <h3 className="text-xl font-bold text-white">Resumen de Venta</h3>
                            <button onClick={() => setIsCheckingOut(false)} className="p-2 hover:bg-gray-700 rounded-full text-white"><Minus /></button>
                        </div>

                        {/* Order Items List */}
                        <div className="overflow-y-auto p-4 flex-1 space-y-3">
                            {posCart.map(item => (
                                <div key={item.product.id} className="flex justify-between items-center bg-gray-800 p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center font-bold text-white text-sm">
                                            {item.quantity}x
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{item.product.name}</p>
                                            <p className="text-gray-400 text-xs">${(item.product.basePrice_usd * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 text-gray-400 hover:text-white"><Minus size={16} /></button>
                                        <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 text-gray-400 hover:text-white"><Plus size={16} /></button>
                                        <button onClick={() => removeFromPosCart(item.product.id)} className="p-1 text-red-400 hover:text-red-300 ml-2"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Payment Method Selector */}
                        <div className="p-4 bg-gray-800 border-t border-gray-700">
                            {/* OPTIONAL LOYALTY INPUT */}
                            <div className="mb-4 bg-gray-700/50 p-3 rounded-xl border border-dashed border-gray-600">
                                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">
                                    🎁 Puntos / Recibo (Opcional)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="tel"
                                        placeholder="Número WhatsApp (58...)"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-lg font-mono outline-none focus:border-orange-500"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">Si ingresas número, se enviará recibo y sumará puntos.</p>
                            </div>

                            <p className="text-gray-400 text-xs font-bold uppercase mb-2">Método de Pago</p>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <button
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 ${paymentMethod === 'cash' ? 'bg-green-600/20 border-green-500 text-green-400' : 'bg-gray-700 border-transparent text-gray-400'}`}
                                >
                                    <Banknote size={20} />
                                    <span className="text-xs font-bold">Efectivo</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('pago_movil')}
                                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 ${paymentMethod === 'pago_movil' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-gray-700 border-transparent text-gray-400'}`}
                                >
                                    <Smartphone size={20} />
                                    <span className="text-xs font-bold">Pago Móvil</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('zelle')}
                                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 ${paymentMethod === 'zelle' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-gray-700 border-transparent text-gray-400'}`}
                                >
                                    <CreditCard size={20} />
                                    <span className="text-xs font-bold">Zelle</span>
                                </button>
                            </div>

                            <button
                                onClick={handleCheckout}
                                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black text-xl rounded-xl shadow-xl flex items-center justify-center gap-2"
                            >
                                <span>Confirmar cobro ${cartTotalUsd.toFixed(2)}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
