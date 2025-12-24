import React, { useState, useEffect } from 'react'; // FORCE REBUILD TIMESTAMP 2025-12-22
import { ShoppingCart, LogIn, LogOut, UserCircle, Clock, CheckCircle, Trophy, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Order } from '../../types';
import MobileMenu from './MobileMenu';

interface HeaderProps {
    cartItemCount: number;
    onOpenCart: () => void;
    currentUser: User | null;
    onOpenRegister: () => void;
    onOpenLogin: () => void;
    onLogout: () => void;
    onOpenProfile: () => void;
    onOpenAdmin?: () => void;
    onOpenLeaderboard?: () => void;
    onOpenRoulette?: () => void;
    activeOrder?: Order | null;
}

const Header: React.FC<HeaderProps> = ({
    cartItemCount,
    onOpenCart,
    currentUser,
    onOpenRegister,
    onOpenLogin,
    onLogout,
    onOpenProfile,
    onOpenAdmin,
    onOpenLeaderboard,
    onOpenRoulette,
    activeOrder
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const baseButtonClasses = "group px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center whitespace-nowrap active:scale-95";
    const primaryButtonClasses = `${baseButtonClasses} bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20`;
    const secondaryButtonClasses = `${baseButtonClasses} bg-gray-800 hover:bg-gray-700 text-white border border-gray-700`;
    const profileButtonClasses = `${baseButtonClasses} bg-gray-800/50 hover:bg-gray-700 text-white border border-orange-500/20`;
    const dangerButtonClasses = `${baseButtonClasses} bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20`;

    return (
        <header className="fixed top-0 left-0 right-0 z-40 glass-header px-6 py-4 flex items-center justify-between">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 md:gap-4 cursor-pointer group"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
                <div className="relative">
                    <div className="absolute inset-0 bg-orange-500 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <img
                        src="/logo.jpg"
                        alt="RayburgerGrill"
                        className="h-10 w-10 md:h-12 md:w-12 object-cover rounded-full border-2 border-orange-500/50 p-0.5 relative z-10 animate-float"
                    />
                </div>
                <div className="hidden md:flex flex-col">
                    <div className="flex items-center gap-2">
                        <h1 className="font-anton text-2xl lg:text-3xl bg-gradient-to-r from-white via-orange-500 to-orange-700 bg-clip-text text-transparent uppercase leading-none tracking-tighter">
                            Ray Burger
                        </h1>
                        <div className="flex flex-col items-start -mt-1">
                            <span className="bg-red-600 text-[12px] text-white px-2 py-1 rounded-md font-black animate-bounce shadow-[0_0_20px_rgba(220,38,38,0.8)]">V7-FINAL-VIRAL</span>
                            <span className="text-[8px] text-white/50 font-mono tracking-widest">{new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-orange-500 leading-none mt-1">SISTEMA PROTEGIDO</span>
                </div>
            </motion.div>
            <nav className="flex items-center space-x-2 md:space-x-3">
                {/* Mobile: Hamburger Menu */}
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="lg:hidden p-2 rounded-full bg-gray-800 hover:bg-orange-600 transition-colors"
                    aria-label="Abrir menú"
                >
                    <Menu className="w-6 h-6 text-white" />
                </button>

                {/* Desktop: Ranking y Ruleta */}
                <div className="hidden lg:flex items-center space-x-2">
                    {/* LEADERBOARD HIDDEN FOR PHASE 1 LAUNCH
                    <button
                        className={`${secondaryButtonClasses} flex !bg-orange-600/10 !border-orange-500/40 px-2 sm:px-4 hover:!bg-orange-600/20 active:scale-90`}
                        title="Ver Ranking La Carrera"
                        onClick={onOpenLeaderboard}
                    >
                        <Trophy className="w-5 h-5 sm:mr-1 text-orange-500 drop-shadow-[0_0_8px_rgba(234,88,12,0.5)]" />
                        <span className="sr-only sm:not-sr-only text-[10px] uppercase tracking-tighter">Ranking</span>
                    </button>
                    */}

                    <button
                        className={`${secondaryButtonClasses} flex !bg-purple-600/10 !border-purple-500/40 px-2 sm:px-4 hover:!bg-purple-600/20 active:scale-90 animate-pulse`}
                        title="Girar Ruleta de Premios"
                        onClick={onOpenRoulette}
                    >
                        <span className="text-lg mr-1 filter drop-shadow">🎰</span>
                        <span className="sr-only sm:not-sr-only text-[10px] uppercase tracking-tighter text-purple-400 font-bold">Ruleta</span>
                    </button>
                </div>

                {currentUser ? (
                    <div className="flex items-center space-x-2">
                        <AnimatePresence>
                            {activeOrder && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className={`hidden lg:flex px-3 py-1.5 rounded-full text-xs font-bold items-center gap-2 border transition-all
                                        ${activeOrder.status === 'pending'
                                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50 animate-pulse'
                                            : 'bg-green-500/10 text-green-500 border-green-500/50'}
                                    `}
                                    onClick={onOpenProfile}
                                >
                                    {activeOrder.status === 'pending' ? <Clock size={14} /> : <CheckCircle size={14} />}
                                    {activeOrder.status === 'pending' ? 'Pedido Pendiente' : 'Pedido Aceptado'}
                                </motion.button>
                            )}
                        </AnimatePresence>

                        <button
                            className={`${profileButtonClasses} px-2 md:px-5`}
                            aria-label="Perfil"
                            onClick={onOpenProfile}
                        >
                            <UserCircle className="w-5 h-5 md:mr-1 text-orange-400" aria-hidden="true" />
                            <div className="hidden md:block">
                                <span className="sr-only">Perfil de </span>
                                <span className="flex flex-col items-start leading-none gap-0.5">
                                    <span className="text-xs">Hola, {currentUser.name.split(' ')[0]}</span>
                                    {currentUser.role === 'admin' && <span className="text-[9px] text-purple-400 font-black uppercase tracking-widest bg-purple-900/50 px-1 rounded">ADMIN MODE</span>}
                                </span>
                            </div>
                        </button>

                        {currentUser.role === 'admin' && onOpenAdmin && (
                            <button
                                className={`${primaryButtonClasses} bg-purple-600 hover:bg-purple-700 border-purple-400 !px-4 shadow-[0_0_15px_rgba(147,51,234,0.5)]`}
                                onClick={onOpenAdmin}
                                title="Panel de Administrador"
                            >
                                <CheckCircle className="w-5 h-5 mr-1.5" />
                                <span className="font-black tracking-wide text-xs">ADMIN</span>
                            </button>
                        )}

                        <button
                            className={`${dangerButtonClasses} px-2 md:px-5`}
                            aria-label="Cerrar sesión"
                            onClick={onLogout}
                        >
                            <LogOut className="w-5 h-5 md:mr-1" aria-hidden="true" />
                            <span className="hidden md:inline">Salir</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <button
                            className={`${primaryButtonClasses} px-3 md:px-5`}
                            aria-label="Iniciar sesión"
                            onClick={onOpenLogin}
                        >
                            <LogIn className="w-5 h-5 md:mr-1" aria-hidden="true" />
                            <span className="hidden md:inline">Iniciar Sesión</span>
                        </button>
                        <button
                            className={`${secondaryButtonClasses} px-3 md:px-5`}
                            aria-label="Registrarse"
                            onClick={onOpenRegister}
                        >
                            <UserCircle className="w-5 h-5 md:mr-1" aria-hidden="true" />
                            <span className="hidden md:inline">Registrarse</span>
                        </button>
                    </>
                )}
                <button
                    className="group relative p-2 rounded-full bg-gray-800 hover:bg-orange-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 transform hover:scale-105"
                    aria-label="Ver carrito de compras"
                    onClick={onOpenCart}
                >
                    <ShoppingCart className="w-6 h-6 text-white group-hover:text-white" aria-hidden="true" />
                    {cartItemCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce" aria-live="polite">
                            {cartItemCount}
                        </span>
                    )}
                </button>
            </nav>

            {/* Mobile Menu Component */}
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                onOpenLeaderboard={onOpenLeaderboard || (() => { })}
                onOpenRoulette={onOpenRoulette || (() => { })}
            />
        </header>
    );
};

export default Header;
