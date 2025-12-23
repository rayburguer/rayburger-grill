import React from 'react';
import { X, TrendingUp, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenLeaderboard: () => void;
    onOpenRoulette: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, onOpenLeaderboard, onOpenRoulette }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Menu Panel */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="fixed left-0 top-0 bottom-0 w-80 bg-gray-900 border-r border-gray-800 z-[101] shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-800">
                            <h2 className="text-xl font-black text-white">Menú</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                                aria-label="Cerrar menú"
                            >
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <div className="p-4 space-y-2">
                            {/* LEADERBOARD HIDDEN FOR PHASE 1 LAUNCH
                            <button
                                onClick={() => {
                                    onOpenLeaderboard();
                                    onClose();
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-800/50 hover:bg-orange-600 transition-all group"
                            >
                                <TrendingUp className="w-6 h-6 text-orange-500 group-hover:text-white" />
                                <div className="text-left">
                                    <p className="font-bold text-white">La Carrera</p>
                                    <p className="text-sm text-gray-400 group-hover:text-gray-200">Ver ranking de puntos</p>
                                </div>
                            </button>
                            */}

                            <button
                                onClick={() => {
                                    onOpenRoulette();
                                    onClose();
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-800/50 hover:bg-orange-600 transition-all group"
                            >
                                <Gift className="w-6 h-6 text-orange-500 group-hover:text-white" />
                                <div className="text-left">
                                    <p className="font-bold text-white">Ruleta Semanal</p>
                                    <p className="text-sm text-gray-400 group-hover:text-gray-200">Gana premios increíbles</p>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobileMenu;
