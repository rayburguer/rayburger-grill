import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { RewardMilestone } from '../../data/rewards';

interface RewardUnlockModalProps {
    reward: RewardMilestone | null;
    onClose: () => void;
}

const RewardUnlockModal: React.FC<RewardUnlockModalProps> = ({ reward, onClose }) => {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (reward) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [reward]);

    if (!reward) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Confetti */}
                {showConfetti && (
                    <Confetti
                        width={window.innerWidth}
                        height={window.innerHeight}
                        recycle={false}
                        numberOfPieces={500}
                        gravity={0.3}
                    />
                )}

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="relative bg-gradient-to-br from-orange-900/90 to-yellow-900/90 backdrop-blur-md p-8 rounded-3xl border-4 border-yellow-500 shadow-2xl max-w-md w-full text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-8xl mb-4"
                    >
                        {reward.emoji}
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-4xl font-display font-black text-yellow-300 mb-2"
                    >
                        ¡DESBLOQUEASTE!
                    </motion.h2>

                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-2xl font-bold text-white mb-4"
                    >
                        {reward.name}
                    </motion.h3>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-gray-200 mb-6"
                    >
                        {reward.description}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 }}
                        className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-6"
                    >
                        <p className="text-sm text-yellow-200 mb-1">Valor del Premio</p>
                        <p className="text-3xl font-bold text-white">${reward.value}</p>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-xl transition-colors"
                    >
                        ¡Genial! 🎉
                    </motion.button>

                    <p className="text-xs text-gray-300 mt-4">
                        Reclama tu premio en tu próxima visita a RayBurger
                    </p>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RewardUnlockModal;
