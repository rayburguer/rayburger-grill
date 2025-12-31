import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            const dismissed = localStorage.getItem('installPromptDismissed');
            const dismissedTime = dismissed ? parseInt(dismissed) : 0;
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
            const isRecentlyDismissed = (Date.now() - dismissedTime) < sevenDaysInMs;

            if (!isRecentlyDismissed) {
                e.preventDefault();
                setDeferredPrompt(e as BeforeInstallPromptEvent);
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Store dismissal in localStorage to not show again for a while
        localStorage.setItem('installPromptDismissed', Date.now().toString());
    };

    return (
        <AnimatePresence>
            {showPrompt && deferredPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-sm z-50"
                >
                    <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl shadow-2xl border-2 border-orange-400/50 overflow-hidden">
                        <div className="p-6 relative">
                            {/* Close Button */}
                            <button
                                onClick={handleDismiss}
                                className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
                                aria-label="Cerrar"
                            >
                                <X size={20} />
                            </button>

                            {/* Content */}
                            <div className="flex items-start gap-4">
                                {/* Logo */}
                                <div className="flex-shrink-0">
                                    <img
                                        src="/logo.jpg"
                                        alt="Ray Burger Grill"
                                        className="w-16 h-16 rounded-xl border-2 border-white/30 shadow-lg object-cover"
                                    />
                                </div>

                                {/* Text */}
                                <div className="flex-1">
                                    <h3 className="text-white font-black text-lg mb-1">
                                        ¡Instala Ray Burger!
                                    </h3>
                                    <p className="text-white/90 text-sm mb-4">
                                        Accede más rápido a tus hamburguesas favoritas con nuestra app.
                                    </p>

                                    {/* Install Button */}
                                    <button
                                        onClick={handleInstall}
                                        className="w-full bg-white text-orange-600 font-bold py-3 px-4 rounded-xl hover:bg-orange-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <Download size={20} />
                                        Instalar Ahora
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InstallPrompt;
