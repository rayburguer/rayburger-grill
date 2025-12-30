import React, { useState } from 'react';
import { User, Order, Product } from '../../types';
import { useProducts } from '../../hooks/useProducts';
import { useAdmin } from '../../hooks/useAdmin';
import { useSurveys } from '../../hooks/useSurveys';
import {
    Plus, Edit, Trash2, X, BarChart3, Clock,
    Download, Search, RefreshCw, Upload, LogOut,
    Lightbulb, DollarSign, User as UserIcon,
    TrendingUp, ShoppingBag, Users
} from 'lucide-react';
import { useCloudSync } from '../../hooks/useCloudSync';
import { useSuggestions } from '../../hooks/useSuggestions';
// import { QuickPOS } from './QuickPOS'; // REMOVED redundancy
import { AdminBI } from './AdminBI';
import { CashRegisterReport } from './CashRegisterReport';
import { OrderManagement } from './OrderManagement';
import { persistence } from '../../utils/persistence';
import { useShift } from '../../hooks/useShift';
// import { supabase } from '../../lib/supabase'; // Unused after cleanup
import { hashPassword } from '../../utils/security';
import { normalizePhone } from '../../utils/helpers';

interface AdminDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    registeredUsers: User[];
    updateUsers: (users: User[]) => Promise<void>;
    tasaBs: number;
    onUpdateTasa: (newTasa: number) => Promise<void>;
    guestOrders: Order[];
    updateGuestOrders: (updatedOrders: Order[]) => Promise<void>;
    initialOrderId?: string; // For deep linking
    onShowToast: (msg: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    isOpen, onClose, registeredUsers, updateUsers,
    tasaBs, onUpdateTasa, guestOrders, updateGuestOrders, initialOrderId, onShowToast
}) => {
    const { products, addProduct, updateProduct, deleteProduct } = useProducts();
    const { suggestions, deleteSuggestion } = useSuggestions();
    const { isAdmin, loginAdmin, logoutAdmin } = useAdmin();
    const { getStats, surveys } = useSurveys();
    const { isSyncing, mergeDuplicates } = useCloudSync();
    const { localOrders, clearShift, exportShiftData } = useShift();
    void localOrders, clearShift, exportShiftData; // Tag as used if intended for later or just remove if not needed.
    // Actually, looking at the error TS6198: All destructured elements are unused.
    // I'll just remove the destructuring if they are truly unused.
    const [password, setPassword] = useState('');
    const [cashierName, setCashierName] = useState(() => localStorage.getItem('rayburger_cashier_name') || ''); // NEW: Persist cashier name
    const [activeTab, setActiveTab] = useState<'quick_pos' | 'stats' | 'marketing' | 'cashregister' | 'products' | 'orders' | 'customers' | 'suggestions'>('quick_pos');
    // const [redeemSearch, setRedeemSearch] = useState(''); // Unused
    // const [autoPullOnStart, setAutoPullOnStart] = useState(() => localStorage.getItem('rayburger_autopull_enabled') !== 'false'); // Unused
    const [isEditingCustomer, setIsEditingCustomer] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Partial<User>>({});
    const [showPasswords, setShowPasswords] = useState(false);

    // Deep Link: Auto-navigate based on URL params
    React.useEffect(() => {
        if (!isOpen) return;
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');

        if (tabParam && ['quick_pos', 'stats', 'products', 'orders', 'marketing'].includes(tabParam)) {
            setActiveTab(tabParam as any);
        } else if (initialOrderId && isAdmin) {
            setActiveTab('orders');
        }
    }, [initialOrderId, isAdmin, isOpen]);

    const handleLogin = () => {
        if (loginAdmin(password)) {
            if (cashierName.trim()) {
                localStorage.setItem('rayburger_cashier_name', cashierName.trim());
            }
        } else {
            onShowToast('❌ Contraseña incorrecta');
        }
    };

    const allOrders = [
        ...registeredUsers.flatMap(u => (u.orders || []).map(o => ({ ...o, userEmail: u.email, userName: u.name, isGuest: false }))),
        ...guestOrders.map(o => ({ ...o, userEmail: 'Invitado', userName: o.customerName || 'Invitado', isGuest: true }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    const pendingOrdersCount = allOrders.filter(o => !o.status || o.status === 'pending' || o.status === 'delivered').length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayApprovedOrders = allOrders.filter(o =>
        (o.status === 'approved' || o.status === 'delivered') &&
        o.timestamp >= todayStart.getTime()
    );
    const todayTotal = todayApprovedOrders.reduce((sum, o) => sum + o.totalUsd, 0);

    // NEW: Yesterday Total
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    const yesterdayApprovedOrders = allOrders.filter(o =>
        (o.status === 'approved' || o.status === 'delivered') &&
        o.timestamp >= yesterdayStart.getTime() &&
        o.timestamp < yesterdayEnd.getTime()
    );
    const yesterdayTotal = yesterdayApprovedOrders.reduce((sum, o) => sum + o.totalUsd, 0);

    const surveyStats = getStats();
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
    // Unused states removed

    // AUTO-PULL REMOVED (Satellite feature)

    // Removed unused handleSyncToCloud

    if (!isOpen) return null;

    // MOBILE EXIT BUTTON (Added for UX)
    const MobileExitButton = (
        <button
            onClick={onClose}
            className="lg:hidden fixed top-4 left-4 z-[300] p-2 bg-red-600/90 text-white rounded-full shadow-2xl border border-white/20 active:scale-95 transition-transform"
            aria-label="Cerrar Admin"
        >
            <X size={24} />
        </button>
    );

    if (!isAdmin) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md border border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-orange-500">Acceso Personal</h2>
                        <button onClick={onClose}><X className="text-gray-400 hover:text-white" /></button>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-400 text-xs mb-1">Nombre del Cajero / Turno</label>
                        <input
                            type="text"
                            placeholder="Ej. Pedro, Caja 1..."
                            className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-white focus:border-orange-500 outline-none"
                            value={cashierName}
                            onChange={(e) => setCashierName(e.target.value)}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-400 text-xs mb-1">Contraseña de Sistema</label>
                        <input
                            type="password"
                            placeholder="Clave Maestra"
                            className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-white focus:border-orange-500 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={!password || !cashierName}
                        className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded transition-colors"
                    >
                        Iniciar Turno
                    </button>

                    <p className="mt-4 text-center text-xs text-gray-500">
                        Cada venta quedará registrada a nombre de este usuario.
                    </p>
                </div>
            </div>
        );
    }

    const handleSaveProduct = () => {
        if (!currentProduct.name || !currentProduct.basePrice_usd) return;
        const productData = {
            ...currentProduct,
            id: currentProduct.id || Date.now(),
            basePrice_usd: Number(currentProduct.basePrice_usd),
            stockQuantity: currentProduct.stockQuantity ? Number(currentProduct.stockQuantity) : undefined
        } as Product;

        if (isEditing) {
            updateProduct(productData);
        } else {
            addProduct(productData);
        }
        setIsEditing(false);
        setCurrentProduct({});
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md overflow-y-auto">
            <div className="bg-gray-900 w-full min-h-screen lg:min-h-[auto] lg:max-w-6xl lg:rounded-2xl shadow-xl overflow-hidden flex flex-col pt-20 lg:pt-0">
                {MobileExitButton}
                {/* Header */}
                <div className="bg-gray-800 p-4 lg:p-6 flex flex-col sm:flex-row justify-between items-center border-b border-gray-700 gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl lg:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
                                    Ray Dashboard
                                </h2>
                                <span className="px-2 py-0.5 bg-green-900/50 text-green-400 text-[10px] lg:text-xs rounded-full border border-green-700">Premium</span>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Ayer:</span>
                                    <span className="text-xs font-bold text-blue-400 bg-blue-900/20 px-2 rounded border border-blue-800/50">
                                        ${yesterdayTotal.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Hoy:</span>
                                    <span className="text-xs font-bold text-green-400 bg-green-900/20 px-2 rounded border border-green-800/50 scale-110 origin-left">
                                        ${todayTotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex bg-gray-900/50 p-1 rounded-lg border border-gray-700">
                            <button
                                onClick={() => {
                                    const data = {
                                        users: localStorage.getItem('rayburger_users'),
                                        products: localStorage.getItem('rayburger_products'),
                                        guestOrders: localStorage.getItem('rayburger_guest_orders'),
                                        tasa: localStorage.getItem('rayburger_tasa')
                                    };
                                    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `rayburger_backup_${new Date().toISOString().split('T')[0]}.json`;
                                    a.click();
                                    persistence.recordBackup();
                                    onShowToast('✅ Respaldo descargado exitosamente');
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md transition-all flex items-center gap-1.5 shadow-lg"
                            >
                                <Download size={14} /> Backup
                            </button>
                            <button
                                onClick={onClose}
                                className="ml-2 px-3 py-1.5 bg-purple-900/80 hover:bg-purple-700 text-purple-100 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 border border-purple-700 shadow-lg"
                                title="Cerrar panel y navegar como cliente (sin perder sesión)"
                            >
                                <UserIcon size={14} /> Ver Tienda
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 bg-gray-700 hover:bg-red-900/50 rounded-full transition-colors text-white"><X size={20} /></button>
                    </div>
                </div>

                {/* Navbar */}
                <div className="flex border-b border-gray-700 bg-gray-800/50 overflow-x-auto hide-scrollbar">
                    {(['quick_pos', 'stats', 'marketing', 'cashregister', 'products', 'orders', 'customers', 'suggestions'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-none sm:flex-1 px-8 py-5 text-center font-bold tracking-tight transition-all whitespace-nowrap capitalize border-b-2 ${activeTab === tab ? 'text-orange-500 border-orange-500 bg-orange-500/5' : 'text-gray-400 border-transparent hover:text-white'}`}
                        >
                            <div className="flex flex-col items-center gap-1">
                                {tab === 'quick_pos' && <div className="bg-orange-600 text-white p-1 rounded-full mb-1"><Plus size={16} /></div>}
                                {tab === 'stats' && <BarChart3 className="w-5 h-5 mb-1" />}
                                {tab === 'cashregister' && <DollarSign className="w-5 h-5 mb-1" />}
                                {tab === 'products' && <Edit className="w-5 h-5 mb-1" />}
                                {tab === 'orders' && (
                                    <div className="relative">
                                        <Clock className={`w-5 h-5 mb-1 ${activeTab === 'orders' ? 'text-orange-500' : 'text-orange-400'}`} />
                                        {pendingOrdersCount > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border border-white"></span>
                                            </span>
                                        )}
                                    </div>
                                )}
                                {tab === 'customers' && <Search className="w-5 h-5 mb-1" />}
                                {tab === 'suggestions' && <Lightbulb className="w-5 h-5 mb-1" />}
                                {tab === 'marketing' && <TrendingUp className="w-5 h-5 mb-1 text-pink-400" />}
                                <span className="text-[10px] uppercase font-black">
                                    {tab === 'quick_pos' ? 'POS RÁPIDO' : tab === 'stats' ? 'Analytics' : tab === 'suggestions' ? 'BUZÓN' : tab === 'cashregister' ? 'CAJA' : tab}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* POS INFO BAR REMOVED */}
                {/* Mode Selector & Local Stats hidden for cleaner UI per user request */}
                <div className="hidden bg-gray-800 border-b border-gray-700 px-6 py-2 flex-col sm:flex-row justify-between items-center text-xs">
                    {/* ... content hidden ... */}
                </div>

                {/* Content */}
                <div className="p-0 flex-1 overflow-y-auto max-h-[75vh]">
                    {activeTab === 'quick_pos' && (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
                            <div className="w-24 h-24 bg-orange-600/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <Plus size={48} className="text-orange-500" />
                            </div>
                            <h2 className="text-3xl font-black text-white italic mb-4 uppercase tracking-tighter">Nueva Venta Manual</h2>
                            <p className="text-gray-400 max-w-md mb-8">
                                Registra pedidos telefónicos, presenciales o por WhatsApp usando la misma interfaz premium que el cliente.
                            </p>
                            <button
                                onClick={() => {
                                    window.open('/?mode=cashier', '_blank');
                                    onShowToast('🚀 Entrando a Modo Cajero...');
                                }}
                                className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-xl shadow-[0_0_30px_rgba(234,88,12,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                            >
                                <ShoppingBag size={24} />
                                IR A LA TIENDA (CAJERO)
                            </button>
                            <p className="mt-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                Los pedidos se guardarán vinculados a tu nombre: <span className="text-orange-500">{cashierName || 'Administrador'}</span>
                            </p>
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <div className="space-y-6 p-8">
                            <AdminBI orders={allOrders} />

                            {/* CUSTOMER ANALYTICS SECTION */}
                            <div className="space-y-6 mt-8">
                                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                    <span className="text-3xl">👥</span>
                                    Análisis de Clientes
                                </h2>

                                {(() => {
                                    // Filter out admins from all statistics
                                    const realCustomers = registeredUsers.filter(u => u.role !== 'admin');
                                    const posRegistered = realCustomers.filter(u => u.registeredVia === 'pos');
                                    const webRegistered = realCustomers.filter(u => !u.registeredVia || u.registeredVia === 'web');

                                    return (
                                        <>
                                            {/* Key Metrics Cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {/* Total Customers */}
                                                <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 p-6 rounded-xl border border-blue-700/30">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-blue-400 text-sm font-bold uppercase tracking-wider">Total Clientes</span>
                                                        <span className="text-2xl">👤</span>
                                                    </div>
                                                    <div className="text-4xl font-black text-white">{realCustomers.length}</div>
                                                    <div className="flex gap-2 mt-2 text-xs">
                                                        <span className="text-green-400">🏪 {posRegistered.length} POS</span>
                                                        <span className="text-blue-400">🌐 {webRegistered.length} Web</span>
                                                    </div>
                                                </div>

                                                {/* Total Points in Circulation */}
                                                <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/10 p-6 rounded-xl border border-orange-700/30">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-orange-400 text-sm font-bold uppercase tracking-wider">Dinero en Billeteras</span>
                                                        <span className="text-2xl">💰</span>
                                                    </div>
                                                    <div className="text-4xl font-black text-white">
                                                        ${realCustomers.reduce((sum, u) => sum + (u.walletBalance_usd || 0), 0).toFixed(2)}
                                                    </div>
                                                    <p className="text-orange-400/60 text-xs mt-1">Saldo a favor (clientes reales)</p>
                                                </div>

                                                {/* Points Awarded Today */}
                                                <div className="bg-gradient-to-br from-green-900/30 to-green-800/10 p-6 rounded-xl border border-green-700/30">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-green-400 text-sm font-bold uppercase tracking-wider">Recompensas Hoy</span>
                                                        <span className="text-2xl">🎁</span>
                                                    </div>
                                                    <div className="text-4xl font-black text-white">
                                                        ${(() => {
                                                            const today = new Date().toDateString();
                                                            const realCustomerEmails = new Set(realCustomers.map(u => u.email));
                                                            return allOrders
                                                                .filter(o => o.status === 'approved' &&
                                                                    new Date(o.timestamp).toDateString() === today &&
                                                                    realCustomerEmails.has(o.userEmail))
                                                                .reduce((sum, o) => sum + (o.rewardsEarned_usd || 0), 0);
                                                        })().toFixed(2)}
                                                    </div>
                                                    <p className="text-green-400/60 text-xs mt-1">Otorgado hoy en cashback</p>
                                                </div>

                                                {/* New Registrations Today */}
                                                <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 p-6 rounded-xl border border-purple-700/30">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-purple-400 text-sm font-bold uppercase tracking-wider">Nuevos Hoy</span>
                                                        <span className="text-2xl">🆕</span>
                                                    </div>
                                                    <div className="text-4xl font-black text-white">
                                                        {(() => {
                                                            const today = new Date().toDateString();
                                                            return realCustomers.filter(u => u.registrationDate && new Date(u.registrationDate).toDateString() === today).length;
                                                        })()}
                                                    </div>
                                                    <p className="text-purple-400/60 text-xs mt-1">Registros hoy</p>
                                                </div>
                                            </div>

                                            {/* Registration Source Breakdown */}
                                            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                    📍 Origen de Registros
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-6 rounded-xl border border-green-700/30">
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-5xl">🏪</div>
                                                            <div className="flex-1">
                                                                <div className="text-3xl font-black text-green-500">{posRegistered.length}</div>
                                                                <p className="text-green-400 font-bold">Registrados desde POS</p>
                                                                <p className="text-green-400/60 text-xs mt-1">Invitados en persona por ti</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-6 rounded-xl border border-blue-700/30">
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-5xl">🌐</div>
                                                            <div className="flex-1">
                                                                <div className="text-3xl font-black text-blue-500">{webRegistered.length}</div>
                                                                <p className="text-blue-400 font-bold">Registrados desde Web</p>
                                                                <p className="text-blue-400/60 text-xs mt-1">Llegaron orgánicamente</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-400">Efectividad de invitaciones en persona:</span>
                                                        <span className="text-orange-400 font-bold text-lg">
                                                            {realCustomers.length > 0 ? ((posRegistered.length / realCustomers.length) * 100).toFixed(1) : 0}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}

                                {/* Registration Trends */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Last 7 Days Registrations */}
                                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            📈 Registros Últimos 7 Días
                                        </h3>
                                        <div className="space-y-2">
                                            {(() => {
                                                const realCustomers = registeredUsers.filter(u => u.role !== 'admin');
                                                const last7Days = Array.from({ length: 7 }, (_, i) => {
                                                    const date = new Date();
                                                    date.setDate(date.getDate() - i);
                                                    return date;
                                                }).reverse();

                                                const registrationsByDay = last7Days.map(date => {
                                                    const dateStr = date.toDateString();
                                                    const count = realCustomers.filter(u =>
                                                        u.registrationDate && new Date(u.registrationDate).toDateString() === dateStr
                                                    ).length;
                                                    return {
                                                        date,
                                                        dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
                                                        dateLabel: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
                                                        count
                                                    };
                                                });

                                                const maxCount = Math.max(...registrationsByDay.map(d => d.count), 1);

                                                return registrationsByDay.map((day, idx) => (
                                                    <div key={idx} className="flex items-center gap-3">
                                                        <span className="text-gray-400 text-xs w-16 capitalize">{day.dayName} {day.dateLabel}</span>
                                                        <div className="flex-1 bg-gray-900 rounded-full h-6 overflow-hidden">
                                                            <div
                                                                className="bg-gradient-to-r from-blue-600 to-blue-400 h-full flex items-center justify-end pr-2 transition-all"
                                                                style={{ width: `${(day.count / maxCount) * 100}%` }}
                                                            >
                                                                {day.count > 0 && <span className="text-white text-xs font-bold">{day.count}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>

                                    {/* Best Day for Marketing */}
                                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            🎯 Mejor Día para Publicar
                                        </h3>
                                        {(() => {
                                            const realCustomers = registeredUsers.filter(u => u.role !== 'admin');
                                            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                                            const registrationsByDayOfWeek = Array(7).fill(0);

                                            realCustomers.forEach(u => {
                                                if (u.registrationDate) {
                                                    const dayOfWeek = new Date(u.registrationDate).getDay();
                                                    registrationsByDayOfWeek[dayOfWeek]++;
                                                }
                                            });

                                            const maxDay = registrationsByDayOfWeek.indexOf(Math.max(...registrationsByDayOfWeek));
                                            const maxCount = registrationsByDayOfWeek[maxDay];

                                            return (
                                                <div className="space-y-4">
                                                    <div className="bg-gradient-to-r from-orange-900/30 to-orange-800/10 p-6 rounded-xl border border-orange-700/30 text-center">
                                                        <div className="text-5xl mb-2">🔥</div>
                                                        <div className="text-3xl font-black text-orange-500">{dayNames[maxDay]}</div>
                                                        <p className="text-orange-400/60 text-sm mt-2">{maxCount} registros históricos</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {dayNames.map((day, idx) => (
                                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                                <span className={`${idx === maxDay ? 'text-orange-400 font-bold' : 'text-gray-400'}`}>
                                                                    {day}
                                                                </span>
                                                                <span className={`${idx === maxDay ? 'text-orange-400 font-bold' : 'text-gray-500'}`}>
                                                                    {registrationsByDayOfWeek[idx]}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Conversion Rate */}
                                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        💰 Tasa de Conversión
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {(() => {
                                            const realCustomers = registeredUsers.filter(u => u.role !== 'admin');
                                            const usersWithOrders = realCustomers.filter(u => u.orders && u.orders.length > 0).length;
                                            const conversionRate = realCustomers.length > 0 ? (usersWithOrders / realCustomers.length * 100).toFixed(1) : 0;
                                            const avgOrdersPerCustomer = realCustomers.length > 0
                                                ? (allOrders.filter(o => !o.isGuest && realCustomers.some(u => u.email === o.userEmail)).length / realCustomers.length).toFixed(1)
                                                : 0;

                                            return (
                                                <>
                                                    <div className="text-center">
                                                        <div className="text-4xl font-black text-green-500">{conversionRate}%</div>
                                                        <p className="text-gray-400 text-sm mt-1">Clientes que compran</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-4xl font-black text-blue-500">{avgOrdersPerCustomer}</div>
                                                        <p className="text-gray-400 text-sm mt-1">Pedidos promedio/cliente</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-4xl font-black text-purple-500">{usersWithOrders}</div>
                                                        <p className="text-gray-400 text-sm mt-1">Clientes activos</p>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Age Demographics */}
                                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        🎂 Demografía por Edad
                                    </h3>
                                    {(() => {
                                        const realCustomers = registeredUsers.filter(u => u.role !== 'admin');
                                        const customersWithBirthday = realCustomers.filter(u => u.birthDate);

                                        if (customersWithBirthday.length === 0) {
                                            return (
                                                <div className="text-center py-8 text-gray-400">
                                                    <p className="text-4xl mb-2">📊</p>
                                                    <p>Aún no hay datos de cumpleaños</p>
                                                    <p className="text-xs mt-2">Invita a tus clientes a compartir su fecha de nacimiento</p>
                                                </div>
                                            );
                                        }

                                        const getAge = (birthDate: string) => {
                                            const today = new Date();
                                            const birth = new Date(birthDate);
                                            let age = today.getFullYear() - birth.getFullYear();
                                            const monthDiff = today.getMonth() - birth.getMonth();
                                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                                                age--;
                                            }
                                            return age;
                                        };

                                        const ageGroups = {
                                            'Gen Z (18-27)': 0,
                                            'Millennials (28-43)': 0,
                                            'Gen X (44-59)': 0,
                                            'Boomers (60+)': 0
                                        };

                                        customersWithBirthday.forEach(u => {
                                            const age = getAge(u.birthDate!);
                                            if (age >= 18 && age <= 27) ageGroups['Gen Z (18-27)']++;
                                            else if (age >= 28 && age <= 43) ageGroups['Millennials (28-43)']++;
                                            else if (age >= 44 && age <= 59) ageGroups['Gen X (44-59)']++;
                                            else if (age >= 60) ageGroups['Boomers (60+)']++;
                                        });

                                        const maxCount = Math.max(...Object.values(ageGroups), 1);
                                        const dominantGroup = Object.entries(ageGroups).reduce((a, b) => a[1] > b[1] ? a : b)[0];

                                        // Birthday this month
                                        const currentMonth = new Date().getMonth();
                                        const birthdaysThisMonth = customersWithBirthday.filter(u => {
                                            const birthMonth = new Date(u.birthDate!).getMonth();
                                            return birthMonth === currentMonth;
                                        });

                                        return (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-400 mb-3">Distribución por Generación</h4>
                                                        <div className="space-y-2">
                                                            {Object.entries(ageGroups).map(([group, count]) => (
                                                                <div key={group} className="flex items-center gap-3">
                                                                    <span className={`text-xs w-32 ${group === dominantGroup ? 'text-orange-400 font-bold' : 'text-gray-400'}`}>
                                                                        {group}
                                                                    </span>
                                                                    <div className="flex-1 bg-gray-900 rounded-full h-6 overflow-hidden">
                                                                        <div
                                                                            className={`h-full flex items-center justify-end pr-2 transition-all ${group === dominantGroup
                                                                                ? 'bg-gradient-to-r from-orange-600 to-orange-400'
                                                                                : 'bg-gradient-to-r from-gray-600 to-gray-500'
                                                                                }`}
                                                                            style={{ width: `${(count / maxCount) * 100}%` }}
                                                                        >
                                                                            {count > 0 && <span className="text-white text-xs font-bold">{count}</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="mt-4 p-3 bg-orange-900/20 rounded-lg border border-orange-700/30">
                                                            <p className="text-orange-400 text-sm font-bold">🎯 Grupo Dominante:</p>
                                                            <p className="text-orange-500 text-lg font-black">{dominantGroup}</p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-400 mb-3">Cumpleaños Este Mes 🎉</h4>
                                                        {birthdaysThisMonth.length > 0 ? (
                                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                                                {birthdaysThisMonth.map(u => {
                                                                    const day = new Date(u.birthDate!).getDate();
                                                                    return (
                                                                        <div key={u.email} className="bg-gradient-to-r from-purple-900/30 to-purple-800/10 p-3 rounded-lg border border-purple-700/30">
                                                                            <p className="text-white font-bold">{u.name} {u.lastName || ''}</p>
                                                                            <p className="text-purple-400 text-xs">🎂 Día {day}</p>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-8 text-gray-500">
                                                                <p className="text-2xl mb-2">📅</p>
                                                                <p className="text-sm">No hay cumpleaños este mes</p>
                                                            </div>
                                                        )}
                                                        <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-gray-400">Datos de cumpleaños:</span>
                                                                <span className="text-white font-bold">
                                                                    {customersWithBirthday.length} / {realCustomers.length}
                                                                </span>
                                                            </div>
                                                            <div className="mt-2 bg-gray-800 rounded-full h-2 overflow-hidden">
                                                                <div
                                                                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-full"
                                                                    style={{ width: `${(customersWithBirthday.length / realCustomers.length) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                                    <h3 className="text-lg font-bold text-white mb-4">Ajustes Rápidos</h3>
                                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                                        <label className="block text-gray-400 text-sm mb-2">Tasa del Día (Bs / $)</label>
                                        <div className="flex gap-4 items-center">
                                            <input
                                                type="number"
                                                value={tasaBs}
                                                onChange={(e) => onUpdateTasa(Number(e.target.value))}
                                                className="bg-gray-800 border-2 border-orange-500/20 rounded-xl p-3 text-white w-32 text-xl font-black focus:border-orange-500 outline-none transition-all"
                                            />
                                            <span className="text-gray-400 text-sm">Bs por cada $1</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                                        Calidad del Servicio
                                        <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20">
                                            {surveyStats?.totalSurveys || 0} Encuestas
                                        </span>
                                    </h3>

                                    {surveyStats ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-6 bg-gray-900 p-4 rounded-xl border border-gray-800">
                                                <div className="text-4xl font-black text-orange-500">{surveyStats.overall}</div>
                                                <div>
                                                    <p className="text-white font-bold">Puntaje General</p>
                                                    <p className="text-gray-500 text-xs">Basado en todas las categorías</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                                    <p className="text-xs text-gray-500 uppercase font-black">Comida</p>
                                                    <p className="text-xl font-bold text-white">{surveyStats.averages.foodQuality}</p>
                                                </div>
                                                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                                    <p className="text-xs text-gray-500 uppercase font-black">Servicio</p>
                                                    <p className="text-xl font-bold text-white">{surveyStats.averages.service}</p>
                                                </div>
                                                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                                    <p className="text-xs text-gray-500 uppercase font-black">Precio</p>
                                                    <p className="text-xl font-bold text-white">{surveyStats.averages.price}</p>
                                                </div>
                                                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                                    <p className="text-xs text-gray-500 uppercase font-black">Entrega</p>
                                                    <p className="text-xl font-bold text-white">{surveyStats.averages.deliveryTime}</p>
                                                </div>
                                            </div>

                                            {/* Recent Reviews List */}
                                            <div className="mt-6">
                                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Reseñas Recientes</h4>
                                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                    {(surveys || [])
                                                        .slice()
                                                        .sort((a, b) => b.timestamp - a.timestamp)
                                                        .map((s: any) => (
                                                            <div key={s.id} className="bg-gray-900 p-3 rounded-xl border border-gray-800 text-sm">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className="text-orange-500 font-bold">{s.userId || 'Invitado'}</span>
                                                                    <span className="text-[10px] text-gray-600">{new Date(s.timestamp).toLocaleDateString()}</span>
                                                                </div>
                                                                {s.comments && <p className="text-gray-300 italic mb-2">"{s.comments}"</p>}
                                                                <div className="flex gap-2 text-[10px] text-gray-500">
                                                                    <span>C: {s.ratings.foodQuality}</span>
                                                                    <span>S: {s.ratings.service}</span>
                                                                    <span>P: {s.ratings.price}</span>
                                                                    <span>E: {s.ratings.deliveryTime}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-gray-900 rounded-xl border border-gray-800 text-gray-500">
                                            Aún no hay encuestas suficientes
                                        </div>
                                    )}

                                    <button onClick={logoutAdmin} className="mt-6 text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <LogOut size={14} /> Cerrar Sesión Admin
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <OrderManagement
                            registeredUsers={registeredUsers}
                            updateUsers={updateUsers}
                            guestOrders={guestOrders}
                            updateGuestOrders={updateGuestOrders}
                            highlightOrderId={initialOrderId}
                            allProducts={products}
                        />
                    )}

                    {activeTab === 'products' && (
                        <div className="space-y-6">
                            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mb-8">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    {isEditing ? <Edit size={16} /> : <Plus size={16} />}
                                    {isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto'}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <input
                                        className="bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-orange-500 outline-none"
                                        placeholder="Nombre"
                                        value={currentProduct.name || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                    />
                                    <input
                                        className="bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-orange-500 outline-none"
                                        placeholder="Precio (USD)"
                                        type="number"
                                        value={currentProduct.basePrice_usd || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, basePrice_usd: Number(e.target.value) })}
                                    />
                                    {/* Stock field hidden for Day 1 simplicity */}
                                    <input
                                        className="bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-orange-500 outline-none lg:col-span-2"
                                        placeholder="Categoría"
                                        value={currentProduct.category || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                                    />
                                    <div className="flex flex-col gap-2">
                                        <label className="text-gray-400 text-xs">Imagen</label>
                                        <div className="flex items-center gap-2">
                                            <label className={`flex-1 cursor-pointer bg-gray-900 border border-gray-700 hover:border-orange-500 rounded p-3 text-white flex items-center justify-center gap-2 ${currentProduct.isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                                                {currentProduct.isUploading ? <RefreshCw className="animate-spin" size={16} /> : <Upload size={16} />}
                                                <span className="text-xs">{currentProduct.isUploading ? 'Subiendo...' : 'Subir Foto'}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    disabled={currentProduct.isUploading}
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            // Set uploading state locally (hack using partial product)
                                                            setCurrentProduct(prev => ({ ...prev, isUploading: true }));

                                                            try {
                                                                const { uploadProductImage } = await import('../../utils/uploadImage');
                                                                const publicUrl = await uploadProductImage(file);

                                                                if (publicUrl) {
                                                                    setCurrentProduct(prev => ({ ...prev, image: publicUrl }));
                                                                }
                                                            } catch (err) {
                                                                console.error(err);
                                                            } finally {
                                                                setCurrentProduct(prev => ({ ...prev, isUploading: undefined }));
                                                            }
                                                        }
                                                    }}
                                                />
                                            </label>
                                            {currentProduct.image && <img src={currentProduct.image} className="w-12 h-12 rounded object-cover" />}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    {isEditing && <button onClick={() => { setIsEditing(false); setCurrentProduct({}); }} className="text-gray-400 hover:text-white">Cancelar</button>}
                                    <button onClick={handleSaveProduct} className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-bold shadow-lg shadow-orange-900/20">
                                        {isEditing ? 'Guardar' : 'Crear'}
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {products.map(p => (
                                    <div key={p.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between group hover:bg-gray-750 border border-transparent hover:border-gray-700">
                                        <div className="flex items-center gap-4">
                                            <img src={p.image} className="w-12 h-12 rounded object-cover bg-gray-900" />
                                            <div>
                                                <h4 className="font-bold text-white">{p.name}</h4>
                                                <div className="flex gap-2 items-center text-xs">
                                                    <span className="text-gray-400">{p.category}</span>
                                                    <span className="text-orange-400 font-bold">${p.basePrice_usd.toFixed(2)}</span>
                                                    {p.stockQuantity !== undefined && (
                                                        <span className={`px-1.5 py-0.5 rounded ${p.stockQuantity < 5 ? 'bg-red-900/30 text-red-500' : 'bg-gray-900 text-gray-500'}`}>
                                                            Stock: {p.stockQuantity}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setIsEditing(true); setCurrentProduct(p); }} className="p-2 text-blue-400 hover:bg-blue-900/30 rounded"><Edit size={18} /></button>
                                            <button onClick={() => confirm('¿Eliminar?') && deleteProduct(p.id)} className="p-2 text-red-400 hover:bg-red-900/30 rounded"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'customers' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                                        <h3 className="font-bold text-orange-500 mb-4">Registro POS</h3>
                                        <form onSubmit={(e: any) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.target);
                                            const phone = formData.get('phone') as string;
                                            const normalizedPhone = normalizePhone(phone);
                                            const name = formData.get('name') as string;
                                            const lastName = formData.get('lastName') as string;
                                            const birthDate = formData.get('birthDate') as string;

                                            if (!normalizedPhone) return;

                                            // PREVENT DUPLICATES
                                            const exists = registeredUsers.find(u =>
                                                normalizePhone(u.phone) === normalizedPhone ||
                                                u.email === normalizedPhone + "@ray.pos"
                                            );

                                            if (exists) {
                                                onShowToast(`⚠️ El cliente ya existe: ${exists.name}`);
                                                return;
                                            }

                                            const newUser: User = {
                                                email: normalizedPhone + "@ray.pos",
                                                phone: normalizedPhone,
                                                name: name || "Cliente",
                                                lastName: lastName || undefined,
                                                birthDate: birthDate || undefined,
                                                walletBalance_usd: 2, // Welcome Bonus $2
                                                lifetimeSpending_usd: 0,
                                                referralCode: 'POS-' + Date.now(),
                                                role: 'customer',
                                                orders: [],
                                                loyaltyTier: 'Bronze',
                                                passwordHash: '1234',
                                                registrationDate: Date.now(),
                                                registeredVia: 'pos',
                                                points: 0
                                            };
                                            updateUsers([...registeredUsers, newUser]);
                                            e.target.reset();
                                            onShowToast('✅ Cliente registrado desde POS');
                                        }} className="space-y-3">
                                            <input
                                                name="phone"
                                                placeholder="Teléfono (11 dígitos) *"
                                                required
                                                pattern="[0-9]{11}"
                                                maxLength={11}
                                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white placeholder-gray-500"
                                            />
                                            <input
                                                name="name"
                                                placeholder="Nombre"
                                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white placeholder-gray-500"
                                            />
                                            <input
                                                name="lastName"
                                                placeholder="Apellido (recomendado)"
                                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white placeholder-gray-500"
                                            />
                                            <div>
                                                <label className="block text-gray-400 text-xs mb-1">Cumpleaños (opcional)</label>
                                                <input
                                                    name="birthDate"
                                                    type="date"
                                                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                                                />
                                            </div>
                                            <button className="w-full bg-orange-600 hover:bg-orange-700 py-2 rounded font-bold transition-colors">
                                                Inscribir Cliente
                                            </button>
                                        </form>
                                    </div>
                                </div>
                                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-white">Base de Datos ({registeredUsers.length})</h3>
                                        <button
                                            onClick={() => {
                                                const csv = "Nombre,Telefono,Saldo,Email\n" + registeredUsers.map(u => `${u.name},${u.phone},$${(u.walletBalance_usd || 0).toFixed(2)},${u.email}`).join("\n");
                                                const blob = new Blob([csv], { type: 'text/csv' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `clientes_rayburger_${new Date().toISOString().split('T')[0]}.csv`;
                                                a.click();
                                                onShowToast('📊 Lista de clientes descargada (CSV)');
                                            }}
                                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] font-black uppercase rounded border border-gray-600 transition-all flex items-center gap-1"
                                        >
                                            <Download size={12} /> Exportar CSV
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {registeredUsers.map(u => (
                                            <div key={u.phone} className="bg-gray-900/50 p-3 rounded border border-gray-800 flex justify-between items-center group">
                                                <div
                                                    className="cursor-pointer hover:bg-white/5 p-1 rounded transition-all flex-1"
                                                    onClick={() => {
                                                        setCustomerToEdit(u);
                                                        setIsEditingCustomer(true);
                                                    }}
                                                >
                                                    <p className="font-bold text-white text-sm">
                                                        {(['Cliente', 'Cliente Nuevo', 'Invitado'].includes(u.name) || !u.name) ? <span className="text-orange-500/50 italic">Sin nombre (Tocar para editar)</span> : `${u.name} ${u.lastName || ''}`}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-mono">+58 {normalizePhone(u.phone)}</p>
                                                    {showPasswords && (
                                                        <p className="text-[10px] text-orange-400 mt-1">
                                                            Clave: <span className="bg-orange-900/20 px-1 rounded">{u.passwordHash === '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4' ? '1234' : '••••••'}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-right mr-2">
                                                        <p className="text-orange-500 font-bold text-sm">${(u.walletBalance_usd || 0).toFixed(2)}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setCustomerToEdit(u);
                                                            setIsEditingCustomer(true);
                                                        }}
                                                        className="p-2 text-orange-500 hover:bg-orange-900/20 rounded transition-all"
                                                        title="Editar Nombre/Apellido"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            className="text-[10px] font-black uppercase text-gray-500 hover:text-orange-500"
                                        >
                                            {showPasswords ? 'Ocultar Claves' : 'Ver Claves (Modo Gestión)'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {activeTab === 'customers' && (
                        <div className="mt-6 p-6 bg-purple-900/10 border border-purple-500/20 rounded-2xl">
                            <h4 className="text-purple-500 font-bold mb-4 flex items-center gap-2">
                                🧬 Unificación de Clientes
                            </h4>
                            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                                Detecta clientes duplicados por número de teléfono, suma sus saldos en una cuenta maestra y elimina los registros sobrantes.
                            </p>
                            <button
                                onClick={async () => {
                                    if (confirm('🧬 ¿Fusionar clientes duplicados?\n\nEsto agrupará saldos y pedidos de usuarios con el mismo teléfono.\nEsta acción no se puede deshacer.')) {
                                        const result = await mergeDuplicates();
                                        if (result.error) {
                                            onShowToast('❌ Error: ' + result.error);
                                        } else {
                                            if (result.merged && result.merged > 0) {
                                                onShowToast(`✅ Éxito: ${result.merged} cuentas fusionadas y ${result.deleted} duplicados eliminados.`);
                                                setTimeout(() => window.location.reload(), 2000);
                                            } else {
                                                onShowToast('✨ No se encontraron duplicados para fusionar.');
                                            }
                                        }
                                    }
                                }}
                                disabled={isSyncing}
                                className="w-full sm:w-auto px-6 py-3 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/30 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                            >
                                {isSyncing ? <RefreshCw className="animate-spin" size={16} /> : <Users size={16} />}
                                Fusionar Duplicados
                            </button>
                        </div>
                    )}


                    {activeTab === 'suggestions' && (
                        <div className="space-y-6">
                            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Lightbulb className="text-yellow-500" /> Buzón de Sugerencias
                                </h3>

                                {suggestions.length === 0 ? (
                                    <div className="text-center py-20 text-gray-500 italic">
                                        No hay sugerencias todavía. ¡Las ideas aparecerán aquí!
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {suggestions.map(s => (
                                            <div key={s.id} className="bg-gray-900 p-5 rounded-2xl border border-gray-800 flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <p className="text-white text-lg leading-relaxed mb-3">"{s.content}"</p>
                                                    <div className="flex items-center gap-3 text-xs">
                                                        <span className="bg-gray-800 px-2 py-1 rounded text-orange-400 font-bold">{s.name || 'Anónimo'}</span>
                                                        <span className="text-gray-500">{s.phone}</span>
                                                        <span className="text-gray-600">• {new Date(s.timestamp).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => confirm('¿Eliminar idea?') && deleteSuggestion(s.id)}
                                                    className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'marketing' && (
                        <div className="space-y-6">
                            {/* FOUNDER CAMPAIGN SECTION */}
                            <div className="bg-gradient-to-br from-orange-900/20 to-gray-800 p-8 rounded-2xl border border-orange-700/30 shadow-2xl">
                                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                    🏆 Campaña FUNDADOR
                                </h3>
                                <p className="text-gray-400 text-sm mb-6">
                                    Mensaje listo para enviar a tus 50 clientes más cercanos. Copia y pega en WhatsApp.
                                </p>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Registros FUNDADOR</p>
                                        <p className="text-3xl font-black text-orange-400">
                                            {registeredUsers.filter(u => u.referredByCode?.toUpperCase() === 'FUNDADOR').length}
                                        </p>
                                    </div>
                                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Multiplicador</p>
                                        <p className="text-3xl font-black text-orange-400">3x</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-70">Ayer</p>
                                        <div className="text-xl font-black text-blue-400 leading-none">${yesterdayTotal.toFixed(2)}</div>
                                    </div>
                                    <div className="w-px h-8 bg-gray-700 mx-2" />
                                    <div className="flex flex-col">
                                        <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Hoy</p>
                                        <div className="text-xl font-black text-white leading-none">${todayTotal.toFixed(2)}</div>
                                    </div>
                                </div>

                                {/* Message Template */}
                                <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 mb-4">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-3">📱 Mensaje para WhatsApp:</p>
                                    <div className="bg-black/30 p-4 rounded-lg font-mono text-sm text-gray-300 whitespace-pre-wrap border border-gray-800">
                                        {`Hola [Nombre], ¡Ray Burger está de vuelta! 🍔🔥

Como eres cliente antiguo, quiero que seas FUNDADOR de nuestro nuevo sistema de lealtad.

🎁 TU CÓDIGO EXCLUSIVO: FUNDADOR

BENEFICIOS FUNDADOR:
✅ 3x Puntos en TODAS tus compras por 30 días
✅ Cada 100 puntos = $1 en descuentos o productos gratis

PERO AQUÍ VIENE LO MEJOR:
💰 Por cada amigo que traigas con tu código:
   - Él gana 2x Puntos en su primera compra
   - TÚ ganas 2% de CASHBACK de por vida de lo que él compre
   
Ejemplo real:
- Tu amigo gasta $100 → Tú recibes $2 en tu cuenta
- Traes 10 amigos activos → Ingresos pasivos cada mes 💸
- Tus puntos → Los canjeas por burgers, combos o descuentos

Link para registrarte: rayburgergrill.com.ve

Cuando te registres, copia tu código personal y compártelo.
Mientras más amigos traigas, más ganas.

¿Listo para ser Fundador?`}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                    <button
                                        onClick={() => {
                                            const message = `Hola [Nombre], ¡Ray Burger está de vuelta! 🍔🔥\n\nComo eres cliente antiguo, quiero que seas FUNDADOR de nuestro nuevo sistema de lealtad.\n\n🎁 TU CÓDIGO EXCLUSIVO: FUNDADOR\n\nBENEFICIOS FUNDADOR:\n✅ 3x Puntos en TODAS tus compras por 30 días\n✅ Cada 100 puntos = $1 en descuentos o productos gratis\n\nPERO AQUÍ VIENE LO MEJOR:\n💰 Por cada amigo que traigas con tu código:\n   - Él gana 2x Puntos en su primera compra\n   - TÚ ganas 2% de CASHBACK de por vida de lo que él compre\n   \nEjemplo real:\n- Tu amigo gasta $100 → Tú recibes $2 en tu cuenta\n- Traes 10 amigos activos → Ingresos pasivos cada mes 💸\n- Tus puntos → Los canjeas por burgers, combos o descuentos\n\nLink para registrarte: rayburgergrill.com.ve\n\nCuando te registres, copia tu código personal y compártelo.\nMientras más amigos traigas, más ganas.\n\n¿Listo para ser Fundador?`;
                                            navigator.clipboard.writeText(message);
                                            onShowToast('📋 Mensaje copiado al portapapeles');
                                        }}
                                        className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        📋 Copiar Texto
                                    </button>
                                    <button
                                        onClick={() => {
                                            const message = `Hola, ¡Ray Burger está de vuelta! 🍔🔥\n\nComo eres cliente antiguo, quiero que seas FUNDADOR de nuestro nuevo sistema de lealtad.\n\n🎁 TU CÓDIGO EXCLUSIVO: *FUNDADOR*\n\nRegístrate aquí para ganar puntos:\n👉 https://rayburgergrill.com.ve/?ref=FUNDADOR\n\n¡Te esperamos!`;
                                            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                                        }}
                                        className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/40"
                                    >
                                        📲 Enviar por WhatsApp
                                    </button>
                                </div>
                            </div>

                            {/* VIP LINK SECTION (Existing) */}
                            <div className="bg-gradient-to-br from-purple-900/20 to-gray-800 p-8 rounded-2xl border border-purple-700/30 shadow-2xl">
                                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                    🎁 Link VIP (2x Puntos)
                                </h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    Comparte este enlace especial para que nuevos clientes se registren con doble puntos en su primera compra.
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value="https://rayburgergrill.com.ve/?promo=VIP_RAY"
                                        readOnly
                                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText('https://rayburgergrill.com.ve/?promo=VIP_RAY');
                                            onShowToast('🔗 Link VIP copiado');
                                        }}
                                        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all"
                                    >
                                        Copiar
                                    </button>
                                </div>
                            </div>

                            {/* RETENTION MARKETING (Existing) */}
                            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <TrendingUp className="text-pink-500" /> Marketing de Retención
                                </h3>
                                <p className="text-gray-400 text-sm mb-6">
                                    A continuación, los clientes que no han pedido en más de 7 días. ¡Envíales un recordatorio con un beneficio!
                                </p>

                                <div className="space-y-4">
                                    {registeredUsers
                                        .filter(u => {
                                            if (u.role === 'admin') return false;
                                            if (u.orders.length === 0) return true; // Never ordered
                                            const lastOrder = Math.max(...u.orders.map(o => o.timestamp));
                                            const daysSince = (Date.now() - lastOrder) / (1000 * 60 * 60 * 24);
                                            return daysSince > 7;
                                        })
                                        .map(u => (
                                            <div key={u.phone} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between gap-4">
                                                <div>
                                                    <p className="font-bold text-white">{u.name}</p>
                                                    <p className="text-gray-500 text-xs">{u.phone}</p>
                                                    <p className="text-pink-400 text-xs mt-1">
                                                        {u.orders.length === 0 ? 'Sin pedidos previos' : 'Última compra hace ' + Math.floor((Date.now() - Math.max(...u.orders.map(o => o.timestamp))) / (1000 * 60 * 60 * 24)) + ' días'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const updated = registeredUsers.map(user => user.phone === u.phone ? { ...user, nextPurchaseMultiplier: 2 } : user);
                                                            updateUsers(updated);
                                                            const msg = `🍔 ¡Felicidades! Te acabo de enviar un REGALO en Ray Burger Grill. 🎁✨\n\nTe activamos *DOBLE PUNTUACIÓN (2x)* en tu próxima compra para que canjees comida gratis más rápido. 🍟🔥\n\n¡Aprovecha aquí!: https://rayburgergrill.com.ve`;
                                                            window.open(`https://wa.me/${u.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                                            onShowToast(`✅ Beneficio 2X enviado a ${u.name}`);
                                                        }}
                                                        className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                                                    >
                                                        📲 Enviar 2X por WhatsApp
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cashregister' && (
                        <CashRegisterReport orders={allOrders} tasaBs={tasaBs} />
                    )}


                </div>
            </div>

            {/* CUSTOMER EDIT MODAL */}
            {isEditingCustomer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-gray-800 border border-gray-700 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <UserIcon size={20} className="text-orange-500" /> Editar Cliente
                            </h3>
                            <button onClick={() => setIsEditingCustomer(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase mb-2 tracking-widest">Nombre</label>
                                <input
                                    type="text"
                                    value={customerToEdit.name || ''}
                                    onChange={(e) => setCustomerToEdit({ ...customerToEdit, name: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-orange-500 transition-all font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase mb-2 tracking-widest">Apellido</label>
                                <input
                                    type="text"
                                    value={customerToEdit.lastName || ''}
                                    onChange={(e) => setCustomerToEdit({ ...customerToEdit, lastName: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-orange-500 transition-all font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase mb-2 tracking-widest">Teléfono (Solo Lectura)</label>
                                <input
                                    type="text"
                                    value={customerToEdit.phone || ''}
                                    readOnly
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-500 outline-none font-mono cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase mb-2 tracking-widest">Saldo en Billetera</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={customerToEdit.walletBalance_usd || 0}
                                        onChange={(e) => setCustomerToEdit({ ...customerToEdit, walletBalance_usd: parseFloat(e.target.value) || 0 })}
                                        className="flex-1 bg-gray-900 border border-gray-700 rounded-xl p-3 text-orange-500 outline-none focus:border-orange-500 transition-all font-black text-xl"
                                    />
                                    <div className="text-gray-500 text-xs font-bold w-20">
                                        USD
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-700 flex flex-col gap-3">
                                <p className="text-[10px] text-gray-500 text-center px-4">
                                    Si el cliente olvidó su clave, puedes resetearla a <span className="text-orange-500 font-bold">1234</span>
                                </p>
                                <button
                                    onClick={async () => {
                                        if (confirm(`¿Resetear la clave de ${customerToEdit.name} a "1234"?`)) {
                                            const hash = await hashPassword('1234');
                                            setCustomerToEdit({ ...customerToEdit, passwordHash: hash });
                                            onShowToast('🔑 Clave reseteada a 1234. ¡No olvides guardar!');
                                        }
                                    }}
                                    className="w-full py-2 border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    Resetear Clave a 1234
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsEditingCustomer(false)}
                                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    if (!customerToEdit.name) {
                                        onShowToast('❌ El nombre es obligatorio');
                                        return;
                                    }
                                    const updatedUsers = registeredUsers.map(u => u.phone === customerToEdit.phone ? ({ ...u, ...customerToEdit } as User) : u);
                                    await updateUsers(updatedUsers);
                                    setIsEditingCustomer(false);
                                    onShowToast('✅ Cliente actualizado correctamente');
                                }}
                                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-900/20"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default AdminDashboard;

