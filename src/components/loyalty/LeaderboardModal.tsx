import React from 'react';
import Modal from '../ui/Modal';
import { User } from '../../types';
import { Trophy, Medal, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, users }) => {
    // Sort users by points DESC and take top 10
    const topUsers = [...users]
        .sort((a, b) => b.points - a.points)
        .slice(0, 10);

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500/20" />;
            case 1: return <Medal className="w-6 h-6 text-gray-400 fill-gray-400/20" />;
            case 2: return <Medal className="w-6 h-6 text-orange-600 fill-orange-600/20" />;
            default: return <span className="font-anton text-gray-500 w-6 text-center">{index + 1}</span>;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="🏆 La Carrera: Top 10 Clientes">
            <div className="mb-6 bg-gradient-to-br from-orange-600/20 to-transparent p-4 rounded-2xl border border-orange-500/30 text-center">
                <p className="text-gray-300 text-sm mb-1">El ranking oficial de la comunidad</p>
                <h3 className="text-2xl font-anton text-white uppercase tracking-wider">¡El Top 3 gana premios cada semana!</h3>
            </div>

            <div className="space-y-3 mb-6">
                {topUsers.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">¡Aún no hay corredores en la pista! Sé el primero en comprar.</p>
                ) : (
                    topUsers.map((user, index) => (
                        <motion.div
                            key={user.email}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${index === 0
                                ? 'bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                                : 'bg-gray-800/50 border-gray-700/50'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                    {getRankIcon(index)}
                                </div>
                                <div>
                                    <p className={`font-bold ${index === 0 ? 'text-yellow-500 text-lg' : 'text-white'}`}>
                                        {user.name.split(' ')[0]}
                                        {index === 0 && <span className="ml-2 text-[10px] uppercase tracking-tighter bg-yellow-500 text-black px-1 rounded">Rey del Grill</span>}
                                    </p>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest">{user.loyaltyTier}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-anton text-xl text-orange-500">{user.points}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Puntos</p>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="bg-gray-800/80 p-5 rounded-2xl border border-gray-700 mt-6 overflow-hidden relative">
                <Trophy className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 rotate-12" />
                <h4 className="text-orange-500 font-bold uppercase text-xs tracking-widest mb-3">Cómo subir de puesto:</h4>
                <ul className="text-sm text-gray-300 space-y-2 relative z-10">
                    <li className="flex items-start gap-2">
                        <span className="text-orange-500 font-bold">⚡</span>
                        Gana puntos en cada compra (3%, 5% o 8% según tu nivel).
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-orange-500 font-bold">⚡</span>
                        Refiere amigos y gana un 2% de SALDO en efectivo por sus compras.
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-orange-500 font-bold">⚡</span>
                        ¡Escala posiciones para ganar premios exclusivos cada semana!
                    </li>
                </ul>
            </div>
        </Modal>
    );
};

export default LeaderboardModal;
