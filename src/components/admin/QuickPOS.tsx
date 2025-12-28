import React, { useState, useMemo } from 'react';
import { Product, User } from '../../types';
import { Plus, Minus, Trash2, ShoppingBag, Banknote, Smartphone, CreditCard, X as XIcon } from 'lucide-react';
import { POSProductCustomizer } from './POSProductCustomizer';
import { normalizePhone } from '../../utils/helpers';

interface POSCartItem {
    product: Product;
    quantity: number;
    selectedOptions: { [optionId: string]: boolean };
    finalPrice: number;
}

interface QuickPOSProps {
    products: Product[];
    tasaBs: number;
    cashierName: string;
    onProcessOrder: (orderData: any) => Promise<void>;
    registeredUsers: User[];
}

export const QuickPOS: React.FC<QuickPOSProps> = ({ products, tasaBs, cashierName, onProcessOrder, registeredUsers }) => {
    const [posCart, setPosCart] = useState<POSCartItem[]>([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pago_movil' | 'zelle'>('pago_movil');
    const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
    const [deliveryFee, setDeliveryFee] = useState<number>(0);
    const [customerPhone, setCustomerPhone] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    // Customization Modal State
    const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

    const availableProducts = useMemo(() => products.filter(p => p.isAvailable !== false), [products]);
    const categories = useMemo(() => ['Todos', ...Array.from(new Set(availableProducts.map(p => p.category)))], [availableProducts]);

    const addToPosCart = (product: Product, options?: { [optionId: string]: boolean }, price?: number) => {
        const selectedOptions = options || {};
        const finalPrice = price || product.basePrice_usd;

        setPosCart(prev => {
            // Check for identical item (same product + same options)
            const existingIndex = prev.findIndex(item =>
                item.product.id === product.id &&
                JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions)
            );

            if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
                return updated;
            }
            return [...prev, { product, quantity: 1, selectedOptions, finalPrice }];
        });
    };

    const handleProductClick = (product: Product) => {
        if (product.customizableOptions && product.customizableOptions.length > 0) {
            setCustomizingProduct(product);
        } else {
            addToPosCart(product);
        }
    };

    const removeFromPosCart = (index: number) => {
        setPosCart(prev => prev.filter((_, i) => i !== index));
    };

    const removeAllByProduct = (productId: number) => {
        setPosCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (index: number, delta: number) => {
        setPosCart(prev => {
            const updated = [...prev];
            const newQty = updated[index].quantity + delta;
            if (newQty <= 0) {
                return prev.filter((_, i) => i !== index);
            }
            updated[index] = { ...updated[index], quantity: newQty };
            return updated;
        });
    };

    const cartTotalUsd = posCart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
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

    const [isProcessing, setIsProcessing] = useState(false);

    const handleCheckout = async () => {
        if (posCart.length === 0 || isProcessing) return;

        setIsProcessing(true);

        try {
            const orderData = {
                orderId: `POS-${Date.now()}`,
                timestamp: Date.now(),
                items: posCart.map(item => ({
                    name: item.product.name,
                    quantity: item.quantity,
                    price_usd: item.finalPrice,
                    selectedOptions: item.selectedOptions
                })),
                totalUsd: cartTotalUsd + (deliveryMethod === 'delivery' ? deliveryFee : 0),
                paymentMethod: paymentMethod,
                deliveryMethod: deliveryMethod,
                deliveryFee: deliveryMethod === 'delivery' ? deliveryFee : 0,
                customerName: (() => {
                    if (!customerPhone) return 'Cliente en Local';
                    const cleanInput = normalizePhone(customerPhone);
                    const user = registeredUsers.find(u => normalizePhone(u.phone) === cleanInput);
                    return user ? user.name : `Cliente (${customerPhone})`;
                })(),
                customerPhone: customerPhone ? (customerPhone.startsWith('0') && customerPhone.length === 11 ? `+58${customerPhone.substring(1)}` : (customerPhone.startsWith('+') ? customerPhone : `+58${customerPhone}`)) : undefined,
                status: 'pending',
                processedBy: cashierName,
                pointsEarned: Math.floor(cartTotalUsd)
            };

            // Execute the order processing with timeout protection
            const processWithTimeout = Promise.race([
                onProcessOrder(orderData),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout: La operación tardó demasiado')), 10000)
                )
            ]);

            await processWithTimeout;

            // Success: Clear cart and close modal
            setPosCart([]);
            setCustomerPhone('');
            setDeliveryFee(0);
            setIsCheckingOut(false);

        } catch (error) {
            console.error("❌ Error processing order:", error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            alert(`⚠️ Error al procesar la venta:\n${errorMessage}\n\nPor favor intenta de nuevo o contacta soporte.`);
        } finally {
            // ALWAYS reset processing state to unblock the button
            setIsProcessing(false);
        }
    };

    const getProductBadgeCount = (productId: number) => {
        return posCart.filter(item => item.product.id === productId).reduce((sum, item) => sum + item.quantity, 0);
    };

    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* ... (Search Bar and Categories remain unchanged) ... */}
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
                        <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                            <XIcon size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Categories */}
            <div className="flex overflow-x-auto gap-2 p-2 bg-gray-800/50 border-b border-gray-700 hide-scrollbar shrink-0">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full whitespace-nowrap text-xs font-bold transition-colors border ${selectedCategory === cat ? 'bg-orange-600 border-orange-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-2 bg-gray-900/50">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {filteredProducts.map(product => {
                            const count = getProductBadgeCount(product.id);
                            return (
                                <div key={product.id} className="relative group">
                                    <button
                                        onClick={() => handleProductClick(product)}
                                        className="w-full relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-sm hover:border-orange-500 active:scale-95 transition-all text-left flex flex-col h-32 md:h-36"
                                    >
                                        <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
                                        <div className="relative h-full flex flex-col justify-end p-3">
                                            <span className="font-bold text-white text-sm leading-tight drop-shadow-md line-clamp-2">{product.name}</span>
                                            <span className="text-orange-400 font-extrabold text-xs mt-0.5">${product.basePrice_usd}</span>
                                        </div>
                                    </button>

                                    {/* Count Badge */}
                                    {count > 0 && (
                                        <div className="absolute top-1 right-1 bg-orange-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-orange-400 z-10">
                                            {count}
                                        </div>
                                    )}

                                    {/* NEW: QUICK DELETE 'X' BUTTON (Top Left) */}
                                    {count > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeAllByProduct(product.id);
                                            }}
                                            className="absolute top-1 left-1 bg-red-600 text-white p-1 rounded-lg shadow-xl border border-red-400 hover:bg-red-500 transition-colors z-20"
                                            title="Quitar todos del pedido"
                                        >
                                            <XIcon size={14} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar Cart */}
                <div className="w-96 bg-gray-800 border-l border-gray-700 flex-col hidden lg:flex shadow-2xl z-10">
                    <div className="p-4 border-b border-gray-700 bg-gray-800 shadow-sm flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <ShoppingBag size={18} className="text-orange-500" /> Detalle Pedido
                        </h3>
                        <button onClick={() => setPosCart([])} className="text-xs text-gray-500 hover:text-red-400 font-bold uppercase transition-colors">Limpiar Todo</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {posCart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                <ShoppingBag size={48} className="mb-2 stroke-1" />
                                <p className="text-xs">Selecciona productos</p>
                            </div>
                        ) : (
                            posCart.map((item, index) => {
                                const customizationSummary = Object.entries(item.selectedOptions)
                                    .map(([id, selected]) => {
                                        const opt = item.product.customizableOptions?.find(o => o.id === id);
                                        if (opt?.defaultIncluded && !selected) return `SIN ${opt.name.toUpperCase()}`;
                                        if (!opt?.defaultIncluded && selected) return `+${opt?.name.toUpperCase()}`;
                                        return null;
                                    }).filter(Boolean).join(', ');

                                return (
                                    <div key={index} className="bg-gray-700/50 p-2 rounded-xl border border-gray-600 flex flex-col gap-1 group hover:border-orange-500/30 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center font-bold text-white text-xs shrink-0 border border-gray-600">
                                                    {item.quantity}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-white text-sm truncate">{item.product.name}</p>
                                                    <p className="text-orange-400 text-xs font-mono">${(item.finalPrice * item.quantity).toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button onClick={() => updateQuantity(index, -1)} className="p-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg"><Minus size={12} /></button>
                                                <button onClick={() => updateQuantity(index, 1)} className="p-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg"><Plus size={12} /></button>
                                                <button onClick={() => removeFromPosCart(index)} className="p-1.5 bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white rounded-lg ml-1"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                        {customizationSummary && (
                                            <div className="px-1 text-[10px] text-orange-400 font-black tracking-widest uppercase truncate">
                                                ✨ {customizationSummary}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="p-4 bg-gray-900 border-t border-gray-700 space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">SUBTOTAL</span>
                                <p className="text-gray-500 font-mono text-sm">${cartTotalUsd.toFixed(2)} USD</p>
                            </div>
                            <div className="text-right">
                                <span className="text-orange-500 text-[10px] font-black uppercase tracking-widest">TOTAL A COBRAR</span>
                                <p className="text-3xl font-black text-white leading-none">Bs. {cartTotalBs.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsCheckingOut(true)}
                            disabled={posCart.length === 0}
                            className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-2 transition-all ${posCart.length === 0
                                ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
                                : 'bg-green-600 text-white hover:bg-green-500 hover:scale-[1.02] shadow-green-900/40'
                                }`}
                        >
                            <Banknote size={20} />
                            <span>COBRAR PEDIDO</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Bar */}
            <div className="lg:hidden bg-gray-800 border-t border-gray-700 p-4 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-gray-400 text-[10px] font-black tracking-widest uppercase">Por Cobrar</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-white text-3xl font-black">Bs. {cartTotalBs.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCheckingOut(true)}
                        disabled={posCart.length === 0}
                        className={`px-8 py-4 rounded-2xl font-black text-lg shadow-2xl flex items-center gap-2 ${posCart.length === 0
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-500 active:scale-95'
                            }`}
                    >
                        <span>COBRAR</span>
                    </button>
                </div>
            </div>

            {/* Customizer Modal */}
            {customizingProduct && (
                <POSProductCustomizer
                    product={customizingProduct}
                    onConfirm={(options, price) => {
                        addToPosCart(customizingProduct, options, price);
                        setCustomizingProduct(null);
                    }}
                    onCancel={() => setCustomizingProduct(null)}
                />
            )}

            {/* Checkout Modal Overlay */}
            {isCheckingOut && (
                <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-end lg:items-center justify-center">
                    <div className="bg-gray-900 w-full lg:max-w-xl lg:rounded-3xl border-t lg:border border-gray-700 shadow-[0_0_100px_rgba(34,197,94,0.1)] flex flex-col max-h-[95vh] animate-in slide-in-from-bottom duration-300">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/20">
                            <div>
                                <h3 className="text-2xl font-black text-white italic tracking-tighter">PAGO Y RECIBO</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Cajero: {cashierName}</p>
                            </div>
                            <button
                                onClick={() => !isProcessing && setIsCheckingOut(false)}
                                disabled={isProcessing}
                                className="p-2 bg-gray-800 hover:bg-red-600 text-white rounded-full transition-colors disabled:opacity-50"
                            >
                                <XIcon size={24} />
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className="overflow-y-auto p-6 flex-1 space-y-4">
                            {posCart.map((item, index) => (
                                <div key={index} className="flex flex-col bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center font-black text-white text-lg">
                                                {item.quantity}x
                                            </div>
                                            <div>
                                                <p className="font-black text-white text-lg leading-tight uppercase italic">{item.product.name}</p>
                                                <p className="text-orange-400 font-bold font-mono">${(item.finalPrice * item.quantity).toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => !isProcessing && updateQuantity(index, -1)} disabled={isProcessing} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white disabled:opacity-50"><Minus size={18} /></button>
                                            <button onClick={() => !isProcessing && updateQuantity(index, 1)} disabled={isProcessing} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white disabled:opacity-50"><Plus size={18} /></button>
                                            <button
                                                onClick={() => !isProcessing && removeFromPosCart(index)}
                                                disabled={isProcessing}
                                                className="p-2 bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white rounded-lg ml-2 transition-colors disabled:opacity-50"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Payment & Customer */}
                        <div className="p-6 bg-gray-800 border-t border-gray-700 space-y-6">
                            {/* LOYALTY INPUT */}
                            <div className="bg-gray-900 p-4 rounded-2xl border border-gray-700 shadow-inner">
                                <label className="block text-xs uppercase font-black text-orange-500 tracking-widest mb-2">
                                    ✨ SUMAR PUNTOS Y ENVIAR WHATSAPP
                                </label>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                        <input
                                            type="tel"
                                            placeholder="Ej: 0412... (Automático +58)"
                                            value={customerPhone}
                                            onChange={(e) => {
                                                // Allow only numbers and plus sign
                                                const val = e.target.value.replace(/[^0-9+]/g, '');
                                                setCustomerPhone(val);
                                            }}
                                            className="w-full bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-xl pl-12 pr-4 py-3 text-white text-xl font-black font-mono outline-none transition-all placeholder:text-gray-600"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2 font-bold italic">
                                    {customerPhone && customerPhone.startsWith('0')
                                        ? `Se guardará como: +58${customerPhone.substring(1)}`
                                        : 'Se enviará el recibo automáticamente al finalizar.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {(['cash', 'pago_movil', 'zelle'] as const).map(method => (
                                    <button
                                        key={method}
                                        onClick={() => !isProcessing && setPaymentMethod(method)}
                                        disabled={isProcessing}
                                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === method ? 'bg-orange-600 border-orange-400 text-white shadow-lg scale-105' : 'bg-gray-900 border-gray-700 text-gray-500 hover:text-white hover:border-gray-500'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {method === 'cash' && <Banknote size={28} />}
                                        {method === 'pago_movil' && <Smartphone size={28} />}
                                        {method === 'zelle' && <CreditCard size={28} />}
                                        <span className="text-[10px] font-black uppercase tracking-widest">{method.replace('_', ' ')}</span>
                                    </button>
                                ))}
                            </div>

                            {/* DELIVERY TOGGLE */}
                            <div className="bg-gray-900 p-4 rounded-2xl border border-gray-700 shadow-inner">
                                <label className="block text-xs uppercase font-black text-gray-500 tracking-widest mb-3">
                                    📍 Método de Entrega
                                </label>
                                <div className="flex gap-3 mb-3">
                                    <button
                                        onClick={() => setDeliveryMethod('pickup')}
                                        className={`flex-1 py-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${deliveryMethod === 'pickup' ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                    >
                                        🏠 Retiro
                                    </button>
                                    <button
                                        onClick={() => setDeliveryMethod('delivery')}
                                        className={`flex-1 py-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${deliveryMethod === 'delivery' ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                    >
                                        🛵 Delivery
                                    </button>
                                </div>

                                {deliveryMethod === 'delivery' && (
                                    <div className="animate-in slide-in-from-top duration-200">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Costo Delivery ($)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={deliveryFee}
                                            onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                                            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500 font-mono"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-gray-400 font-bold italic tracking-tighter text-lg underline decoration-orange-500/50">Total Tasa: {tasaBs}</span>
                                    <div className="text-right">
                                        <span className="text-white font-black text-2xl font-mono">${(cartTotalUsd + (deliveryMethod === 'delivery' ? deliveryFee : 0)).toFixed(2)}</span>
                                        {deliveryMethod === 'delivery' && deliveryFee > 0 && (
                                            <p className="text-xs text-purple-400 font-bold">+${deliveryFee} Delivery</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    disabled={isProcessing}
                                    className={`w-full py-5 font-black text-2xl rounded-2xl shadow-2xl flex items-center justify-center gap-3 transition-all ${isProcessing
                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white hover:scale-[1.02] shadow-green-900/30'
                                        }`}
                                >
                                    {isProcessing ? (
                                        <span>⏳ PROCESANDO...</span>
                                    ) : (
                                        <>
                                            <span>CONCLUIR VENTA</span>
                                            <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">Bs. {((cartTotalUsd + (deliveryMethod === 'delivery' ? deliveryFee : 0)) * tasaBs).toLocaleString()}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
