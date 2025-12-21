import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-gray-900 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-orange-500/30 relative z-10"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-black text-orange-500 tracking-tighter uppercase">{title}</h2>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-white transition-colors p-2 bg-gray-800 rounded-full"
                                aria-label="Cerrar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
