import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
    message: string;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
    useEffect(() => {
        const duration = message.length > 50 ? 5000 : 3000;
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, message]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: 20, x: "-50%" }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="fixed bottom-6 left-1/2 bg-gray-900/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-orange-500/30 z-[110] flex items-center gap-4 min-w-[300px] max-w-[90vw]"
                role="status"
                aria-live="polite"
            >
                <div className="bg-orange-500/20 p-2 rounded-full shrink-0">
                    <CheckCircle className="text-orange-500 w-6 h-6 animate-pulse" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-white/90 whitespace-pre-line leading-relaxed tracking-wide">
                        {message}
                    </p>
                </div>
                {/* Progress bar effect could be cool but keeping it simple/clean for now */}
            </motion.div>
        </AnimatePresence>
    );
};

export default Toast;
