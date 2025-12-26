import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { Plus, Minus, Trash2, ShoppingBag, CreditCard, Banknote, Smartphone } from 'lucide-react';

interface QuickPOSProps {
    products: Product[];
    tasaBs: number;
    cashierName: string; // NEW PROP
    onProcessOrder: (orderData: any) => Promise<void>;
}

export const QuickPOS: React.FC<QuickPOSProps> = ({ products, tasaBs, cashierName, onProcessOrder }) => {
    // Local POS Cart State
    const [posCart, setPosCart] = useState<{ product: Product; quantity: number }[]>([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pago_movil' | 'zelle'>('pago_movil');
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredProducts = useMemo(() => {
        let result = selectedCategory === 'Todos'
            ? availableProducts
            : availableProducts.filter(p => p.category === selectedCategory);

        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(search) ||
                p.category.toLowerCase().includes(search)
            );
        }
        return result;
    }, [availableProducts, selectedCategory, searchTerm]);

    const [customerPhone, setCustomerPhone] = useState('');

    const handleCheckout = async () => {
        if (posCart.length === 0) return;

        const orderData = {
            orderId: Math.random().toString(36).substring(2, 9).toUpperCase(),
            timestamp: Date.now(),
            items: posCart.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                price_usd: item.product.basePrice_usd,
            })),
            totalUsd: cartTotalUsd,
            paymentMethod: paymentMethod,
            deliveryMethod: 'pickup',
            deliveryFee: 0,
            customerName: customerPhone ? 'Cliente Registrado' : 'Cliente en Local',
            customerPhone: customerPhone || undefined,
            status: 'approved', // Status set to approved as per POS requirement
            processedBy: cashierName,
            pointsEarned: Math.floor(cartTotalUsd * 3) // POS standard: 3% reward
        };

        await onProcessOrder(orderData);
        setPosCart([]);
        setCustomerPhone('');
        setIsCheckingOut(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* Search Bar */}
            <div className="p-2 bg-gray-800 border-b border-gray-700 flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-orange-500"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                            <Plus className="rotate-45" size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Top Bar: Categories */}
            <div className="flex overflow-x-auto gap-2 p-2 bg-gray-800/50 border-b border-gray-700 hide-scrollbar shrink-0">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full whitespace-nowrap text-xs font-bold transition-colors border ${selectedCategory === cat
                            ? 'bg-orange-600 border-orange-500 text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-400'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Main Content Area: Products Grid + Cart Sidebar */}
            <div className="flex flex-1 overflow-hidden">
                {/* Product Grid (Left) */}
                <div className="flex-1 overflow-y-auto p-2 bg-gray-900/50">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToPosCart(product)}
                                className="relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-sm hover:border-orange-500 active:scale-95 transition-all text-left flex flex-col h-32 md:h-36"
                            >
                                <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
                                <div className="relative h-full flex flex-col justify-end p-2 sm:p-3">
                                    <span className="font-bold text-white text-sm leading-tight drop-shadow-md line-clamp-2">{product.name}</span>
                                    <span className="text-orange-400 font-extrabold text-xs mt-0.5">${product.basePrice_usd}</span>
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

                {/* Cart Sidebar (Right - Always visible on Desktop, hidden on small mobile) */}
                <div className="w-96 bg-gray-800 border-l border-gray-700 flex-col hidden md:flex shadow-2xl z-10">
                    <div className="p-4 border-b border-gray-700 bg-gray-800 shadow-sm">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <ShoppingBag size={18} className="text-orange-500" />
                            Pedido Actual
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {posCart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                <ShoppingBag size={48} className="mb-2 stroke-1" />
                                <p className="text-sm">Agrega productos</p>
                            </div>
                        ) : (
                            posCart.map(item => (
                                <div key={item.product.id} className="bg-gray-700/50 p-2 rounded-lg border border-gray-600 flex justify-between items-center group hover:border-orange-500/30 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center font-bold text-white text-xs shrink-0 border border-gray-600">
                                            {item.quantity}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-white text-sm truncate">{item.product.name}</p>
                                            <p className="text-orange-400 text-xs font-mono">${(item.product.basePrice_usd * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 bg-gray-800 rounded-lg p-0.5 border border-gray-600">
                                        <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"><Minus size={12} /></button>
                                        <button onClick={() => removeFromPosCart(item.product.id)} className="p-1.5 text-red-500 hover:bg-red-900/30 rounded mx-0.5"><Trash2 size={12} /></button>
                                        <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1.5 text-green-400 hover:text-white hover:bg-green-900/30 rounded"><Plus size={12} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-gray-900 border-t border-gray-700">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-gray-400 text-xs font-bold uppercase">Total</span>
                            <div className="text-right">
                                <p className="text-2xl font-black text-white leading-none">${cartTotalUsd.toFixed(2)}</p>
                                <p className="text-xs text-gray-500 font-mono mt-1">Bs. {cartTotalBs.toFixed(2)}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsCheckingOut(true)}
                            disabled={posCart.length === 0}
                            className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${posCart.length === 0
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-500 hover:scale-[1.02]'
                                }`}
                        >
                            <span>Cobrar</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Bar (Only visible on mobile now) */}
            <div className="md:hidden bg-gray-800 border-t border-gray-700 p-3 shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                        <span className="text-gray-400 text-xs font-bold uppercase">Total ({posCart.reduce((a, b) => a + b.quantity, 0)})</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-white text-2xl font-black">${cartTotalUsd.toFixed(2)}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCheckingOut(true)}
                        disabled={posCart.length === 0}
                        className={`px-6 py-3 rounded-xl font-bold text-lg shadow-lg flex items-center gap-2 ${posCart.length === 0
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-500'
                            }`}
                    >
                        <span>Ver / Cobrar</span>
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
                            <button
                                onClick={() => setIsCheckingOut(false)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-xs font-bold flex items-center gap-2 transition-colors"
                            >
                                <Plus className="rotate-45" size={16} /> Seguir Pidiendo
                            </button>
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
                                        <button
                                            onClick={() => removeFromPosCart(item.product.id)}
                                            className="p-1.5 bg-red-900/30 text-red-500 hover:bg-red-600 hover:text-white rounded ml-2 transition-colors"
                                            title="Eliminar del pedido"
                                        >
                                            <Trash2 size={16} />
                                        </button>
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
