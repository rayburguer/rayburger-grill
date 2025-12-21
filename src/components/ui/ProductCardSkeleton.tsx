import React from 'react';

const ProductCardSkeleton: React.FC = () => {
    return (
        <div className="group relative bg-[#131926]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-visible mt-16 animate-pulse">
            {/* Image Placeholder */}
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-40 h-40 z-10">
                <div className="w-full h-full bg-gray-700 rounded-full"></div>
            </div>

            <div className="pt-28 pb-6 px-6 text-center">
                {/* Category */}
                <div className="mb-2 flex justify-center">
                    <div className="h-5 w-24 bg-gray-700 rounded-md"></div>
                </div>

                {/* Title */}
                <div className="h-7 bg-gray-700 rounded mb-2 w-3/4 mx-auto"></div>

                {/* Description */}
                <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-700 rounded w-5/6 mx-auto"></div>
                    <div className="h-4 bg-gray-700 rounded w-4/6 mx-auto"></div>
                </div>

                {/* Price and Button */}
                <div className="flex items-center justify-between mt-4 border-t border-gray-700/50 pt-4">
                    <div className="h-9 w-24 bg-gray-700 rounded"></div>
                    <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                </div>
            </div>
        </div>
    );
};

export default ProductCardSkeleton;
