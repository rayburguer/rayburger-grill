import React, { useState, useEffect } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { User } from '../../types';


interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalUsd: number;
    tasaBs: number;
    onOrderConfirmed: (buyerEmail: string, buyerName?: string, deliveryInfo?: { method: 'delivery' | 'pickup', fee: number, phone: string }, newRegistrationData?: { password: string }, pointsUsed?: number) => void;
    currentUser: User | null;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, totalUsd, tasaBs, onOrderConfirmed, currentUser }) => {
    // STEP STATE
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);

    // No more payment method selection (handled via WhatsApp)
    const [buyerName, setBuyerName] = useState<string>(currentUser?.name || '');
    const [buyerEmail, setBuyerEmail] = useState<string>(currentUser?.email || '');
    const [buyerPhone, setBuyerPhone] = useState<string>(currentUser?.phone || '');
    const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('pickup');
    const [deliveryFee, setDeliveryFee] = useState<number>(0);

    // Coupon Logic
    const [couponCode, setCouponCode] = useState('');
    const [discountPercent, setDiscountPercent] = useState(0);
    const [couponError, setCouponError] = useState('');

    // Seamless Registration State
    const [isRegistering, setIsRegistering] = useState(false);
    const [registerPassword, setRegisterPassword] = useState('');

    // Points Redemption State
    const [usePoints, setUsePoints] = useState(false);
    const [pointsToUse, setPointsToUse] = useState(0);

    // Loading and Error States
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const applyCoupon = () => {
        if (couponCode.toUpperCase().trim() === 'BURGERIDEAL5') {
            setDiscountPercent(5);
            setCouponError('');
        } else {
            setDiscountPercent(0);
            setCouponError('Código inválido o expirado');
        }
    };

    const subtotal = totalUsd;
    const discountAmount = (subtotal * discountPercent) / 100;
    const pointsDiscount = pointsToUse / 100; // 100 points = $1 USD
    const finalTotalUsd = subtotal - discountAmount - pointsDiscount + deliveryFee;
    const totalBs = (finalTotalUsd * tasaBs).toFixed(2);

    useEffect(() => {
        if (currentUser) {
            setBuyerName(currentUser.name);
            setBuyerEmail(currentUser.email);
            setBuyerPhone(currentUser.phone);
        }
    }, [currentUser]);

    // Reset step when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
        }
    }, [isOpen]);

    // Step 1 validation
    const isStep1Valid = currentUser || (buyerName.trim() && buyerPhone?.trim());

    // Validation: Name and Phone are required
    const isConfirmButtonDisabled = !buyerName.trim() || !buyerPhone?.trim() || isProcessing;

    // Handle order confirmation with error handling
    const handleConfirmOrder = async () => {
        if (isConfirmButtonDisabled || (isRegistering && registerPassword.length < 4)) return;

        setIsProcessing(true);
        setError(null);

        try {
            const registrationData = (isRegistering && !currentUser) ? { password: registerPassword } : undefined;
            await onOrderConfirmed(
                buyerEmail,
                buyerName,
                { method: deliveryMethod, fee: deliveryFee, phone: buyerPhone },
                registrationData,
                usePoints ? pointsToUse : 0
            );
            // Order confirmed successfully - modal will close via parent component
        } catch (err) {
            console.error('Error al confirmar pedido:', err);
            setError('Hubo un problema al procesar tu pedido. Por favor intenta nuevamente.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirmación de Pedido">
            {/* PROGRESS INDICATOR */}
            <div className="flex items-center justify-center gap-2 mb-6">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${currentStep >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                    1
                </div>
                <div className={`h-1 w-12 ${currentStep >= 2 ? 'bg-orange-600' : 'bg-gray-700'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${currentStep >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                    2
                </div>
            </div>

            {/* STEP 1: CONTACT INFO */}
            {currentStep === 1 && (
                <div className="space-y-6">
                    <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-white mb-1">Datos de Contacto</h3>
                        <p className="text-sm text-gray-400">¿Cómo te contactamos?</p>
                    </div>

                    {/* Contact Details Section */}
                    <div>
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

                    {/* SEAMLESS REGISTRATION CHECKBOX */}
                    {!currentUser && (
                        <div className="bg-gradient-to-r from-orange-900/20 to-orange-800/20 p-4 rounded-xl border border-orange-500/30">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={isRegistering}
                                        onChange={(e) => setIsRegistering(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-6 h-6 border-2 border-orange-500 rounded bg-gray-900 peer-checked:bg-orange-500 transition-all"></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                </div>
                                <span className="text-white font-bold text-sm group-hover:text-orange-300 transition-colors">
                                    🎁 ¡Quiero ganar mis $50 de regalo y sumar puntos!
                                </span>
                            </label>

                            {isRegistering && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-gray-400 mb-1 text-xs uppercase font-bold tracking-wider">Crea una contraseña <span className="text-red-500">*</span></label>
                                    <input
                                        type="password"
                                        placeholder="Mínimo 4 caracteres"
                                        value={registerPassword}
                                        onChange={(e) => setRegisterPassword(e.target.value)}
                                        className="w-full px-4 py-2 rounded-md bg-gray-900 text-white border border-orange-500/50 focus:border-orange-500 outline-none transition-colors"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Crearemos tu cuenta automáticamente al confirmar el pedido.</p>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => setCurrentStep(2)}
                        disabled={!isStep1Valid || (isRegistering && registerPassword.length < 4)}
                        className={`w-full py-4 rounded-full text-lg font-bold uppercase tracking-wide transition-all duration-300 ${!isStep1Valid || (isRegistering && registerPassword.length < 4)
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-orange-600 hover:bg-orange-500 text-white shadow-xl hover:shadow-orange-500/30 hover:-translate-y-1'
                            }`}
                    >
                        Continuar →
                    </button>
                </div>
            )}

            {/* STEP 2: DELIVERY, POINTS, CONFIRMATION */}
            {currentStep === 2 && (
                <div className="space-y-6">
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

                    {/* Delivery Selection */}
                    <div>
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
                                    <div className="grid grid-cols-1 gap-2"> {/* Changed to column layout for labels */}
                                        <button
                                            onClick={() => { setDeliveryMethod('delivery'); setDeliveryFee(1); }}
                                            className={`py-2 px-3 rounded text-left text-xs font-bold border transition-colors flex justify-between items-center ${deliveryFee === 1 && deliveryMethod === 'delivery' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                                        >
                                            <span>Zona 1 <span className="font-normal opacity-70">(Casco Central / La Mora)</span></span>
                                            <span>$1</span>
                                        </button>
                                        <button
                                            onClick={() => { setDeliveryMethod('delivery'); setDeliveryFee(2); }}
                                            className={`py-2 px-3 rounded text-left text-xs font-bold border transition-colors flex justify-between items-center ${deliveryFee === 2 && deliveryMethod === 'delivery' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                                        >
                                            <span>Zona 2 <span className="font-normal opacity-70">(Palma Real / San Homero)</span></span>
                                            <span>$2</span>
                                        </button>
                                        <button
                                            onClick={() => { setDeliveryMethod('delivery'); setDeliveryFee(3); }}
                                            className={`py-2 px-3 rounded text-left text-xs font-bold border transition-colors flex justify-between items-center ${deliveryFee === 3 && deliveryMethod === 'delivery' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                                        >
                                            <span>Zona 3 <span className="font-normal opacity-70">(El Consejo)</span></span>
                                            <span>$3</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* POINTS REDEMPTION SECTION */}
                    {currentUser && currentUser.points > 0 && (
                        <div className="mb-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-4 rounded-xl border border-purple-500/30">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">💎</span>
                                    <div>
                                        <p className="text-white font-bold text-sm">Tienes {currentUser.points} puntos</p>
                                        <p className="text-gray-400 text-xs">= ${(currentUser.points / 100).toFixed(2)} USD disponibles</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={usePoints}
                                        onChange={(e) => {
                                            setUsePoints(e.target.checked);
                                            if (!e.target.checked) setPointsToUse(0);
                                        }}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>

                            {usePoints && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-gray-300 text-xs mb-2">Puntos a usar:</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="0"
                                            max={Math.min(currentUser.points, Math.floor(finalTotalUsd * 100))}
                                            value={pointsToUse}
                                            onChange={(e) => setPointsToUse(Number(e.target.value))}
                                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            max={Math.min(currentUser.points, Math.floor(finalTotalUsd * 100))}
                                            value={pointsToUse}
                                            onChange={(e) => setPointsToUse(Math.min(Number(e.target.value), currentUser.points))}
                                            className="w-20 bg-gray-800 border border-purple-500/50 rounded px-2 py-1 text-white text-sm text-center"
                                        />
                                    </div>
                                    {pointsToUse > 0 && (
                                        <p className="text-green-400 text-xs mt-2 font-bold">
                                            🎉 Descuento de ${pointsDiscount.toFixed(2)} USD aplicado
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Coupon Section */}
                    <div className="mb-6 bg-gray-800/30 p-4 rounded-xl border border-gray-700 border-dashed">
                        <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Código Promocional</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                placeholder="Ej: BURGERIDEAL5"
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 outline-none uppercase font-mono"
                            />
                            <button
                                onClick={applyCoupon}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                            >
                                Aplicar
                            </button>
                        </div>
                        {couponError && <p className="text-red-500 text-xs mt-2 font-bold">{couponError}</p>}
                        {discountPercent > 0 && (
                            <div className="mt-2 text-green-500 text-xs font-bold flex items-center gap-1">
                                <span>🎉 ¡Cupón aplicado! Ahorras ${discountAmount.toFixed(2)} USD</span>
                            </div>
                        )}
                    </div>

                    {/* SEAMLESS REGISTRATION CHECKBOX */}
                    {!currentUser && (
                        <div className="mb-6 bg-gradient-to-r from-orange-900/20 to-orange-800/20 p-4 rounded-xl border border-orange-500/30">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={isRegistering}
                                        onChange={(e) => setIsRegistering(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-6 h-6 border-2 border-orange-500 rounded bg-gray-900 peer-checked:bg-orange-500 transition-all"></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                </div>
                                <span className="text-white font-bold text-sm group-hover:text-orange-300 transition-colors">
                                    🎁 ¡Quiero ganar mis $50 de regalo y sumar puntos!
                                </span>
                            </label>

                            {isRegistering && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-gray-400 mb-1 text-xs uppercase font-bold tracking-wider">Crea una contraseña <span className="text-red-500">*</span></label>
                                    <input
                                        type="password"
                                        placeholder="Mínimo 4 caracteres"
                                        value={registerPassword}
                                        onChange={(e) => setRegisterPassword(e.target.value)}
                                        className="w-full px-4 py-2 rounded-md bg-gray-900 text-white border border-orange-500/50 focus:border-orange-500 outline-none transition-colors"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Crearemos tu cuenta automáticamente al confirmar el pedido.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                            <p className="text-red-400 text-sm font-semibold">❌ {error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setCurrentStep(1)}
                            className="px-6 py-4 rounded-full bg-gray-700 text-white font-bold hover:bg-gray-600 transition-colors"
                        >
                            ← Atrás
                        </button>

                        <button
                            onClick={handleConfirmOrder}
                            disabled={isConfirmButtonDisabled || (isRegistering && registerPassword.length < 4)}
                            className={`flex-1 py-4 rounded-full text-lg font-bold uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${isConfirmButtonDisabled || (isRegistering && registerPassword.length < 4)
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-500 text-white shadow-xl hover:shadow-green-500/30 hover:-translate-y-1'
                                }`}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Procesando...
                                </>
                            ) : isConfirmButtonDisabled ? (
                                'Faltan datos'
                            ) : (isRegistering && registerPassword.length < 4) ? (
                                'Contraseña requerida'
                            ) : (
                                <>
                                    <MessageSquare className="w-5 h-5" />
                                    {isRegistering ? 'Crear y Confirmar' : 'Confirmar Pedido'}
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-3">Al confirmar, serás redirigido a WhatsApp para finalizar.</p>
                </div>
            )}
        </Modal>
    );
};
export default CheckoutModal;
