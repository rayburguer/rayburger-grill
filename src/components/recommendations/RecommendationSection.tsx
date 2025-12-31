import React, { useState, useCallback, useEffect } from 'react';
import { Flame, Shuffle } from 'lucide-react';
import { Product } from '../../types';
import { IMAGE_PLACEHOLDER } from '../../config/constants';
import { motion, AnimatePresence } from 'framer-motion';

interface RecommendationSectionProps {
    currentUser: any;
    userOrders: any[];
    onShowToast: (message: string) => void;
    allProducts: Product[];
    onSelectProduct?: (product: Product) => void;
    favoriteProductNames?: string[];
}

// Helper function to shuffle array randomly
const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Mood configuration with category filters
const MOOD_CONFIG: Record<string, { categories: string[]; description: string }> = {
    beast: {
        categories: ['Combos', 'Hamburguesas'],
        description: '¡Aquí tienes opciones contundentes para saciar esa bestia interior!'
    },
    light: {
        categories: ['Perros', 'Extras', 'Salsas'],
        description: 'Opciones ligeras pero deliciosas para cuando quieres algo más simple.'
    },
    explorer: {
        categories: ['Hamburguesas', 'Salsas'],
        description: '¡Explora nuevos sabores con estas opciones premium!'
    },
    party: {
        categories: ['Combos'],
        description: '¡Perfectas opciones para compartir con familia y amigos!'
    }
};

const RecommendationSection: React.FC<RecommendationSectionProps> = ({ onShowToast, allProducts, onSelectProduct, favoriteProductNames }) => {
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);

    const moods = [
        ...(favoriteProductNames && favoriteProductNames.length > 0 ? [{ id: 'familiar', label: 'Tus Clásicos', icon: '⭐' }] : []),
        { id: 'beast', label: 'Hambre Nivel Bestia', icon: '🦁' },
        { id: 'light', label: 'Algo Ligero', icon: '🥗' },
        { id: 'explorer', label: 'Explorar Sabores', icon: '🚀' },
        { id: 'party', label: 'Para Compartir', icon: '👫' },
    ];

    // Get random products based on mood
    const getRandomRecommendations = useCallback((mood: string) => {
        if (mood === 'familiar' && favoriteProductNames) {
            return allProducts.filter(p => favoriteProductNames.includes(p.name) && p.isAvailable !== false).slice(0, 3);
        }
        const config = MOOD_CONFIG[mood];
        if (!config) return [];

        // Filter available products by mood categories
        const availableProducts = allProducts.filter(
            p => config.categories.includes(p.category) && p.isAvailable !== false
        );

        // Shuffle and take 3 random products
        return shuffleArray(availableProducts).slice(0, 3);
    }, [allProducts, favoriteProductNames]);

    // Handle mood selection with random recommendations
    const handleMoodSelect = useCallback((mood: string) => {
        setIsAnimating(true);
        setSelectedMood(mood);

        // Small delay for animation effect
        setTimeout(() => {
            const randomProducts = getRandomRecommendations(mood);
            setRecommendations(randomProducts);
            setIsAnimating(false);

            const config = MOOD_CONFIG[mood];
            if (randomProducts.length > 0) {
                onShowToast(config?.description || '¡Aquí tienes tus sugerencias!');
            } else {
                onShowToast('¡Ups! No hay productos disponibles para este mood ahora.');
            }
        }, 400);
    }, [getRandomRecommendations, onShowToast]);

    // Shuffle recommendations with current mood
    const handleShuffle = useCallback(() => {
        if (selectedMood) {
            handleMoodSelect(selectedMood);
        }
    }, [selectedMood, handleMoodSelect]);

    // Initial random recommendations on mount
    useEffect(() => {
        if (allProducts.length > 0 && recommendations.length === 0) {
            const availableProducts = allProducts.filter(p => p.isAvailable !== false);
            setRecommendations(shuffleArray(availableProducts).slice(0, 3));
        }
    }, [allProducts, recommendations.length]);

    return (
        <section className="w-full max-w-5xl mb-12 p-8 bg-gray-900/50 backdrop-blur-xl rounded-[2.5rem] border border-orange-500/20 shadow-2xl relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-600/10 rounded-full blur-[80px]"></div>

            <div className="relative z-10 text-center">
                <h2 className="text-4xl font-anton text-orange-500 mb-2 uppercase tracking-tight flex items-center justify-center gap-3">
                    <Flame className="w-10 h-10 animate-pulse text-orange-600" /> ¿Qué te apetece hoy?
                </h2>
                <p className="text-gray-400 mb-8 font-medium">Chef Ray te recomienda lo mejor según tu mood 🔥</p>

                {/* Mood Selector */}
                <div className="flex flex-wrap justify-center gap-3 mb-10">
                    {moods.map((mood) => (
                        <button
                            key={mood.id}
                            onClick={() => handleMoodSelect(mood.id)}
                            disabled={isAnimating}
                            className={`px-6 py-3 rounded-2xl flex items-center gap-2 transition-all duration-300 font-bold border-2
                                ${selectedMood === mood.id
                                    ? 'bg-orange-600 border-orange-400 text-white shadow-[0_0_20px_rgba(234,88,12,0.4)] scale-105'
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                                } active:scale-95 disabled:opacity-50`}
                        >
                            <span className="text-2xl">{mood.icon}</span>
                            {mood.label}
                        </button>
                    ))}
                </div>

                {/* Shuffle Button */}
                {selectedMood && recommendations.length > 0 && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleShuffle}
                        disabled={isAnimating}
                        className="mb-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-orange-400 rounded-xl flex items-center gap-2 mx-auto transition-all border border-orange-500/30 hover:border-orange-500/50 disabled:opacity-50"
                    >
                        <Shuffle className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} />
                        <span className="text-sm font-bold uppercase">Otras opciones</span>
                    </motion.button>
                )}

                {isAnimating ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                        >
                            <Shuffle className="w-12 h-12 text-orange-500 mb-4" />
                        </motion.div>
                        <p className="font-anton text-xl text-white tracking-widest uppercase animate-pulse">Mezclando sabores...</p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {recommendations.length > 0 ? (
                            <motion.div
                                key={recommendations.map(r => r.id).join('-')}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                            >
                                {recommendations.map((product, index) => (
                                    <motion.div
                                        key={`${product.id}-${index}`}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ y: -5 }}
                                        className="group bg-gray-800/80 border border-white/5 p-4 rounded-3xl hover:border-orange-500/30 transition-all shadow-xl"
                                    >
                                        <div className="relative h-40 w-full mb-4 overflow-hidden rounded-2xl">
                                            <img
                                                src={product.image || IMAGE_PLACEHOLDER}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = IMAGE_PLACEHOLDER;
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <p className="font-anton text-white text-lg tracking-tight uppercase leading-tight">{product.name}</p>
                                                <p className="text-orange-400 font-bold text-sm mt-1">$ {product.basePrice_usd.toFixed(2)} USD</p>
                                            </div>
                                        </div>
                                        <p className="text-gray-400 text-xs mb-3 line-clamp-2">{product.description}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded-full">{product.category}</span>
                                            <button
                                                onClick={() => onSelectProduct ? onSelectProduct(product) : onShowToast(`¡Busca "${product.name}" en el menú! 🍔`)}
                                                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold uppercase transition-colors"
                                            >
                                                Ver
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-gray-500 py-10 font-bold"
                            >
                                ¡Selecciona un mood para ver las sugerencias del Chef Ray! 🍔
                            </motion.p>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </section>
    );
};

export default RecommendationSection;
