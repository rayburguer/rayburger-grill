import { ShoppingCart, LogIn, LogOut, UserCircle, Clock, CheckCircle, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Order } from '../../types';

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
    activeOrder?: Order | null;
}

const Header: React.FC<HeaderProps> = ({
    cartItemCount,
    onOpenCart,
    currentUser,
    onOpenRegister,
    onOpenLogin,
    onLogout,
    onOpenAdmin,
    onOpenLeaderboard,
    activeOrder
}) => {
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
                            <span className="bg-blue-600 text-[9px] text-white px-2 py-0.5 rounded-sm font-bold animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.8)]">v5</span>
                            <span className="text-[7px] text-gray-500 font-mono tracking-widest">{new Date().toISOString().split('T')[0]}</span>
                        </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-500 leading-none mt-1">Grill & Sabor Premium</span>
                </div>
            </motion.div>
            <nav className="flex items-center space-x-2 md:space-x-3">
                <button
                    className={`${secondaryButtonClasses} flex !bg-orange-600/10 !border-orange-500/40 px-2 sm:px-4 hover:!bg-orange-600/20 active:scale-90`}
                    title="Ver Ranking La Carrera"
                    onClick={onOpenLeaderboard}
                >
                    <Trophy className="w-5 h-5 sm:mr-1 text-orange-500 drop-shadow-[0_0_8px_rgba(234,88,12,0.5)]" />
                    <span className="sr-only sm:not-sr-only text-[10px] uppercase tracking-tighter">Ranking</span>
                </button>

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
                                <span className="sr-only">Perfil de </span>Hola, {currentUser.name.split(' ')[0]}
                            </div>
                        </button>

                        {currentUser.role === 'admin' && onOpenAdmin && (
                            <button
                                className={`${primaryButtonClasses} px-2 md:px-5 border-orange-400`}
                                onClick={onOpenAdmin}
                            >
                                <CheckCircle className="w-5 h-5 md:mr-1" />
                                <span className="hidden md:inline">Panel Admin</span>
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
        </header>
    );
};

export default Header;
