import React from 'react';
import { motion } from 'framer-motion';
import { User } from '../../types';
import TierProgressBar from '../loyalty/TierProgressBar'; // Ensure this is imported

interface HeroSectionProps {
    onCtaClick: () => void;
    user?: User | null;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onCtaClick, user }) => {
    return (
        <section className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden mb-12">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-gray-950">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin-slow opacity-20 bg-gradient-to-r from-orange-900 via-gray-900 to-red-900 blur-[120px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-gray-950 z-10"></div>
            </div>

            <div className="relative z-20 text-center max-w-5xl px-4 w-full flex flex-col items-center">

                {/* --- DISPLAY MODE: GUEST (Visual Impact Focus) --- */}
                {!user ? (
                    <motion.div
                        className="flex flex-col items-center"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* HERO PRODUCT IMAGE (Replaces Logo) */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                            className="relative mb-6"
                        >
                            <div className="absolute inset-0 bg-orange-500/20 blur-[60px] rounded-full scale-75 animate-pulse"></div>
                            <img
                                src="/hero_burger.png"
                                alt="Premium Burger"
                                className="w-72 h-72 sm:w-96 sm:h-96 object-contain drop-shadow-2xl relative z-10 hover:scale-105 transition-transform duration-500"
                            />
                            {/* Small Logo Badge */}
                            <div className="absolute -bottom-4 right-0 w-24 h-24 bg-black/80 backdrop-blur-md rounded-full border border-white/10 p-2 shadow-xl rotate-12">
                                <img src="/logo.jpg" alt="Logo" className="w-full h-full rounded-full opacity-90" />
                            </div>
                        </motion.div>

                        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl mb-4">
                            SABOR <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500">REAL</span>
                            <br />
                            A LA PARRILLA
                        </h1>

                        <p className="text-xl sm:text-2xl text-gray-300 font-light max-w-2xl mx-auto mb-8">
                            Cada mordida es una experiencia <span className="text-orange-400 font-bold italic">adictiva</span>.
                        </p>

                        <button
                            onClick={onCtaClick}
                            className="group relative inline-flex items-center gap-3 px-10 py-5 bg-orange-600 rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(234,88,12,0.4)]"
                        >
                            <span className="relative z-10 text-white font-black text-xl tracking-wide uppercase">¡HAZ TU PEDIDO YA!</span>
                            <span className="relative z-10 bg-white/20 p-1 rounded-full"><svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></span>
                        </button>
                    </motion.div>
                ) : (
                    /* --- DISPLAY MODE: LOGGED IN (Loyalty Dashboard) --- */
                    <motion.div
                        className="w-full max-w-3xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl mt-12"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 text-center sm:text-left">
                            <div className="relative">
                                <img src="/logo.jpg" alt="Profile" className="w-20 h-20 rounded-full border-2 border-orange-500 shadow-lg" />
                                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                    {user.loyaltyTier}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white">¡Hola, {user.name.split(' ')[0]}! 👋</h2>
                                <p className="text-gray-400 text-sm">¿Listo para repetir tu vicio?</p>
                            </div>
                            <div className="sm:ml-auto p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-white/5 shadow-inner min-w-[180px]">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Tu Saldo Disponible</p>
                                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                                    ${user.walletBalance_usd?.toFixed(2) || '0.00'}
                                </p>
                            </div>
                        </div>

                        {/* Tier Progress */}
                        <div className="mb-8">
                            <TierProgressBar
                                lifetimeSpending={user.lifetimeSpending_usd || 0}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={onCtaClick}
                                className="w-full py-4 bg-white text-black font-black uppercase text-lg rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-lg"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                Nuevo Pedido
                            </button>
                            <button
                                onClick={() => { /* Navigate to history or modal? for now just scroll to menu is fine */ onCtaClick(); }}
                                className="w-full py-4 bg-orange-600/20 border border-orange-500/50 text-orange-400 font-bold uppercase text-sm rounded-xl hover:bg-orange-600/30 transition-colors"
                            >
                                Ver mis Recompensas
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default HeroSection; // Export HeroSectionProps not needed unless used externally
