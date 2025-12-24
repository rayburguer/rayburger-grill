import React from 'react';
import { Plus, Minus, X } from 'lucide-react';
import Modal from '../ui/Modal';
import { CartItem, Product } from '../../types';
import { IMAGE_PLACEHOLDER } from '../../config/constants';

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    totalUsd: number;
    onRemoveItem: (cartItemId: string) => void;
    onUpdateItemQuantity: (cartItemId: string, quantity: number) => void;
    onProceedToCheckout: () => void;
    allProducts: Product[]; // NEW: To find upsell items
    onQuickAdd: (product: Product) => void; // NEW: For quick add from upsell
}

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, cart, totalUsd, onRemoveItem, onUpdateItemQuantity, onProceedToCheckout, allProducts, onQuickAdd }) => {
    // Get upsell items (Extras/Drinks/Sauces that are NOT in the cart yet)
    const upsellItems = allProducts
        .filter(p => ['Extras', 'Bebidas', 'Salsas'].includes(p.category) && !cart.some(item => item.id === p.id))
        .sort(() => 0.5 - Math.random()) // Shuffle for variety
        .slice(0, 3); // Show max 3

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tu Carrito de Compras">
            {cart.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-300 text-xl mb-6">Tu carrito está vacío 😢</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                onClose();
                                document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="w-full py-3 px-6 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2"
                        >
                            🍔 Explorar Menú
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                        >
                            🔥 Ver Lo Más Vendido
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <ul className="space-y-4 mb-6">
                        {cart.map((item) => (
                            <li key={item.cartItemId} className="flex flex-col sm:flex-row items-center justify-between bg-gray-700 p-3 rounded-md border border-gray-600">
                                <div className="flex items-center space-x-3 w-full sm:w-auto mb-2 sm:mb-0">
                                    <img src={item.image || IMAGE_PLACEHOLDER} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
                                    <div>
                                        <p className="font-semibold text-white">{item.name}</p>
                                        {Object.keys(item.selectedOptions).length > 0 && (
                                            <ul className="text-xs text-gray-400 list-disc list-inside mt-1">
                                                {item.customizableOptions?.map(option => {
                                                    const isSelected = item.selectedOptions[option.id];
                                                    if (option.defaultIncluded && !isSelected) {
                                                        return <li key={option.id}>Sin {option.name.replace('Sin ', '')}</li>;
                                                    }
                                                    if (!option.defaultIncluded && isSelected) {
                                                        return <li key={option.id}>+{option.name} (${option.price_usd.toFixed(2)})</li>;
                                                    }
                                                    return null;
                                                }).filter(Boolean)}
                                            </ul>
                                        )}
                                        <p className="text-sm text-gray-300">Precio unitario: ${item.finalPrice_usd.toFixed(2)} USD</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end sm:justify-between w-full sm:w-auto space-x-3">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => onUpdateItemQuantity(item.cartItemId, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                            className="p-1 rounded-full bg-gray-600 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            aria-label={`Reducir cantidad de ${item.name}`}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="text-lg font-semibold text-white w-6 text-center" aria-live="polite">{item.quantity}</span>
                                        <button
                                            onClick={() => onUpdateItemQuantity(item.cartItemId, item.quantity + 1)}
                                            className="p-1 rounded-full bg-gray-600 text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            aria-label={`Aumentar cantidad de ${item.name}`}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <span className="font-bold text-orange-400 text-lg sm:text-xl ml-4">$ {(item.finalPrice_usd * item.quantity).toFixed(2)} USD</span>
                                    <button
                                        onClick={() => onRemoveItem(item.cartItemId)}
                                        className="text-red-500 hover:text-red-700 transition-colors duration-300 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
                                        aria-label={`Eliminar ${item.name} del carrito`}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-between items-center text-xl font-bold border-t border-gray-700 pt-4 mt-4">
                        <span className="text-white">Total:</span>
                        <span className="text-orange-500">$ {totalUsd.toFixed(2)} USD</span>
                    </div>

                    {/* UPSELLING SECTION - ACTIVATED */}
                    {upsellItems.length > 0 && (
                        <div className="mt-8 border-t border-gray-700 pt-6">
                            <h3 className="text-sm uppercase font-bold tracking-widest text-orange-400 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                                ¿Deseas completar tu pedido?
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {upsellItems.map(item => (
                                    <div key={item.id} className="flex items-center justify-between bg-gray-800/50 p-3 rounded-xl border border-gray-700/50 hover:border-orange-500/30 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <img src={item.image || IMAGE_PLACEHOLDER} alt={item.name} className="w-10 h-10 object-cover rounded-lg group-hover:scale-110 transition-transform" />
                                            <div>
                                                <p className="text-sm font-bold text-white">{item.name}</p>
                                                <p className="text-xs text-orange-400/80 font-medium">${item.basePrice_usd.toFixed(2)} USD</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                onQuickAdd(item);
                                                // CONFETTI EFFECT! 🎉
                                                import('../../utils/confetti').then(({ triggerConfetti }) => {
                                                    triggerConfetti();
                                                });
                                            }}
                                            className="px-4 py-1.5 bg-gray-700 hover:bg-orange-600 text-white text-xs font-bold rounded-full transition-all hover:shadow-[0_0_15px_rgba(234,88,12,0.3)] active:scale-95"
                                        >
                                            + Añadir
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onProceedToCheckout}
                        className="w-full mt-6 bg-orange-600 text-white py-3 rounded-full text-lg font-semibold hover:bg-orange-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        aria-label="Proceder al pago"
                    >
                        Proceder al Pago
                    </button>
                </>
            )}
        </Modal>
    );
};

export default CartModal;
