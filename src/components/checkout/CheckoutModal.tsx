import React, { useState, useEffect } from 'react';
import { Loader2, Clock, X } from 'lucide-react';
import Modal from '../ui/Modal';
import { User } from '../../types';
import { PAGO_MOVIL_BANK, PAGO_MOVIL_ID, PAGO_MOVIL_PHONE } from '../../config/constants';
import { normalizePhone } from '../../utils/helpers';


interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalUsd: number;
    tasaBs: number;
    onOrderConfirmed: (
        buyerEmail: string,
        buyerName?: string,
        deliveryInfo?: { method: 'delivery' | 'pickup', fee: number, phone: string },
        newRegistrationData?: { password: string },
        balanceUsed_usd?: number,
        isInternal?: boolean,
        paymentStatus?: 'pending' | 'paid',
        paymentMethod?: 'cash' | 'pago_movil' | 'zelle' | 'other' | 'whatsapp_link'
    ) => void;
    currentUser: User | null;
    isCashierMode?: boolean;
}

const COUNTRY_PREFIXES = [
    { code: '58', country: 'Venezuela', flag: '🇻🇪' },
    { code: '57', country: 'Colombia', flag: '🇨🇴' },
    { code: '1', country: 'USA/Canadá', flag: '🇺🇸' },
    { code: '34', country: 'España', flag: '🇪🇸' },
    { code: '56', country: 'Chile', flag: '🇨🇱' },
    { code: '593', country: 'Ecuador', flag: '🇪🇨' },
    { code: '51', country: 'Perú', flag: '🇵🇪' },
    { code: '54', country: 'Argentina', flag: '🇦🇷' },
];

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, totalUsd, tasaBs, onOrderConfirmed, currentUser, isCashierMode }) => {
    // STEP STATE
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);

    // No more payment method selection (handled via WhatsApp)
    const [buyerName, setBuyerName] = useState<string>(currentUser?.name || '');
    const [buyerEmail, setBuyerEmail] = useState<string>(currentUser?.email || '');
    const [phonePrefix, setPhonePrefix] = useState<string>('58');
    const [buyerPhone, setBuyerPhone] = useState<string>(currentUser?.phone || '');
    const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('pickup');
    const [deliveryFee, setDeliveryFee] = useState<number>(0);

    // Registering State

    // Seamless Registration State
    const [isRegistering, setIsRegistering] = useState(false);
    const [registerPassword, setRegisterPassword] = useState('');

    // Wallet Balance State
    const [useWallet, setUseWallet] = useState(false);
    const [balanceToUse, setBalanceToUse] = useState(0);

    // Loading and Error States
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // CASHIER MODE STATES
    const [isPaymentDeferred, setIsPaymentDeferred] = useState(false); // "Credit" / "Pay Later"
    const [selectedInternalPayment, setSelectedInternalPayment] = useState<'cash' | 'pago_movil' | 'zelle' | 'other'>('cash');


    const subtotal = totalUsd;
    // AUTO-CALC WALLET ABILITY
    useEffect(() => {
        if (useWallet && currentUser) {
            const available = currentUser.walletBalance_usd || 0;
            // Max can use is whichever is smaller: subtotal or available balance
            setBalanceToUse(Math.min(available, totalUsd));
        } else {
            setBalanceToUse(0);
        }
    }, [useWallet, currentUser, totalUsd]);
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
        }
    }, [isOpen]);

    // Reset step when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
        }
    }, [isOpen]);

    const finalTotalUsd = Math.max(0, subtotal - balanceToUse + deliveryFee);
    const totalBs = (finalTotalUsd * tasaBs).toFixed(2);

    useEffect(() => {
        if (currentUser) {
            setBuyerName(currentUser.name);
            setBuyerEmail(currentUser.email);
            setBuyerPhone(currentUser.phone);
        }
    }, [currentUser]);

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
            const fullPhone = currentUser ? buyerPhone : (phonePrefix + normalizePhone(buyerPhone));
            await onOrderConfirmed(
                buyerEmail,
                buyerName,
                { method: deliveryMethod, fee: deliveryFee, phone: fullPhone },
                registrationData,
                useWallet ? balanceToUse : 0,
                isCashierMode,
                isPaymentDeferred ? 'pending' : 'paid',
                isCashierMode ? selectedInternalPayment : 'whatsapp_link'
            );
            // Order confirmed successfully - modal will close via parent component
        } catch (err) {
            console.error('Error al confirmar pedido:', err);
            setError('Hubo un problema al procesar tu pedido. Por favor intenta nuevamente.');
        } finally {
            setIsProcessing(false);
        }
    };

    // --- CAJERO EXPRESS MODIFICATIONS ---
    const [isAnonymous, setIsAnonymous] = useState(false);

    // If anonymous, auto-fill dummy data
    useEffect(() => {
        if (isAnonymous) {
            setBuyerName('Cliente Mostrador');
            setBuyerPhone('0000000000');
            setPhonePrefix('0412');
        } else if (!currentUser) {
            // Only clear if we are not logged in (don't clear existing user data)
            setBuyerName('');
            setBuyerPhone('');
        }
    }, [isAnonymous, currentUser]);

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
                        <h3 className="text-xl font-bold text-white mb-1">
                            {isCashierMode ? 'Identificar Cliente' : 'Datos de Contacto'}
                        </h3>
                        <p className="text-sm text-gray-400">
                            {isCashierMode ? '¿A quién le estamos vendiendo?' : '¿Cómo te contactamos?'}
                        </p>
                    </div>

                    {/* ANONYMOUS CHECKBOX (Only visible if not logged in or in cashier mode) */}
                    {(!currentUser || isCashierMode) && (
                        <div className="flex justify-center mb-4">
                            <label className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 cursor-pointer hover:border-orange-500 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isAnonymous}
                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                    className="w-5 h-5 accent-orange-500 rounded focus:ring-orange-500"
                                />
                                <span className="font-bold text-white text-sm">👤 Cliente Anónimo (Rápido)</span>
                            </label>
                        </div>
                    )}

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
                                    <label className="block text-gray-400 mb-1 text-xs uppercase font-bold tracking-wider flex items-center gap-1">Nombre <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Tu Nombre"
                                        value={buyerName}
                                        onChange={(e) => setBuyerName(e.target.value)}
                                        className="w-full px-4 py-3.5 text-base rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-orange-500 outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1 text-xs uppercase font-bold tracking-wider flex items-center gap-1">WhatsApp <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <select
                                            value={phonePrefix}
                                            onChange={(e) => setPhonePrefix(e.target.value)}
                                            className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-3.5 text-base focus:border-orange-500 outline-none transition-colors"
                                        >
                                            {COUNTRY_PREFIXES.map(p => (
                                                <option key={p.code} value={p.code}>{p.flag} +{p.code}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="tel"
                                            placeholder="Número (10 dígitos)"
                                            value={buyerPhone}
                                            onChange={(e) => setBuyerPhone(e.target.value.replace(/\D/g, ''))}
                                            className="flex-1 px-4 py-3.5 text-base rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-orange-500 outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {!currentUser && (
                        <div className="bg-gradient-to-r from-orange-900/20 to-orange-800/20 p-4 rounded-xl border border-orange-500/30">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={isRegistering}
                                    onChange={(e) => setIsRegistering(e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div className="w-6 h-6 border-2 border-orange-500 rounded bg-gray-900 peer-checked:bg-orange-500 transition-all flex items-center justify-center">
                                    <X size={14} className={`text-white transition-opacity ${isRegistering ? 'opacity-100' : 'opacity-0'}`} />
                                </div>
                                <span className="text-white font-bold text-sm group-hover:text-orange-300 transition-colors">
                                    🎁 ¡Quiero ganar mi regalo de bienvenida y sumar recompensas!
                                </span>
                            </label>

                            {isRegistering && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-gray-400 mb-1 text-xs uppercase font-bold tracking-wider">Crea una contraseña <span className="text-red-500">*</span></label>
                                    <input
                                        type="password"
                                        placeholder="Mínimo 4 caracteres"
                                        value={registerPassword}
                                        onChange={(e) => setRegisterPassword(e.target.value)}
                                        className="w-full px-4 py-3.5 text-base rounded-lg bg-gray-900 text-white border border-orange-500/50 focus:border-orange-500 outline-none transition-colors"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => setCurrentStep(2)}
                        disabled={!isStep1Valid || (isRegistering && registerPassword.length < 4)}
                        className={`w-full min-h-[56px] py-4 rounded-2xl text-lg font-bold uppercase tracking-wide transition-all active:scale-95 ${!isStep1Valid || (isRegistering && registerPassword.length < 4)
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-orange-600 hover:bg-orange-500 text-white shadow-xl hover:-translate-y-1'
                            }`}
                    >
                        Continuar →
                    </button>
                </div>
            )}

            {/* STEP 2: DELIVERY, WALLET, CONFIRMATION */}
            {currentStep === 2 && (
                <div className="space-y-6">
                    <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Total a pagar:</p>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-baseline">
                                <p className="text-gray-400">En Dólares:</p>
                                <p className="text-white text-3xl font-black">$ {finalTotalUsd.toFixed(2)}</p>
                            </div>
                            <div className="bg-gray-700/50 p-3 rounded-xl border border-orange-500/30 text-center">
                                <p className="text-orange-300 text-xs uppercase font-bold tracking-wider mb-1">Monto en Bolívares</p>
                                <p className="text-3xl font-black text-white">Bs. {totalBs}</p>
                            </div>
                        </div>
                    </div>

                    {isCashierMode && (
                        <div className="space-y-4">
                            <div className="bg-orange-600/10 border border-orange-500/30 p-4 rounded-2xl">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-3 text-center">Forma de Pago</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['cash', 'pago_movil', 'zelle', 'other'] as const).map((method) => (
                                        <button
                                            key={method}
                                            onClick={() => setSelectedInternalPayment(method)}
                                            className={`py-4 px-2 rounded-xl border text-[11px] font-black uppercase transition-all flex flex-col items-center justify-center gap-1 ${selectedInternalPayment === method
                                                ? 'bg-orange-600 border-orange-500 text-white shadow-lg'
                                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                                        >
                                            <span className="text-xl">
                                                {method === 'cash' && '💵'}
                                                {method === 'pago_movil' && '📲'}
                                                {method === 'zelle' && '🏦'}
                                                {method === 'other' && '💳'}
                                            </span>
                                            <span>
                                                {method === 'cash' && 'Efectivo'}
                                                {method === 'pago_movil' && 'Pago Móvil'}
                                                {method === 'zelle' && 'Zelle'}
                                                {method === 'other' && 'Otro'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-red-600/10 border border-red-500/30 p-4 rounded-2xl">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPaymentDeferred ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-800 text-gray-500'}`}>
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">Comer Primero / Pagar Después</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Crédito / Deuda</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isPaymentDeferred}
                                        onChange={(e) => setIsPaymentDeferred(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-7 bg-gray-800 rounded-full peer peer-checked:bg-red-600 relative after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-7"></div>
                                </label>
                            </div>
                        </div>
                    )}

                    {!isCashierMode && (
                        <div className="bg-gradient-to-br from-blue-900/30 to-gray-800 p-4 rounded-xl border border-blue-500/30">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3">Datos Pago Móvil</h3>
                            <div className="grid grid-cols-2 gap-y-1 text-xs">
                                <span className="text-gray-400">Banco:</span>
                                <span className="text-white text-right">{PAGO_MOVIL_BANK}</span>
                                <span className="text-gray-400">Cédula:</span>
                                <span className="text-white text-right font-mono">{PAGO_MOVIL_ID}</span>
                                <span className="text-gray-400">Teléfono:</span>
                                <span className="text-white text-right font-mono">{PAGO_MOVIL_PHONE}</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="text-sm uppercase font-bold tracking-wider text-gray-400">Método de Entrega:</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { setDeliveryMethod('pickup'); setDeliveryFee(0); }}
                                className={`py-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${deliveryMethod === 'pickup' ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-gray-700 bg-gray-800 text-gray-400'}`}
                            >
                                <span className="font-bold text-lg">🏠 Retiro</span>
                                <span className="text-xs">Gratis</span>
                            </button>
                            <button
                                onClick={() => { setDeliveryMethod('delivery'); setDeliveryFee(2); }}
                                className={`py-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${deliveryMethod === 'delivery' ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-gray-700 bg-gray-800 text-gray-400'}`}
                            >
                                <span className="font-bold text-lg">🛵 Delivery</span>
                                <span className="text-xs">Desde $2</span>
                            </button>
                        </div>
                    </div>

                    {currentUser && (currentUser.walletBalance_usd || 0) > 0 && (
                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-green-500 uppercase">Billetera Ray ($)</p>
                                <p className="text-[10px] text-gray-400">Saldo: ${currentUser.walletBalance_usd.toFixed(2)}</p>
                            </div>
                            <button
                                onClick={() => setUseWallet(!useWallet)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useWallet ? 'bg-green-600' : 'bg-gray-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useWallet ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm font-semibold">
                            ❌ {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setCurrentStep(1)}
                            className="min-h-[56px] px-6 py-4 rounded-2xl bg-gray-700 text-white font-bold hover:bg-gray-600 transition-colors active:scale-95"
                        >
                            ← Atrás
                        </button>

                        <button
                            onClick={handleConfirmOrder}
                            disabled={isConfirmButtonDisabled || (isRegistering && registerPassword.length < 4)}
                            className={`flex-1 min-h-[56px] py-4 rounded-2xl text-lg font-bold uppercase transition-all flex items-center justify-center gap-2 active:scale-95 ${isConfirmButtonDisabled || (isRegistering && registerPassword.length < 4)
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-500 text-white shadow-xl hover:-translate-y-1'
                                }`}
                        >
                            {isProcessing ? <Loader2 className="animate-spin" /> : 'Confirmar Pedido'}
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-500 text-center uppercase font-bold tracking-widest mt-2 transition-all">
                        {isCashierMode ? '✨ Venta procesada internamente' : '🚀 Te llevaremos a WhatsApp'}
                    </p>
                </div>
            )}
        </Modal>
    );
};

export default CheckoutModal;
