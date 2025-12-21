import React from 'react';
import { Plus, Star } from 'lucide-react';
import { Product } from '../../types';
import { IMAGE_PLACEHOLDER } from '../../config/constants';
import { motion } from 'framer-motion';

interface ProductCardProps {
    product: Product;
    onOpenProductDetail: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenProductDetail }) => {
    const isAvailable = product.isAvailable !== false && (product.stockQuantity === undefined || product.stockQuantity > 0);
    const isLowStock = product.stockQuantity !== undefined && product.stockQuantity > 0 && product.stockQuantity < 10;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -10, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`group relative bg-[#131926]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-visible mt-16 ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
            onClick={() => isAvailable && onOpenProductDetail(product)}
        >
            {/* SOLD OUT BADGE */}
            {!isAvailable && (
                <div className="absolute -top-4 right-4 z-20 bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg border-2 border-red-400 animate-pulse uppercase">
                    Agotado
                </div>
            )}

            {/* LOW STOCK BADGE */}
            {isAvailable && isLowStock && (
                <div className="absolute -top-4 right-4 z-20 bg-orange-600 text-white px-4 py-2 rounded-full font-bold text-[10px] shadow-lg border-2 border-orange-400 animate-bounce uppercase">
                    ¡Últimas {product.stockQuantity}!
                </div>
            )}

            {/* TOP SELLER BADGE */}
            {isAvailable && product.rating && product.rating >= 4.9 && (
                <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-3 py-1 rounded-full font-black text-[10px] shadow-lg border border-yellow-400/50 animate-pulse">
                    ⭐ TOP VENTAS
                </div>
            )}

            {/* Image (Breaking the frame) */}
            <div className={`absolute -top-16 left-1/2 transform -translate-x-1/2 w-40 h-40 z-10 transition-all duration-500 ${isAvailable ? 'group-hover:scale-[1.15] group-hover:rotate-2' : 'grayscale'} drop-shadow-2xl`}>
                <img
                    src={product.image || IMAGE_PLACEHOLDER}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover rounded-full border-4 border-gray-800 shadow-lg"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = IMAGE_PLACEHOLDER;
                    }}
                />
            </div>

            <div className="pt-28 pb-6 px-6 text-center">
                <div className="mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-1 rounded-md">
                        {product.category}
                    </span>
                </div>
                <h3 className={`text-2xl font-anton mb-1 leading-tight transition-colors uppercase tracking-tight ${isAvailable ? 'text-white group-hover:text-orange-400' : 'text-gray-500'}`}>
                    {product.name}
                </h3>

                {product.rating && (
                    <div className="flex items-center justify-center gap-1 mb-2">
                        <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={12} fill={i < Math.floor(product.rating || 0) ? "currentColor" : "none"} className={i < Math.floor(product.rating || 0) ? "" : "text-gray-600"} />
                            ))}
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold">({product.ratingCount})</span>
                    </div>
                )}

                {/* Description */}
                {product.description && (
                    <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-3">
                        {product.description}
                    </p>
                )}

                <div className="flex items-center justify-between mt-4 border-t border-gray-700/50 pt-4">
                    <span
                        className={`text-3xl font-black font-sans transition-all ${isAvailable
                            ? 'text-white group-hover:text-orange-400 group-hover:drop-shadow-[0_0_20px_rgba(234,88,12,0.6)]'
                            : 'text-gray-600'
                            }`}
                        style={{
                            textShadow: isAvailable ? '0 0 10px rgba(234, 88, 12, 0.3)' : 'none'
                        }}
                    >
                        ${product.basePrice_usd.toFixed(2)}
                    </span>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        disabled={!isAvailable}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${isAvailable
                            ? 'bg-orange-600 shadow-orange-600/40 hover:bg-orange-500 hover:shadow-orange-500/60'
                            : 'bg-gray-700 shadow-none cursor-not-allowed'
                            }`}
                        aria-label={`Añadir ${product.name} al carrito`}
                    >
                        <Plus size={20} />
                    </motion.button>
                </div>
            </div>

            {/* Glow Effect */}
            {isAvailable && (
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-orange-500/0 via-white/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            )}
        </motion.div>
    );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(ProductCard);
