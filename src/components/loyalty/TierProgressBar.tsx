import React from 'react';
import { motion } from 'framer-motion';
import { LOYALTY_TIERS } from '../../config/constants';
import { TrendingUp, Award, Crown } from 'lucide-react';

interface TierProgressBarProps {
    lifetimeSpending: number;
}

const TierProgressBar: React.FC<TierProgressBarProps> = ({ lifetimeSpending }) => {
    // Find next tier
    const currentTierIndex = LOYALTY_TIERS.findIndex((t, i) =>
        lifetimeSpending >= t.minSpend && (i === LOYALTY_TIERS.length - 1 || lifetimeSpending < LOYALTY_TIERS[i + 1].minSpend)
    );

    const currentTier = LOYALTY_TIERS[currentTierIndex];
    const nextTier = LOYALTY_TIERS[currentTierIndex + 1];

    if (!nextTier) {
        // User is Gold (Max)
        return (
            <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/20 p-6 rounded-2xl border border-yellow-500/30">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/20 rounded-full text-yellow-500">
                        <Crown size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic uppercase">¡Nivel Máximo: GOLD! 🏆</h3>
                        <p className="text-sm text-yellow-200/70">Disfrutas del 8% de recompensas en cada compra.</p>
                    </div>
                </div>
            </div>
        );
    }

    const progressStart = currentTier.minSpend;
    const progressRange = nextTier.minSpend - progressStart;
    const progressValue = lifetimeSpending - progressStart;
    const progressPercent = Math.max(0, Math.min((progressValue / progressRange) * 100, 100));
    const spendingNeeded = nextTier.minSpend - lifetimeSpending;

    return (
        <div className="bg-gray-800/40 backdrop-blur-md p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-600/20 rounded-lg text-orange-500">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Progreso de Nivel</h3>
                        <p className="text-xs text-gray-400">Próximo objetivo: <span className="font-bold text-white uppercase">{nextTier.name}</span></p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Faltan</p>
                    <p className="text-xl font-black text-white">${spendingNeeded.toFixed(0)}</p>
                </div>
            </div>

            {/* Progress Bar Container */}
            <div className="relative h-4 bg-gray-900 rounded-full overflow-hidden mb-6 border border-gray-700">
                <motion.div
                    className={`absolute top-0 left-0 h-full rounded-full ${nextTier.name === 'Silver' ? 'bg-gradient-to-r from-orange-600 to-gray-400' : 'bg-gradient-to-r from-gray-400 to-yellow-500'
                        }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
            </div>

            {/* Tier Milestones Info */}
            <div className="grid grid-cols-3 gap-2">
                {LOYALTY_TIERS.map((tier, idx) => {
                    const isReached = lifetimeSpending >= tier.minSpend;
                    const isCurrent = idx === currentTierIndex;

                    return (
                        <div key={tier.name} className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full mb-2 transition-all duration-1000 ${isReached ? 'bg-orange-500 scale-125 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-gray-700'
                                }`} />
                            <p className={`text-[9px] font-black uppercase tracking-tighter ${isCurrent ? 'text-white' : isReached ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                {tier.name}
                            </p>
                            <p className="text-[8px] text-gray-500">${tier.minSpend}</p>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                    <Award size={18} />
                </div>
                <p className="text-[10px] text-gray-300">
                    El nivel <span className="font-bold text-white">{nextTier.name}</span> te dará un <span className="text-green-400 font-bold">{nextTier.name === 'Silver' ? '5%' : '8%'} de devolución</span> en todas tus compras.
                </p>
            </div>
        </div>
    );
};

export default TierProgressBar;
