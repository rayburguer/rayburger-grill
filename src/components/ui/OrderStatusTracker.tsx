import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, X } from 'lucide-react';
import { Order } from '../../types';

interface OrderStatusTrackerProps {
    order: Order | null;
    onClose: () => void;
}

const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ order, onClose }) => {
    if (!order) return null;

    const steps = [
        { id: 'pending', label: 'Recibido', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        // { id: 'preparing', ... } REMOVED for simplification per user request
        // { id: 'shipped', ... } REMOVED
        { id: 'delivered', label: 'Listo / Entregado', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === order.status);
    const activeStep = steps[currentStepIndex] || steps[0];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 overflow-hidden"
            >
                <div className="bg-gray-900/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl shadow-2xl p-4">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${activeStep.bg}`}>
                                <activeStep.icon className={`w-5 h-5 ${activeStep.color}`} />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm">Estado de tu Pedido</h4>
                                <p className="text-gray-400 text-[10px] uppercase tracking-wider">ID: #{order.orderId.substring(0, 8)}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-1.5 w-full bg-gray-800 rounded-full mb-6 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
                        />
                    </div>

                    {/* Steps Labels */}
                    <div className="flex justify-between">
                        {steps.map((step, idx) => {
                            const isCompleted = idx < currentStepIndex;
                            const isActive = idx === currentStepIndex;
                            return (
                                <div key={step.id} className="flex flex-col items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${isCompleted || isActive ? 'bg-orange-500' : 'bg-gray-700'}`} />
                                    <span className={`text-[9px] font-bold uppercase ${isActive ? 'text-orange-400' : 'text-gray-500'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-[11px]">
                        <span className="text-gray-500 italic">Actualizado hace un momento</span>
                        <span className="text-orange-500 font-bold px-2 py-0.5 bg-orange-500/10 rounded-full border border-orange-500/20">
                            {order.deliveryMethod === 'delivery' ? '🛵 A Domicilio' : '🏠 Retiro'}
                        </span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default OrderStatusTracker;
