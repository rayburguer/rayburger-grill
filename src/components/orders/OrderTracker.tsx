import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, Bike, CheckCircle2, Timer } from 'lucide-react';
import { Order } from '../../types';

interface OrderTrackerProps {
    order: Order;
}

const OrderTracker: React.FC<OrderTrackerProps> = ({ order }) => {
    const steps = [
        { id: 'pending', label: 'Recibido', icon: Timer, color: 'text-blue-500' },
        { id: 'preparing', label: 'En Cocina', icon: Utensils, color: 'text-orange-500' },
        { id: 'shipped', label: 'En camino', icon: Bike, color: 'text-purple-500' },
        { id: 'delivered', label: 'Entregado', icon: CheckCircle2, color: 'text-green-500' }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === order.status);
    const progressWidth = currentStepIndex === -1 ? 0 : (currentStepIndex / (steps.length - 1)) * 100;

    return (
        <div className="w-full bg-gray-900/80 backdrop-blur-md border-t border-gray-800 p-4 sticky bottom-0 z-50 animate-in slide-in-from-bottom duration-500">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                        </span>
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                            Tu pedido #{order.orderId.slice(-4)} está {steps[currentStepIndex]?.label.toLowerCase()}
                        </h3>
                    </div>
                </div>

                <div className="relative">
                    {/* Background Line */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800 -translate-y-1/2 rounded-full" />

                    {/* Progress Line */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressWidth}%` }}
                        className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-orange-600 to-orange-400 -translate-y-1/2 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                    />

                    {/* Step Icons */}
                    <div className="relative flex justify-between">
                        {steps.map((step, idx) => {
                            const Icon = step.icon;
                            const isCompleted = idx <= currentStepIndex;
                            const isCurrent = idx === currentStepIndex;

                            return (
                                <div key={step.id} className="flex flex-col items-center gap-2">
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            scale: isCurrent ? 1.2 : 1,
                                            backgroundColor: isCompleted ? '#f97316' : '#1f2937'
                                        }}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'border-orange-400' : 'border-gray-700'
                                            } z-10 transition-colors`}
                                    >
                                        <Icon size={14} className={isCompleted ? 'text-white' : 'text-gray-500'} />
                                    </motion.div>
                                    <span className={`text-[10px] font-bold uppercase ${isCurrent ? 'text-orange-500' : isCompleted ? 'text-gray-300' : 'text-gray-600'
                                        }`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTracker;
