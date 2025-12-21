import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { Product } from '../../types';

interface RankingSectionProps {
    products: Product[];
    onSelectProduct: (product: Product) => void;
}

export const RankingSection: React.FC<RankingSectionProps> = ({ products, onSelectProduct }) => {
    const topProducts = [...products]
        .filter(p => p.rating && p.ratingCount)
        .sort((a, b) => ((b.rating || 0) * (b.ratingCount || 0)) - ((a.rating || 0) * (a.ratingCount || 0)))
        .slice(0, 3);

    if (topProducts.length === 0) return null;

    return (
        <section className="w-full max-w-6xl mb-16 px-4">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                    <Trophy size={24} />
                </div>
                <h2 className="text-3xl font-anton text-white uppercase tracking-tight">Top Ranking <span className="text-orange-500">Ray Burger</span></h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topProducts.map((product, index) => (
                    <motion.div
                        key={product.id}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="relative bg-gray-800/40 backdrop-blur-md rounded-3xl border border-white/5 p-6 flex flex-col items-center text-center cursor-pointer group"
                        onClick={() => onSelectProduct(product)}
                    >
                        {/* Rank Badge */}
                        <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl z-20 rotate-[-10deg]
                            ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-gray-300 text-black' : 'bg-orange-700 text-white'}`}
                        >
                            #{index + 1}
                        </div>

                        <div className="relative w-32 h-32 mb-4">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-full border-4 border-gray-700 shadow-lg group-hover:border-orange-500 transition-colors"
                            />
                            {index === 0 && (
                                <div className="absolute -bottom-2 -right-2 bg-red-600 text-white p-2 rounded-full shadow-lg animate-bounce">
                                    <TrendingUp size={16} />
                                </div>
                            )}
                        </div>

                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-orange-500 transition-colors">{product.name}</h3>

                        <div className="flex items-center gap-1 mb-4">
                            <div className="flex text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={14} fill={i < Math.floor(product.rating || 0) ? "currentColor" : "none"} />
                                ))}
                            </div>
                            <span className="text-xs text-gray-400 font-bold">({product.ratingCount})</span>
                        </div>

                        <div className="mt-auto w-full py-2 bg-white/5 rounded-xl text-orange-400 font-black">
                            ${product.basePrice_usd.toFixed(2)}
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
