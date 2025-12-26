import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Product } from '../../types';

interface POSProductCustomizerProps {
    product: Product;
    onConfirm: (selectedOptions: { [optionId: string]: boolean }, finalPrice: number) => void;
    onCancel: () => void;
}

export const POSProductCustomizer: React.FC<POSProductCustomizerProps> = ({ product, onConfirm, onCancel }) => {
    const [selectedOptions, setSelectedOptions] = useState<{ [optionId: string]: boolean }>(() => {
        const initial: { [optionId: string]: boolean } = {};
        product.customizableOptions?.forEach(opt => {
            initial[opt.id] = opt.defaultIncluded;
        });
        return initial;
    });

    const totalPrice = product.basePrice_usd + (product.customizableOptions?.reduce((sum, opt) => {
        if (!opt.defaultIncluded && selectedOptions[opt.id]) {
            return sum + opt.price_usd;
        }
        return sum;
    }, 0) || 0);

    const toggleOption = (id: string) => {
        setSelectedOptions(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 w-full max-w-sm rounded-2xl border border-gray-700 shadow-2xl flex flex-col">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Personalizar {product.name}</h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                    {product.customizableOptions?.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => toggleOption(opt.id)}
                            className={`w-full p-3 rounded-xl border flex justify-between items-center transition-all ${selectedOptions[opt.id]
                                    ? opt.defaultIncluded ? 'bg-gray-800 border-gray-600' : 'bg-orange-600/20 border-orange-500'
                                    : opt.defaultIncluded ? 'bg-red-900/20 border-red-900 text-red-400' : 'bg-gray-800 border-transparent opacity-50'
                                }`}
                        >
                            <div className="text-left">
                                <p className={`font-bold ${!selectedOptions[opt.id] && opt.defaultIncluded ? 'line-through' : 'text-white'}`}>
                                    {opt.defaultIncluded && !selectedOptions[opt.id] ? `SIN ${opt.name}` : opt.name}
                                </p>
                                <p className="text-[10px] uppercase font-bold text-gray-500">
                                    {opt.defaultIncluded ? 'Incluido' : `Extra (+$${opt.price_usd})`}
                                </p>
                            </div>
                            {selectedOptions[opt.id] && <Check size={18} className={opt.defaultIncluded ? 'text-gray-400' : 'text-orange-500'} />}
                            {!selectedOptions[opt.id] && opt.defaultIncluded && <X size={18} className="text-red-500" />}
                        </button>
                    ))}

                    {(!product.customizableOptions || product.customizableOptions.length === 0) && (
                        <p className="text-center text-gray-500 py-4 italic">Este producto no tiene opciones extra.</p>
                    )}
                </div>

                <div className="p-4 bg-gray-800 rounded-b-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-400 text-sm font-bold">Total Producto:</span>
                        <span className="text-xl font-black text-white">${totalPrice.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={() => onConfirm(selectedOptions, totalPrice)}
                        className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                        Agregar al Pedido
                    </button>
                </div>
            </div>
        </div>
    );
};
