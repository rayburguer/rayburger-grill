import React from 'react';
import { ShoppingCart, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomNavigationProps {
    cartItemCount: number;
    totalUsd: number;
    onOpenCart: () => void;
    onOpenCheckout: () => void;
    isVisible: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
    cartItemCount,
    totalUsd,
    onOpenCart,
    onOpenCheckout,
    isVisible
}) => {
    if (!isVisible || cartItemCount === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
                style={{
                    background: 'linear-gradient(to top, #000000 60%, transparent)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)'
                }}
            >
                <div className="px-4 py-4 flex items-center gap-3 max-w-screen-lg mx-auto">
                    {/* Cart Summary Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onOpenCart}
                        className="flex-1 flex items-center gap-3 bg-gray-800/90 rounded-2xl px-4 py-3 border border-gray-700/50 active-feedback"
                    >
                        <div className="relative">
                            <ShoppingCart className="text-orange-500" size={24} />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                                    {cartItemCount}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-xs text-gray-400 font-medium">Tu pedido</p>
                            <p className="text-orange-500 font-black text-lg leading-none">
                                ${totalUsd.toFixed(2)}
                            </p>
                        </div>
                    </motion.button>

                    {/* Checkout CTA */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onOpenCheckout}
                        className="btn-touch btn-primary flex items-center justify-center gap-2 shadow-2xl"
                        style={{
                            minWidth: '140px',
                            background: 'linear-gradient(135deg, #FF6B35, #FF4500)',
                            boxShadow: '0 8px 32px rgba(255, 107, 53, 0.5)'
                        }}
                    >
                        <CreditCard size={20} />
                        <span className="font-black text-base">PAGAR</span>
                    </motion.button>
                </div>

                {/* Safe Area Spacer for iOS */}
                <div className="h-safe-bottom bg-black"></div>
            </motion.div>
        </AnimatePresence>
    );
};
