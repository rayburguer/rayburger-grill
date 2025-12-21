import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import Modal from '../ui/Modal';
import { User } from '../../types';


interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalUsd: number;
    tasaBs: number;
    onOrderConfirmed: (buyerEmail: string, buyerName?: string, deliveryInfo?: { method: 'delivery' | 'pickup', fee: number, phone: string }) => void;
    currentUser: User | null;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, totalUsd, tasaBs, onOrderConfirmed, currentUser }) => {
    // No more payment method selection (handled via WhatsApp)
    const [buyerName, setBuyerName] = useState<string>(currentUser?.name || '');
    const [buyerEmail, setBuyerEmail] = useState<string>(currentUser?.email || '');
    const [buyerPhone, setBuyerPhone] = useState<string>(currentUser?.phone || '');
    const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('pickup');
    const [deliveryFee, setDeliveryFee] = useState<number>(0);

    const finalTotalUsd = totalUsd + deliveryFee;
    const totalBs = (finalTotalUsd * tasaBs).toFixed(2);

    useEffect(() => {
        if (currentUser) {
            setBuyerName(currentUser.name);
            setBuyerEmail(currentUser.email);
            setBuyerPhone(currentUser.phone);
        }
    }, [currentUser]);

    // Validation: Name and Phone are required
    const isConfirmButtonDisabled = !buyerName.trim() || !buyerPhone?.trim();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirmación de Pedido">
            <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-sm mb-1">Total a pagar:</p>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-baseline">
                        <p className="text-gray-400">En Dólares:</p>
                        <p className="text-white text-3xl font-black">$ {finalTotalUsd.toFixed(2)}</p>
                    </div>
                    {/* BS DISPLAY HIGHLIGHT */}
                    <div className="bg-gray-700/50 p-3 rounded-xl border border-orange-500/30 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <p className="text-orange-300 text-xs uppercase font-bold tracking-wider mb-1">Monto en Bolívares</p>
                        <p className="text-3xl font-black text-orange-500 tracking-tight">Bs. {totalBs}</p>
                        <p className="text-[10px] text-gray-500 mt-1 font-mono">Tasa del día: {tasaBs.toFixed(2)} Bs/$</p>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">*(Se coordinará el pago por WhatsApp)</p>
            </div>

            {/* Contact Details Section */}
            <div className="mb-6">
                {currentUser ? (
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Cliente</p>
                            <p className="text-white font-semibold flex items-center gap-2">
                                {currentUser.name}
                            </p>
                            <p className="text-sm text-gray-400 font-mono mt-0.5">{currentUser.phone}</p>
                        </div>
                        <div className="text-right">
                            {!currentUser.email?.endsWith('@rayburger.app') && (
                                <p className="text-xs text-gray-500">{currentUser.email}</p>
                            )}
                            <span className="text-xs text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Verificado</span>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 mb-1 text-xs uppercase font-bold tracking-wider text-accent-content/70 flex items-center gap-1">Nombre <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                placeholder="Tu Nombre"
                                value={buyerName}
                                onChange={(e) => setBuyerName(e.target.value)}
                                className="w-full px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:border-orange-500 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1 text-xs uppercase font-bold tracking-wider text-accent-content/70 flex items-center gap-1">WhatsApp <span className="text-red-500">*</span></label>
                            <input
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel"
                                placeholder="Ej: 04121234567"
                                value={buyerPhone}
                                onChange={(e) => setBuyerPhone(e.target.value)}
                                className="w-full px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:border-orange-500 outline-none transition-colors"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Delivery Selection */}
            <div className="mb-6">
                <h3 className="text-sm uppercase font-bold tracking-wider text-gray-400 mb-3">Método de Entrega:</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => { setDeliveryMethod('pickup'); setDeliveryFee(0); }}
                        className={`py-3 px-4 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${deliveryMethod === 'pickup' ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'}`}
                    >
                        <span className="font-bold">🏠 Retiro</span>
                        <span className="text-xs">Gratis</span>
                    </button>
                    <div className="flex flex-col gap-2">
                        <div className={`p-2 rounded-lg border-2 transition-all ${deliveryMethod === 'delivery' ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-gray-700 bg-gray-800 text-gray-400'}`}>
                            <span className="text-xs font-bold block mb-2 text-center">🛵 Delivery (Sectores):</span>
                            <div className="grid grid-cols-3 gap-1">
                                {[1, 2, 3].map(tier => (
                                    <button
                                        key={tier}
                                        onClick={() => { setDeliveryMethod('delivery'); setDeliveryFee(tier); }}
                                        className={`py-1 rounded text-xs font-bold border transition-colors ${deliveryFee === tier && deliveryMethod === 'delivery' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                                    >
                                        ${tier}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={() => onOrderConfirmed(buyerEmail, buyerName, { method: deliveryMethod, fee: deliveryFee, phone: buyerPhone })}
                disabled={isConfirmButtonDisabled}
                className={`w-full py-4 rounded-full text-lg font-bold uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${isConfirmButtonDisabled ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-xl hover:shadow-green-500/30 hover:-translate-y-1'
                    }`}
            >
                {isConfirmButtonDisabled ? 'Faltan datos de contacto' : (
                    <>
                        <MessageSquare className="w-5 h-5" />
                        Confirmar Pedido
                    </>
                )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">Al confirmar, serás redirigido a WhatsApp para finalizar.</p>

        </Modal >
    );
};

export default CheckoutModal;
