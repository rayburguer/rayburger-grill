import React, { useState } from 'react';
import { Product } from '../../types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ImageUploader } from '../ui/ImageUploader';

interface ProductManagementProps {
    products: Product[];
    addProduct: (p: Product) => void;
    updateProduct: (p: Product) => void;
    deleteProduct: (id: number) => void;
    onShowToast: (msg: string) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
    products, addProduct, updateProduct, deleteProduct, onShowToast
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product & { isUploading?: boolean }>>({});

    const handleSaveProduct = () => {
        if (!currentProduct.name || !currentProduct.basePrice_usd) return;
        const productData = {
            ...currentProduct,
            id: currentProduct.id || Date.now(),
            basePrice_usd: Number(currentProduct.basePrice_usd),
            stockQuantity: currentProduct.stockQuantity ? Number(currentProduct.stockQuantity) : undefined
        } as Product;

        if (isEditing) {
            updateProduct(productData);
            onShowToast('✅ Producto actualizado');
        } else {
            addProduct(productData);
            onShowToast('✅ Producto creado');
        }
        setIsEditing(false);
        setCurrentProduct({});
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mb-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                    {isEditing ? <Edit size={16} /> : <Plus size={16} />}
                    {isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input
                        className="bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-orange-500 outline-none"
                        placeholder="Nombre"
                        value={currentProduct.name || ''}
                        onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                    />
                    <input
                        className="bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-orange-500 outline-none"
                        placeholder="Precio (USD)"
                        type="number"
                        value={currentProduct.basePrice_usd || ''}
                        onChange={e => setCurrentProduct({ ...currentProduct, basePrice_usd: Number(e.target.value) })}
                    />
                    <input
                        className="bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-orange-500 outline-none lg:col-span-2"
                        placeholder="Categoría"
                        value={currentProduct.category || ''}
                        onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                    />
                    <div className="flex flex-col gap-2">
                        <ImageUploader
                            currentImage={currentProduct.image}
                            onImageUploaded={(url) => setCurrentProduct(prev => ({ ...prev, image: url }))}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    {isEditing && (
                        <button
                            onClick={() => { setIsEditing(false); setCurrentProduct({}); }}
                            className="px-6 py-2 text-gray-400 hover:text-white font-bold transition-colors"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        onClick={handleSaveProduct}
                        className="px-8 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-900/20 transition-all active:scale-95"
                    >
                        {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                {products.map(p => (
                    <div key={p.id} className="bg-gray-800 p-4 rounded-xl flex items-center justify-between group hover:bg-gray-750 border border-gray-700/50 hover:border-orange-500/30 transition-all">
                        <div className="flex items-center gap-4">
                            <img src={p.image} className="w-14 h-14 rounded-lg object-cover bg-gray-900 shadow-inner" alt={p.name} />
                            <div>
                                <h4 className="font-bold text-white text-lg">{p.name}</h4>
                                <div className="flex gap-3 items-center text-xs">
                                    <span className="text-gray-500 font-bold uppercase tracking-wider">{p.category}</span>
                                    <span className="text-orange-400 font-black text-sm bg-orange-950/30 px-2 py-0.5 rounded">${p.basePrice_usd.toFixed(2)}</span>
                                    {p.stockQuantity !== undefined && (
                                        <span className={`px-2 py-0.5 rounded font-bold ${p.stockQuantity < 5 ? 'bg-red-900/30 text-red-500 border border-red-700/30' : 'bg-gray-900 text-gray-400 border border-gray-700'}`}>
                                            Stock: {p.stockQuantity}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setIsEditing(true); setCurrentProduct(p); }}
                                className="p-2.5 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-all"
                                title="Editar"
                            >
                                <Edit size={20} />
                            </button>
                            <button
                                onClick={() => confirm(`¿Eliminar ${p.name}?`) && deleteProduct(p.id)}
                                className="p-2.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-all"
                                title="Eliminar"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
