import React, { useState } from 'react';
import { User, Order } from '../../types';
import { useProducts } from '../../hooks/useProducts';
import { useAdmin } from '../../hooks/useAdmin';
import { useSurveys } from '../../hooks/useSurveys';
import {
    Edit, X, BarChart3, Clock,
    Download, Search,
    Lightbulb, User as UserIcon,
    TrendingUp
} from 'lucide-react';
import { useCloudSync } from '../../hooks/useCloudSync';
import { useSuggestions } from '../../hooks/useSuggestions';
import { useShift } from '../../hooks/useShift';
import { CustomerManagement } from './CustomerManagement';
import { OrderManagement } from './OrderManagement';
import { ProductManagement } from './ProductManagement';
// import { CashRegisterReport } from './CashRegisterReport';
import { MarketingManagement } from './MarketingManagement';
import { SuggestionsManagement } from './SuggestionsManagement';
import { StatsManagement } from './StatsManagement';
import { persistence } from '../../utils/persistence';

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
    useShift();
    const [password, setPassword] = useState('');
    const [cashierName, setCashierName] = useState(() => localStorage.getItem('rayburger_cashier_name') || ''); // NEW: Persist cashier name
    // SIMPLIFIED: Default to 'orders' and removed POS/CashRegister complexity
    const [activeTab, setActiveTab] = useState<'stats' | 'marketing' | 'products' | 'orders' | 'customers' | 'suggestions'>('orders');

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
    const todayTotal = todayApprovedOrders.reduce((sum, o) => sum + (o.totalUsd || (o as any).total_usd || 0), 0);

    // NEW: Yesterday Total
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    const yesterdayApprovedOrders = allOrders.filter(o =>
        (o.status === 'approved' || o.status === 'delivered') &&
        o.timestamp >= yesterdayStart.getTime() &&
        o.timestamp < yesterdayEnd.getTime()
    );
    const yesterdayTotal = yesterdayApprovedOrders.reduce((sum, o) => sum + (o.totalUsd || (o as any).total_usd || 0), 0);

    const surveyStats = getStats();
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
                                        ${(yesterdayTotal || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Hoy:</span>
                                    <span className="text-xs font-bold text-green-400 bg-green-900/20 px-2 rounded border border-green-800/50 scale-110 origin-left">
                                        ${(todayTotal || 0).toFixed(2)}
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

                {/* Navbar - SIMPLIFIED */}
                <div className="flex border-b border-gray-700 bg-gray-800/50 overflow-x-auto hide-scrollbar">
                    {(['orders', 'products', 'customers', 'stats', 'marketing', 'suggestions'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-none sm:flex-1 px-8 py-5 text-center font-bold tracking-tight transition-all whitespace-nowrap capitalize border-b-2 ${activeTab === tab ? 'text-orange-500 border-orange-500 bg-orange-500/5' : 'text-gray-400 border-transparent hover:text-white'}`}
                        >
                            <div className="flex flex-col items-center gap-1">
                                {tab === 'stats' && <BarChart3 className="w-5 h-5 mb-1" />}
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
                                    {tab === 'stats' ? 'Analytics' : tab === 'suggestions' ? 'BUZÓN' : tab === 'orders' ? 'PEDIDOS' : tab === 'products' ? 'MENÚ' : tab === 'customers' ? 'CLIENTES' : tab}
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
                    {/* QUICK POS REMOVED - User Pivot Strategy */}
                    {/* activeTab === 'quick_pos' && (
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
                    )*/}

                    {activeTab === 'stats' && (
                        <StatsManagement
                            registeredUsers={registeredUsers}
                            allOrders={allOrders}
                            tasaBs={tasaBs}
                            onUpdateTasa={onUpdateTasa}
                            surveyStats={surveyStats}
                            surveys={surveys}
                            logoutAdmin={logoutAdmin}
                        />
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
                        <ProductManagement
                            products={products}
                            addProduct={addProduct}
                            updateProduct={updateProduct}
                            deleteProduct={deleteProduct}
                            onShowToast={onShowToast}
                        />
                    )}

                    {activeTab === 'customers' && (
                        <CustomerManagement
                            registeredUsers={registeredUsers}
                            updateUsers={updateUsers}
                            onShowToast={onShowToast}
                            mergeDuplicates={mergeDuplicates}
                            isSyncing={isSyncing}
                        />
                    )}


                    {activeTab === 'suggestions' && (
                        <SuggestionsManagement
                            suggestions={suggestions}
                            deleteSuggestion={deleteSuggestion}
                        />
                    )}

                    {activeTab === 'marketing' && (
                        <MarketingManagement
                            registeredUsers={registeredUsers}
                            updateUsers={updateUsers}
                            allOrders={allOrders}
                            yesterdayTotal={yesterdayTotal}
                            todayTotal={todayTotal}
                            onShowToast={onShowToast}
                        />
                    )}

                    {/* activeTab === 'cashregister' block removed */}


                </div>
            </div>

            {/* END MODAL */}
        </div>
    );
};


export default AdminDashboard;

