import React from 'react';
import { motion } from 'framer-motion';
import { REWARD_MILESTONES } from '../../data/rewards';

interface RewardsProgressBarProps {
    currentPoints: number;
}

const RewardsProgressBar: React.FC<RewardsProgressBarProps> = ({ currentPoints }) => {
    // Find next milestone
    const nextMilestone = REWARD_MILESTONES.find((m: any) => m.points > currentPoints);
    const previousMilestone = [...REWARD_MILESTONES].reverse().find((m: any) => m.points <= currentPoints);

    if (!nextMilestone) {
        // User has reached max level
        return (
            <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 p-6 rounded-2xl border border-yellow-500/30">
                <div className="text-center">
                    <h3 className="text-2xl font-display font-bold text-yellow-400 mb-2">
                        🏆 ¡NIVEL MÁXIMO ALCANZADO!
                    </h3>
                    <p className="text-gray-300">
                        Has desbloqueado todos los premios. ¡Eres un VIP de RayBurger!
                    </p>
                </div>
            </div>
        );
    }

    const pointsNeeded = nextMilestone.points - currentPoints;
    const progressStart = previousMilestone?.points || 0;
    const progressRange = nextMilestone.points - progressStart;
    const progressValue = currentPoints - progressStart;
    const progressPercent = (progressValue / progressRange) * 100;

    return (
        <div className="bg-gray-800/40 backdrop-blur-md p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-lg font-display font-bold text-white">
                        Próximo Premio
                    </h3>
                    <p className="text-sm text-gray-400">
                        {nextMilestone.emoji} {nextMilestone.name}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-orange-400">{currentPoints}</p>
                    <p className="text-xs text-gray-500">puntos</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden mb-3">
                <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-600 to-yellow-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white drop-shadow-lg">
                        {Math.round(progressPercent)}%
                    </span>
                </div>
            </div>

            <p className="text-center text-sm text-gray-400">
                ¡Solo faltan <span className="font-bold text-orange-400">{pointsNeeded} puntos</span> para desbloquear!
            </p>

            {/* All Milestones */}
            <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {REWARD_MILESTONES.map((milestone) => {
                        const isUnlocked = currentPoints >= milestone.points;
                        return (
                            <div
                                key={milestone.points}
                                className={`text-center p-2 rounded-lg transition-all ${isUnlocked
                                    ? 'bg-green-900/30 border border-green-500/50'
                                    : 'bg-gray-700/30 border border-gray-600/50'
                                    }`}
                            >
                                <div className="text-2xl mb-1">{milestone.emoji}</div>
                                <div className="text-xs font-bold text-white">{milestone.points} pts</div>
                                {isUnlocked && (
                                    <div className="text-xs text-green-400 mt-1">✓ Desbloqueado</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default RewardsProgressBar;
