import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Heart, Trophy, Flame, Plus } from 'lucide-react';
import { VOTING_INGREDIENTS } from '../../data/votingOptions';
import { useCloudSync } from '../../hooks/useCloudSync';
import { safeLocalStorage } from '../../utils/debounce';
import { useAuth } from '../../hooks/useAuth';

export const IngredientVoting: React.FC = () => {
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
    const [hasVoted, setHasVoted] = useState(false);
    const { pushToCloud } = useCloudSync();
    const { currentUser } = useAuth();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        const voted = safeLocalStorage.getItem('rayburger_has_voted_v1');
        if (voted) setHasVoted(true);
    }, []);

    const toggleIngredient = (id: string) => {
        if (selectedIngredients.includes(id)) {
            setSelectedIngredients(prev => prev.filter(i => i !== id));
        } else {
            if (selectedIngredients.length < 5) {
                setSelectedIngredients(prev => [...prev, id]);
            }
        }
    };

    const submitVote = async () => {
        if (selectedIngredients.length === 0 || !name.trim()) return;

        setHasVoted(true);
        safeLocalStorage.setItem('rayburger_has_voted_v1', 'true');

        const vote = {
            id: Date.now().toString(),
            user_email: currentUser?.email || 'guest',
            burger_name: name,
            ingredients: selectedIngredients,
            description: description,
            timestamp: Date.now(),
            device_info: navigator.userAgent
        };

        await pushToCloud('rb_votes', [vote]);
    };

    if (hasVoted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl mx-auto p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-orange-500/30 text-center shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500 animate-gradient-x"></div>
                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-bounce" />
                <h2 className="text-4xl font-anton text-white mb-2 uppercase">¡Voto Recibido!</h2>
                <div className="bg-white/5 rounded-xl p-4 mb-6 inline-block">
                    <p className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-1">Tu creación</p>
                    <h3 className="text-2xl font-anton text-white uppercase">{name}</h3>
                </div>

                <div className="bg-orange-600/20 border border-orange-500/50 p-6 rounded-2xl max-w-md mx-auto relative overflow-hidden group">
                    <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-orange-300 uppercase font-bold text-sm tracking-widest mb-2">Tu Recompensa</p>
                    <p className="text-white text-3xl font-black tracking-wider mb-2">5% OFF</p>
                    <div className="bg-black/50 rounded-lg p-3 flex items-center justify-center gap-3 border border-orange-500/30 border-dashed">
                        <code className="text-2xl font-mono text-orange-400 font-bold">BURGERIDEAL5</code>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Usa este cupón en tu próxima compra.</p>
                </div>
                <p className="text-sm text-gray-500 mt-8 font-bold">La ganadora se anunciará el 1 de Mes.</p>
            </motion.div>
        );
    }

    return (
        <section className="w-full max-w-6xl mx-auto mb-16 px-4">
            <div className="text-center mb-10">
                <span className="bg-orange-600/20 text-orange-400 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-orange-500/30">
                    Tu Opinión Importa
                </span>
                <h2 className="text-3xl md:text-5xl font-anton text-white mt-4 mb-2 uppercase tracking-tight">
                    Crea la <span className="text-orange-500">Burger Ideal</span>
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base">
                    Diseña tu obra maestra. Si gana, la cocinamos para todos.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* 1. THE FLAVOR CARD (Canvas) */}
                <div className="w-full lg:w-1/2 lg:sticky lg:top-24 lg:z-10">
                    <div className="bg-gray-800 rounded-[2.5rem] p-6 border border-gray-700 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Flame size={150} className="text-orange-500" />
                        </div>

                        {/* Header Input */}
                        <div className="mb-6 relative z-10">
                            <label className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1 block">Nombre de tu Creación</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="EJ: LA DESTRUCTORA..."
                                className="w-full bg-transparent text-3xl md:text-4xl font-anton text-white placeholder-gray-600 outline-none border-b-2 border-gray-700 focus:border-orange-500 transition-colors py-2 uppercase"
                            />
                        </div>

                        {/* Ingredients Visual Stack */}
                        <div className="flex-1 bg-gray-900/50 rounded-3xl p-4 border border-gray-700/50 mb-6 relative hover:border-orange-500/30 transition-colors min-h-[200px] z-10">
                            {selectedIngredients.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 opacity-50 absolute inset-0 pointer-events-none">
                                    <div className="w-16 h-1 bg-gray-700 rounded-full mb-1"></div>
                                    <div className="w-16 h-1 bg-gray-700 rounded-full mb-1"></div>
                                    <p className="text-xs uppercase font-bold text-center">Toca los ingredientes<br />de la despensa para armarla 👇</p>
                                </div>
                            ) : (
                                <div className="space-y-2 z-10 relative">
                                    <AnimatePresence>
                                        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#e4a05d] h-8 rounded-lg w-full mx-auto shadow-md mb-1 border-b-4 border-[#d18e4a]"></motion.div> {/* Top Bun */}
                                        {selectedIngredients.map((id) => {
                                            const ing = VOTING_INGREDIENTS.find(i => i.id === id);
                                            return (
                                                <motion.div
                                                    key={id}
                                                    initial={{ x: -20, opacity: 0, scale: 0.9 }}
                                                    animate={{ x: 0, opacity: 1, scale: 1 }}
                                                    exit={{ x: 20, opacity: 0, scale: 0.9 }}
                                                    className="flex items-center gap-3 bg-gray-700/80 p-2 rounded-lg border border-gray-600 shadow-sm backdrop-blur-sm"
                                                >
                                                    <span className="text-2xl">{ing?.emoji}</span>
                                                    <span className="font-bold text-white text-sm">{ing?.name}</span>
                                                    <button onClick={() => toggleIngredient(id)} className="ml-auto text-gray-400 hover:text-red-500"><Plus size={16} className="rotate-45" /></button>
                                                </motion.div>
                                            );
                                        })}
                                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#e4a05d] h-8 rounded-lg w-full mx-auto shadow-md mt-1 border-t-4 border-[#d18e4a]"></motion.div> {/* Bottom Bun */}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="mb-6 z-10">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">¿Por qué es deliciosa?</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe por qué esta combinación es legendaria..."
                                className="w-full bg-gray-900/50 border-none rounded-xl p-3 text-sm text-gray-300 focus:ring-1 focus:ring-orange-500 outline-none resize-none h-20"
                            />
                        </div>

                        {/* Submit Action */}
                        <button
                            onClick={submitVote}
                            disabled={selectedIngredients.length === 0 || !name.trim()}
                            className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-anton text-xl uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-orange-500/20 flex items-center justify-center gap-2 group"
                        >
                            <span>¡Lanzar Candidata!</span> <Flame className="animate-pulse group-hover:scale-125 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* 2. THE PANTRY (Ingredients Grid) */}
                <div className="w-full lg:w-1/2">
                    <div className="bg-gray-900/30 p-6 rounded-[2.5rem] border border-gray-800">
                        <h3 className="text-xl font-anton text-white uppercase mb-4 flex items-center gap-2 px-2">
                            La Despensa <span className="text-xs font-sans text-gray-500 font-normal normal-case ml-auto">Elige máx 5</span>
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {VOTING_INGREDIENTS.map((ing) => {
                                const isSelected = selectedIngredients.includes(ing.id);
                                return (
                                    <button
                                        key={ing.id}
                                        onClick={() => toggleIngredient(ing.id)}
                                        disabled={selectedIngredients.length >= 5 && !isSelected}
                                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all relative group
                                            ${isSelected
                                                ? 'bg-orange-600/20 border-orange-500 shadow-[inset_0_0_10px_rgba(234,88,12,0.2)]'
                                                : 'bg-gray-800 border-gray-700 hover:border-gray-500 hover:bg-gray-750 hover:-translate-y-1'
                                            }
                                            ${selectedIngredients.length >= 5 && !isSelected ? 'opacity-30 grayscale cursor-not-allowed' : ''}
                                        `}
                                    >
                                        <span className="text-3xl group-hover:scale-110 transition-transform duration-300 drop-shadow-md">{ing.emoji}</span>
                                        <span className={`text-xs font-bold text-center leading-tight ${isSelected ? 'text-orange-300' : 'text-gray-400'}`}>
                                            {ing.name}
                                        </span>
                                        {isSelected && <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_5px_rgba(234,88,12,1)]"></div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};
