import React from 'react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
    onCtaClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onCtaClick }) => {
    return (
        <section className="relative w-full h-[80vh] flex items-center justify-center overflow-hidden mb-12">
            {/* Dynamic Background with Gradients */}
            <div className="absolute inset-0 bg-gray-900">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin-slow opacity-30 bg-gradient-to-r from-orange-600 via-yellow-500 to-red-600 blur-[100px]"></div>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-20 text-center max-w-4xl px-4">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    {/* LOGO */}
                    <motion.img
                        src="/logo.jpg"
                        alt="Ray Burguer Grill Logo"
                        className="w-64 h-64 mx-auto mb-6 drop-shadow-2xl"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    />

                    <span className="inline-block py-1 px-3 rounded-full bg-orange-500/20 border border-orange-500 text-orange-400 text-sm font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
                        🔥 Somos tu verdadero vicio
                    </span>
                    <h1 className="font-display text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 leading-tight drop-shadow-2xl">
                        SABOR PREMIUM
                        <br />
                        <span className="text-orange-600">A LA PARRILLA</span>
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="mt-6 text-xl md:text-2xl text-gray-300 font-light max-w-2xl mx-auto"
                >
                    Street. Food. Crafted. <span className="text-white font-semibold">Cada mordida es una experiencia adictiva.</span>
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                    className="mt-10"
                >
                    <button
                        onClick={onCtaClick}
                        className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-orange-600 font-display rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-600 ring-offset-gray-900 overflow-hidden hover:scale-105 shadow-lg shadow-orange-600/30"
                    >
                        <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
                        <span className="relative flex items-center">
                            HAZ TU PEDIDO
                            <svg className="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                        </span>
                    </button>
                </motion.div>
            </div>

            {/* Floating Elements (Optional decorative) */}
            <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute bottom-10 right-10 text-6xl opacity-20 pointer-events-none"
            >
                🍔
            </motion.div>
            <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="absolute top-20 left-10 text-6xl opacity-20 pointer-events-none"
            >
                🔥
            </motion.div>
        </section>
    );
};

export default HeroSection;
