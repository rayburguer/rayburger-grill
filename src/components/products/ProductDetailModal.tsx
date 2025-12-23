import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus } from 'lucide-react';
import Modal from '../ui/Modal';
import { Product } from '../../types';
import { IMAGE_PLACEHOLDER } from '../../config/constants';

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onAddToCart: (product: Product, quantity: number, selectedOptions: { [optionId: string]: boolean }, finalPrice: number) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ isOpen, onClose, product, onAddToCart }) => {
    const [quantity, setQuantity] = useState<number>(1);
    const [selectedOptions, setSelectedOptions] = useState<{ [optionId: string]: boolean }>({});

    useEffect(() => {
        if (product && isOpen) {
            setQuantity(1);
            const initialOptions: { [optionId: string]: boolean } = {};
            product.customizableOptions?.forEach(option => {
                initialOptions[option.id] = option.defaultIncluded;
            });
            setSelectedOptions(initialOptions);
        }
    }, [product, isOpen]);

    const currentPrice = useMemo(() => {
        if (!product) return 0;
        let price = product.basePrice_usd;
        product.customizableOptions?.forEach(option => {
            const isSelected = selectedOptions[option.id];
            if (!option.defaultIncluded && isSelected) {
                price += option.price_usd;
            }
        });
        return price;
    }, [product, selectedOptions]);

    if (!product) return null;

    const handleOptionChange = (optionId: string, checked: boolean) => {
        setSelectedOptions(prev => ({ ...prev, [optionId]: checked }));
    };

    const handleAddToCartClick = () => {
        onAddToCart(product, quantity, selectedOptions, currentPrice);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Personaliza ${product.name}`}>
            <div className="flex flex-col items-center space-y-4 pb-20 md:pb-0">
                <img
                    src={product.image || IMAGE_PLACEHOLDER}
                    alt={product.name}
                    className="w-48 h-48 object-cover rounded-lg border-2 border-gray-700"
                />
                <p className="text-gray-300 text-lg text-center">{product.category}</p>

                {product.customizableOptions && product.customizableOptions.length > 0 && (
                    <div className="w-full bg-gray-700 p-4 rounded-md border border-gray-600">
                        <h3 className="text-xl font-semibold text-orange-400 mb-3">Opciones de Personalización:</h3>
                        <div className="space-y-3">
                            {product.customizableOptions.map(option => (
                                <label key={option.id} className="flex items-center justify-between text-white cursor-pointer group">
                                    <span className="text-lg flex-grow">
                                        {option.name}
                                        {!option.defaultIncluded && option.price_usd > 0 && (
                                            <span className="text-gray-400 text-sm ml-2">(+${option.price_usd.toFixed(2)})</span>
                                        )}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={selectedOptions[option.id]}
                                        onChange={(e) => handleOptionChange(option.id, e.target.checked)}
                                        className="form-checkbox h-6 w-6 text-orange-500 bg-gray-800 border-gray-500 rounded focus:ring-orange-500 accent-orange-500 transform scale-125 group-hover:scale-130 transition-transform duration-200"
                                        aria-label={`${option.name} ${!option.defaultIncluded && option.price_usd > 0 ? `con costo adicional de ${option.price_usd.toFixed(2)} dólares` : ''}`}
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between w-full mt-4 bg-gray-700 p-4 rounded-md border border-gray-600">
                    <span className="text-xl font-semibold text-white">Cantidad:</span>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                            disabled={quantity <= 1}
                            className="p-2 rounded-full bg-gray-600 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500"
                            aria-label="Reducir cantidad"
                        >
                            <Minus className="w-5 h-5" />
                        </button>
                        <span className="text-2xl font-bold text-orange-400 w-8 text-center" aria-live="polite">{quantity}</span>
                        <button
                            onClick={() => setQuantity(prev => prev + 1)}
                            className="p-2 rounded-full bg-gray-600 text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            aria-label="Aumentar cantidad"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center w-full text-2xl font-bold border-t border-gray-700 pt-4 mt-4">
                    <span className="text-white">Total:</span>
                    <span className="text-orange-500">$ {(currentPrice * quantity).toFixed(2)} USD</span>
                </div>

                {/* STICKY BUTTON FOR MOBILE */}
                <div className="fixed md:relative bottom-0 left-0 right-0 p-4 bg-gray-800 md:bg-transparent border-t md:border-t-0 border-gray-700 z-50 md:z-auto">
                    <button
                        onClick={handleAddToCartClick}
                        className="w-full bg-orange-600 text-white py-3 rounded-full text-lg font-semibold hover:bg-orange-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-lg"
                        aria-label={`Añadir ${quantity}x ${product.name} al carrito por $ ${(currentPrice * quantity).toFixed(2)} USD`}
                    >
                        Añadir al Carrito
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ProductDetailModal;
