import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingCartProps {
    count: number;
    totalUsd: number;
    onClick: () => void;
}

const FloatingCart: React.FC<FloatingCartProps> = ({ count, totalUsd, onClick }) => {
    return (
        <AnimatePresence>
            {count > 0 && (
                <motion.div
                    initial={{ scale: 0, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0, y: 20 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="fixed bottom-6 right-6 z-50"
                >
                    <button
                        onClick={onClick}
                        className="relative group bg-orange-600 hover:bg-orange-500 text-white p-4 rounded-2xl shadow-[0_10px_30px_rgba(234,88,12,0.4)] border border-orange-400/30 flex items-center gap-3 transition-colors overflow-hidden"
                    >
                        {/* Background Animation */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>

                        <div className="relative">
                            <ShoppingCart className="w-6 h-6" />
                            <span className="absolute -top-3 -right-3 bg-white text-orange-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                                {count}
                            </span>
                        </div>

                        <div className="flex flex-col items-start pr-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 leading-none">Mi Pedido</span>
                            <span className="text-lg font-black leading-none">${totalUsd.toFixed(2)}</span>
                        </div>

                        {/* Ripple Effect Glow */}
                        <div className="absolute -inset-1 bg-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    </button>

                    <style>{`
                        @keyframes shimmer {
                            100% { transform: translateX(100%); }
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FloatingCart;
