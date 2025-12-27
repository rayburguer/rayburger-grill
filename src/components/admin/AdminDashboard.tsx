import React, { useState, useEffect } from 'react';
import { User, Order, Product } from '../../types';
import { useProducts } from '../../hooks/useProducts';
import { useAdmin } from '../../hooks/useAdmin';
import { useSurveys } from '../../hooks/useSurveys';
import {
    Plus, Edit, Trash2, X, BarChart3, Clock,
    Download, Upload, Search, Gift, Cloud, RefreshCw,
    CheckCircle2, LogOut, Lightbulb, DollarSign, User as UserIcon,
    TrendingUp
} from 'lucide-react';
import { useCloudSync } from '../../hooks/useCloudSync';
import { useSuggestions } from '../../hooks/useSuggestions';
import { QuickPOS } from './QuickPOS';
import { AdminBI } from './AdminBI';
import { CashRegisterReport } from './CashRegisterReport';
import { OrderManagement } from './OrderManagement';
import { persistence } from '../../utils/persistence';
import { useShift } from '../../hooks/useShift';
import { supabase } from '../../lib/supabase'; // Import Supabase client directly

interface AdminDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    registeredUsers: User[];
    updateUsers: (users: User[]) => void;
    tasaBs: number;
    onUpdateTasa: (newTasa: number) => void;
    guestOrders: Order[];
    updateGuestOrders: (updatedOrders: Order[]) => void;
    initialOrderId?: string; // For deep linking
    onShowToast: (msg: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    isOpen, onClose, registeredUsers, updateUsers,
    tasaBs, onUpdateTasa, guestOrders, updateGuestOrders, initialOrderId, onShowToast
}) => {
    const { products, addProduct, updateProduct, deleteProduct, resetToSample } = useProducts();
    const { suggestions, deleteSuggestion } = useSuggestions();
    const { isAdmin, loginAdmin, logoutAdmin } = useAdmin();
    const { getStats } = useSurveys();
    const { isSyncing, pullFromCloud, wipeCloudData } = useCloudSync();
    const { localOrders, addLocalOrder, clearShift, exportShiftData, isSatelliteMode, setIsSatelliteMode } = useShift();
    const [password, setPassword] = useState('');
    const [cashierName, setCashierName] = useState(() => localStorage.getItem('rayburger_cashier_name') || ''); // NEW: Persist cashier name
    const [activeTab, setActiveTab] = useState<'quick_pos' | 'stats' | 'marketing' | 'cashregister' | 'products' | 'orders' | 'redeem' | 'customers' | 'suggestions' | 'cloud'>('quick_pos');
    const [redeemSearch, setRedeemSearch] = useState('');
    const [redeemAmount, setRedeemAmount] = useState<number>(0);

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
    const [isUploadingCloud, setIsUploadingCloud] = useState(false); // NEW State

    // AUTO-PULL on Mount (Master Mode Only)
    useEffect(() => {
        if (!isSatelliteMode) {
            console.log("🔄 Auto-pulling cloud data for Master Terminal...");
            pullFromCloud().then(res => {
                if (!res.error) console.log("✅ Auto-pull success");
            });
        }
    }, []); // Run once on mount

    // NEW: Handle One-Click Sync for Satellite
    const handleSyncToCloud = async () => {
        if (localOrders.length === 0 && registeredUsers.length === 0) return onShowToast('⚠️ No hay datos locales para subir');
        if (!confirm('¿Subir ventas y clientes locales a la nube principal?')) return;

        setIsUploadingCloud(true);
        let syncedCount = 0;
        let syncedUsersCount = 0;

        try {
            // 1. Get ALL current users to prevent overwrites (Fresh Fetch)
            const { data: remoteUsers, error: usersError } = await supabase.from('rb_users').select('*');
            if (usersError) throw new Error('Error conectando con base de datos de usuarios');

            // Map for quick lookup
            const userMap = new Map((remoteUsers || []).map(u => [u.phone, u]));

            // 2. Prepare patches
            const newGuestOrders: any[] = [];
            const userUpdates = new Map<string, User>(); // phone -> UpdatedUser

            // 2a. Sync LOCALLY REGISTERED USERS (Even if they have no orders)
            // This fixes "ni siquiera aparecen los cliente que registre"
            for (const localUser of registeredUsers) {
                const remoteUser = userMap.get(localUser.phone);

                // Logic: If local user has MORE points or MORE orders than remote, assume local is newer
                // OR if remote doesn't exist.
                if (!remoteUser) {
                    userUpdates.set(localUser.phone, localUser);
                    syncedUsersCount++;
                } else {
                    // Start with remote state
                    let mergedUser = { ...remoteUser };
                    let changed = false;

                    // Merge Orders (avoid duplicates)
                    const existingOrderIds = new Set(mergedUser.orders?.map((o: any) => o.orderId) || []);
                    const localUserOrders = localUser.orders || [];

                    for (const o of localUserOrders) {
                        if (!existingOrderIds.has(o.orderId)) {
                            mergedUser.orders = [...(mergedUser.orders || []), o];
                            mergedUser.points = (mergedUser.points || 0) + (o.pointsEarned || 0);
                            existingOrderIds.add(o.orderId);
                            changed = true;
                        }
                    }

                    if (changed) {
                        userUpdates.set(localUser.phone, mergedUser);
                        syncedUsersCount++;
                    }
                }
            }

            // 2b. Sync LOCAL ORDERS (Anonymous & Registered)
            for (const order of localOrders) {
                if (order.customerPhone) {
                    // It's a REGISTERED USER order
                    // We likely already handled this in 2a, but let's double check 
                    // if the order is in `localOrders` but somehow not in `registeredUsers` (rare edge case)
                    let user = userUpdates.get(order.customerPhone) || userMap.get(order.customerPhone);

                    if (!user) {
                        // Creating NEW user from Satellite Order
                        user = {
                            email: `${order.customerPhone}@pos.ray`,
                            phone: order.customerPhone,
                            name: order.customerName || 'Cliente Satélite',
                            role: 'customer',
                            loyaltyTier: 'Bronze',
                            points: 0, // NO Welcome Bonus for sync/recovery to avoid accidents
                            orders: [],
                            passwordHash: '1234',
                            referralCode: `POS-SAT-${Date.now()}-${Math.random().toString(36).substring(7)}`
                        } as User;
                    }

                    // Check if order already exists in user history
                    const orderExists = user.orders?.some((o: any) => o.orderId === order.orderId);
                    if (!orderExists) {
                        const points = order.pointsEarned || 0;
                        user = {
                            ...user,
                            points: (user.points || 0) + points,
                            orders: [...(user.orders || []), order]
                        };
                        userUpdates.set(order.customerPhone, user);
                        syncedCount++;
                    }

                } else {
                    // Anonymous Order -> Add to rb_orders
                    newGuestOrders.push({
                        ...order,
                        id: order.orderId // Map back for Supabase
                    });
                    syncedCount++;
                }
            }

            // 3. EXECUTE BATCH UPDATES
            // 3a. Update Users
            if (userUpdates.size > 0) {
                const usersToPush = Array.from(userUpdates.values());
                const { error: pushError } = await supabase.from('rb_users').upsert(usersToPush, { onConflict: 'email' });
                if (pushError) throw pushError;
            }

            // 3b. Update Guest Orders
            if (newGuestOrders.length > 0) {
                const { error: guestError } = await supabase.from('rb_orders').upsert(newGuestOrders, { onConflict: 'id' });
                if (guestError) throw guestError;
            }

            onShowToast(`✅ ÉXITO: ${syncedCount} ventas subidas a la Nube Master.`);

            // Optional: Clear local shift automatically?
            if (confirm(`Se subieron ${syncedCount} ventas. ¿Limpiar la lista local para empezar turno nuevo?`)) {
                clearShift();
            }

        } catch (err: any) {
            console.error(err);
            onShowToast(`❌ Error subiendo: ${err.message}`);
        } finally {
            setIsUploadingCloud(false);
        }
    };

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
                            <button
                                onClick={resetToSample}
                                className="ml-2 px-3 py-1.5 bg-red-900/80 hover:bg-red-700 text-red-100 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 border border-red-700 shadow-lg"
                                title="Borrar menú actual y restaurar el original"
                            >
                                <Trash2 size={14} /> Restaurar Menú
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 bg-gray-700 hover:bg-red-900/50 rounded-full transition-colors text-white"><X size={20} /></button>
                    </div>
                </div>

                {/* Navbar */}
                <div className="flex border-b border-gray-700 bg-gray-800/50 overflow-x-auto hide-scrollbar">
                    {(['quick_pos', 'stats', 'marketing', 'cashregister', 'products', 'orders', 'redeem', 'customers', 'suggestions', 'cloud'] as const).map(tab => (
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
                                {tab === 'redeem' && <Gift className="w-5 h-5 mb-1" />}
                                {tab === 'customers' && <Search className="w-5 h-5 mb-1" />}
                                {tab === 'suggestions' && <Lightbulb className="w-5 h-5 mb-1" />}
                                {tab === 'marketing' && <TrendingUp className="w-5 h-5 mb-1 text-pink-400" />}
                                {tab === 'cloud' && <Cloud className="w-5 h-5 mb-1 text-blue-400" />}
                                <span className="text-[10px] uppercase font-black">
                                    {tab === 'quick_pos' ? 'POS RÁPIDO' : tab === 'stats' ? 'Analytics' : tab === 'suggestions' ? 'Ideas' : tab === 'cashregister' ? 'CAJA' : tab}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* POS INFO BAR (Mode Selector & Local Stats) */}
                <div className="bg-gray-800 border-b border-gray-700 px-6 py-2 flex flex-col sm:flex-row justify-between items-center text-xs">
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                            <button
                                onClick={() => setIsSatelliteMode(false)}
                                className={`px-3 py-1 rounded-md font-bold transition-all ${!isSatelliteMode ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Maestro
                            </button>
                            <button
                                onClick={() => setIsSatelliteMode(true)}
                                className={`px-3 py-1 rounded-md font-bold transition-all ${isSatelliteMode ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Satélite (Offline)
                            </button>
                        </div>
                        <span className={`font-bold ${isSatelliteMode ? 'text-blue-400' : 'text-green-400'}`}>
                            {isSatelliteMode ? '📦 Trabajando Localmente' : '☁️ Sincronización en Nube'}
                        </span>
                    </div>

                    {isSatelliteMode && (
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                            <span className="text-gray-400 hidden sm:inline">Ventas Turno: <b className="text-white">{localOrders.length}</b></span>
                            <button
                                onClick={handleSyncToCloud}
                                disabled={isUploadingCloud}
                                className="px-2 sm:px-3 py-1.5 sm:py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-all flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs shadow-lg animate-pulse"
                            >
                                <Cloud size={12} className="shrink-0" />
                                <span className="truncate">{isUploadingCloud ? 'Subiendo...' : '☁️ SUBIR VENTAS AHORA'}</span>
                            </button>
                            <button
                                onClick={() => {
                                    const base64 = exportShiftData();
                                    const msg = `🧾 *Turno Ray Burger*\nEquipo: ${cashierName || 'POS'}\nVentas: ${localOrders.length}\nTotal: $${localOrders.reduce((s, o) => s + o.totalUsd, 0).toFixed(2)}\n\nCódigo de Importación:\n${base64}`;
                                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                    onShowToast('📋 Reporte enviado a WhatsApp');
                                }}
                                className="px-2 sm:px-3 py-1.5 sm:py-1 bg-green-600 hover:bg-green-500 text-white rounded font-bold transition-all flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs shadow-lg"
                            >
                                <RefreshCw size={12} className="shrink-0" /> <span className="truncate">Cerrar y Exportar</span>
                            </button>
                            <button onClick={clearShift} className="text-red-500 hover:text-red-400 p-1 bg-red-900/10 rounded" title="Limpiar Turno">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ) || (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        const input = prompt('Pegue el código de exportación del satélite aquí:');
                                        if (input) {
                                            try {
                                                const data = JSON.parse(atob(input));
                                                if (data.orders && Array.isArray(data.orders)) {
                                                    let importedCount = 0;
                                                    let pointsAddedCount = 0;
                                                    let skippedCount = 0;
                                                    let newUsersCount = 0;

                                                    const newGuestOrders = [...guestOrders];
                                                    let currentUsers = [...registeredUsers];

                                                    // Helper to check duplicates
                                                    const isDuplicate = (id: string) => {
                                                        const inGuests = newGuestOrders.some(o => o.orderId === id);
                                                        const inUsers = currentUsers.some(u => u.orders?.some(o => o.orderId === id));
                                                        return inGuests || inUsers;
                                                    };

                                                    data.orders.forEach((order: Order) => {
                                                        // IDEMPOTENCY CHECK
                                                        if (isDuplicate(order.orderId)) {
                                                            skippedCount++;
                                                            return;
                                                        }

                                                        importedCount++;
                                                        const existingUser = order.customerPhone ? currentUsers.find(u => u.phone === order.customerPhone) : null;

                                                        if (existingUser) {
                                                            // Update existing user: points + order
                                                            const isAdmin = existingUser.role === 'admin';
                                                            const pointsToSum = isAdmin ? 0 : (order.pointsEarned || 0);

                                                            const updatedUser = {
                                                                ...existingUser,
                                                                points: (existingUser.points || 0) + pointsToSum,
                                                                orders: [...(existingUser.orders || []), order]
                                                            };
                                                            currentUsers = currentUsers.map(u => u.email === existingUser.email ? updatedUser : u);
                                                            if (pointsToSum > 0) pointsAddedCount++;
                                                        } else if (order.customerPhone) {
                                                            // CREACIÓN AUTOMÁTICA DE CLIENTE SI NO EXISTE
                                                            const newUser: User = {
                                                                email: `${order.customerPhone}@pos.ray`,
                                                                phone: order.customerPhone,
                                                                name: order.customerName || 'Cliente Importado',
                                                                role: 'customer',
                                                                loyaltyTier: 'Bronze',
                                                                points: 50 + (order.pointsEarned || 0), // Bono bienvenida + lo que compró
                                                                orders: [order],
                                                                passwordHash: '1234',
                                                                referralCode: `RB-IMP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                                                                referredByCode: 'FUNDADOR'
                                                            };
                                                            currentUsers.push(newUser);
                                                            newUsersCount++;
                                                        } else {
                                                            // Add to guest orders
                                                            newGuestOrders.unshift(order);
                                                        }
                                                    });

                                                    updateUsers(currentUsers);
                                                    updateGuestOrders(newGuestOrders);
                                                    onShowToast(`✅ ${importedCount} ventas. (+${newUsersCount} clientes nuevos creados)`);
                                                }
                                            } catch (e) {
                                                console.error('Import error:', e);
                                                onShowToast('❌ Código de importación inválido');
                                            }
                                        }
                                    }}
                                    className="px-2 sm:px-3 py-1.5 sm:py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold transition-all flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs"
                                >
                                    <Upload size={12} className="shrink-0" /> <span className="truncate">Importar Turno</span>
                                </button>
                            </div>
                        )}
                </div>

                {/* Content */}
                <div className="p-0 flex-1 overflow-y-auto max-h-[75vh]">
                    {activeTab === 'quick_pos' && (
                        <QuickPOS
                            products={products}
                            tasaBs={tasaBs}
                            cashierName={cashierName || 'Admin'}
                            onProcessOrder={async (orderData) => {
                                // Business Logic for POS Rewards
                                const existingUser = orderData.customerPhone ? registeredUsers.find(u => u.phone === orderData.customerPhone) : null;
                                const isAdminBuyer = existingUser?.role === 'admin';

                                const newOrder: Order = {
                                    ...orderData,
                                    orderId: `POS-${Date.now()}`,
                                    timestamp: Date.now(),
                                    // HONESTY RULE: Admins get 0 points in POS
                                    pointsEarned: isAdminBuyer ? 0 : Math.floor(orderData.totalUsd),
                                    status: orderData.status || 'approved'
                                };

                                let whatsappMessage = '';

                                if (orderData.customerPhone) {
                                    if (existingUser) {
                                        // Update existing user points
                                        const updatedUser = {
                                            ...existingUser,
                                            points: (existingUser.points || 0) + (newOrder.pointsEarned || 0),
                                            orders: [...(existingUser.orders || []), newOrder]
                                        };
                                        updateUsers(registeredUsers.map(u => u.email === existingUser.email ? updatedUser : u));

                                        if (isAdminBuyer) {
                                            onShowToast(`👔 Admin detectado: Venta registrada (sin puntos)`);
                                        } else {
                                            onShowToast(`🌟 ${newOrder.pointsEarned} puntos sumados a ${existingUser.name}`);
                                        }

                                        // Standard Receipt for existing customers
                                        const totalBs = (orderData.totalUsd * tasaBs).toFixed(2);
                                        whatsappMessage = `🧾 *Recibo Ray Burger*\n\nGracias por tu compra de $${orderData.totalUsd.toFixed(2)} (${totalBs} Bs).\n\n¡Disfruta tu pedido! 🍔\n\n*Saldo Actual:* ${updatedUser.points} puntos.`;

                                    } else {
                                        // New Customer - Invitation Flow
                                        const newUser: User = {
                                            email: `${orderData.customerPhone}@pos.ray`,
                                            phone: orderData.customerPhone,
                                            name: 'Cliente Nuevo',
                                            role: 'customer',
                                            loyaltyTier: 'Bronze',
                                            points: 50 + (newOrder.pointsEarned || 0), // Welcome bonus + purchase
                                            orders: [newOrder],
                                            passwordHash: '1234', // Temp password
                                            referralCode: `RB-POS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                                            referredByCode: 'FUNDADOR' // Auto-tag as Founder lead for tracking
                                        };
                                        updateUsers([...registeredUsers, newUser]);
                                        onShowToast(`🎉 ¡Cliente nuevo registrado! (+50 pts bono)`);

                                        // VIRAL INVITATION Message
                                        const totalBs = (orderData.totalUsd * tasaBs).toFixed(2);
                                        whatsappMessage = `🍔 ¡Bienvenido a Ray Burger!\n\nAcabamos de registrar tu compra de $${orderData.totalUsd.toFixed(2)} (${totalBs} Bs).\n\n🎁 *TE REGALAMOS $50* de bienvenida en puntos para tu próxima compra.\n\nRegístrate aquí para ver tus puntos y ganar más:\n👉 https://rayburgergrill.com.ve/?ref=FUNDADOR\n\n¡Gracias por elegirnos! 🔥`;
                                    }

                                    // Trigger WhatsApp
                                    const whatsappUrl = `https://wa.me/${orderData.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
                                    window.open(whatsappUrl, '_blank');
                                } else {
                                    // Anonymous Order
                                    if (isSatelliteMode) {
                                        addLocalOrder(newOrder);
                                    } else {
                                        updateGuestOrders([newOrder, ...guestOrders]);
                                    }
                                    onShowToast('✅ Venta anónima registrada');
                                }

                                // Satellite special: Always save locally even if registration fails
                                if (isSatelliteMode && orderData.customerPhone) {
                                    addLocalOrder(newOrder);
                                }
                            }}
                        />
                    )}

                    {activeTab === 'stats' && (
                        <div className="space-y-6 p-8">
                            <AdminBI orders={allOrders} />

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
                                    <h3 className="text-lg font-bold text-white mb-4">Calidad del Servicio</h3>
                                    <div className="flex items-center gap-6 bg-gray-900 p-4 rounded-xl border border-gray-800">
                                        <div className="text-4xl font-black text-orange-500">{surveyStats?.averages.foodQuality || 'N/A'}</div>
                                        <div>
                                            <p className="text-white font-bold">Puntaje Promedio</p>
                                            <p className="text-gray-500 text-xs">Basado en encuestas</p>
                                        </div>
                                    </div>
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
                                    <button
                                        onClick={async () => {
                                            await resetToSample();
                                        }}
                                        disabled={isSyncing}
                                        className="mr-auto px-4 py-2 border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 rounded text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                                        {isSyncing ? 'Sincronizando...' : 'Cargar Menú Oficial'}
                                    </button>
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
                                                        <span className={`px - 1.5 py - 0.5 rounded ${p.stockQuantity < 5 ? 'bg-red-900/30 text-red-500' : 'bg-gray-900 text-gray-500'} `}>
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
                                            const phone = new FormData(e.target).get('phone') as string;
                                            if (!phone) return;
                                            const newUser: User = {
                                                email: phone + "@ray.pos", phone, name: (new FormData(e.target).get('name') as string) || "Cliente",
                                                points: 50, // Welcome Bonus for POS registration too!
                                                referralCode: 'POS-' + Date.now(), role: 'customer', orders: [], loyaltyTier: 'Bronze', passwordHash: '1234'
                                            };
                                            updateUsers([...registeredUsers, newUser]);
                                            e.target.reset();
                                        }} className="space-y-4">
                                            <input name="phone" placeholder="Teléfono" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
                                            <input name="name" placeholder="Nombre" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
                                            <button className="w-full bg-orange-600 py-2 rounded font-bold">Inscribir</button>
                                        </form>
                                    </div>
                                </div>
                                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-white">Base de Datos ({registeredUsers.length})</h3>
                                        <button
                                            onClick={() => {
                                                const csv = "Nombre,Telefono,Puntos,Email\n" + registeredUsers.map(u => `${u.name},${u.phone},${u.points},${u.email}`).join("\n");
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
                                            <div key={u.phone} className="bg-gray-900/50 p-3 rounded border border-gray-800 flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-white text-sm">{u.name}</p>
                                                    <p className="text-[10px] text-gray-500">{u.phone}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-orange-500 font-bold text-sm">{u.points} pts</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'redeem' && (
                        <div className="space-y-6">
                            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                                <div className="relative mb-6">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        placeholder="Buscar por teléfono..."
                                        value={redeemSearch}
                                        onChange={e => setRedeemSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white outline-none focus:border-orange-500"
                                    />
                                </div>
                                {(() => {
                                    const user = registeredUsers.find(u => u.phone.includes(redeemSearch) && redeemSearch.length > 3);
                                    if (!user) return <p className="text-center text-gray-500 py-10 italic">Ingresa el teléfono del cliente para canjear</p>;
                                    return (
                                        <div className="space-y-4 animate-in fade-in duration-300">
                                            <div className="flex justify-between items-center bg-gray-900 p-4 rounded-lg">
                                                <div>
                                                    <h4 className="font-bold text-white">{user.name}</h4>
                                                    <p className="text-orange-500 text-2xl font-black">{user.points} <span className="text-xs font-normal">puntos</span></p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">Saldo Cashback</p>
                                                    <p className="text-green-400 font-bold">${(user.cashbackBalance_usd || 0).toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="Puntos a canjear"
                                                    className="flex-1 bg-gray-900 border border-gray-700 rounded p-3 text-white"
                                                    onChange={e => setRedeemAmount(Number(e.target.value))}
                                                />
                                                <button
                                                    onClick={() => {
                                                        if (redeemAmount > 0 && redeemAmount <= user.points) {
                                                            updateUsers(registeredUsers.map(u => u.phone === user.phone ? { ...u, points: u.points - redeemAmount } : u));
                                                            setRedeemAmount(0);
                                                            onShowToast(`✅ Canje exitoso de ${redeemAmount} puntos`);
                                                        }
                                                    }}
                                                    className="px-6 bg-orange-600 rounded-lg font-bold"
                                                >Canjear</button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {activeTab === 'suggestions' && (
                        <div className="space-y-6">
                            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Lightbulb className="text-yellow-500" /> Ideas de Clientes
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


                    {activeTab === 'cloud' && <CloudSyncSection onShowToast={onShowToast} />}
                </div>
            </div>
        </div>
    );
};

const CloudSyncSection: React.FC<{ onShowToast: (msg: string) => void }> = ({ onShowToast }) => {
    const { isSyncing, lastSync, migrateAllToCloud, pullFromCloud } = useCloudSync();
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <Cloud className="text-blue-400" /> Sincronización Cloud
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Última Sincro</p>
                        <p className="text-white">{lastSync ? new Date(lastSync).toLocaleString() : 'Nunca'}</p>
                    </div>
                </div>
                <button
                    onClick={async () => {
                        setStatus('idle');
                        const results = await migrateAllToCloud();
                        if (results.some(r => r.error)) {
                            setStatus('error');
                            onShowToast('❌ Error en la sincronización. Verifica tus credenciales.');
                        } else {
                            setStatus('success');
                            onShowToast('✅ Datos sincronizados con la nube correctamente.');
                        }
                    }}
                    disabled={isSyncing}
                    className={`w-full py-4 rounded-xl font-black text-lg uppercase transition-all flex items-center justify-center gap-3
                        ${isSyncing ? 'bg-gray-700' : status === 'success' ? 'bg-green-600' : status === 'error' ? 'bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {isSyncing ? <><RefreshCw className="animate-spin" /> Sincronizando...</> : status === 'success' ? <><CheckCircle2 /> ¡Protegido!</> : status === 'error' ? '❌ Error' : 'Iniciar Migración Cloud'}
                </button>

                <div className="pt-4 border-t border-gray-700">
                    <h4 className="text-white font-bold mb-2 flex items-center gap-2"><Download size={16} className="text-orange-400" /> Descargar de la Nube</h4>
                    <p className="text-gray-400 text-xs mb-4">Usa esto si hiciste cambios en otro dispositivo (ej. celular) y no los ves aquí.</p>
                    <button
                        onClick={async () => {
                            if (confirm('⚠️ ¿Estás seguro? Esto reemplazará tus datos locales con lo que hay en la nube.')) {
                                setStatus('idle');
                                const result = await pullFromCloud();
                                if (result.error) {
                                    setStatus('error');
                                    onShowToast('❌ Error al descargar: ' + result.error);
                                } else {
                                    onShowToast('✅ Datos actualizados desde la nube. Recargando...');
                                    setTimeout(() => window.location.reload(), 1500);
                                }
                            }
                        }}
                        disabled={isSyncing}
                        className="w-full py-3 bg-gray-700 hover:bg-orange-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        {isSyncing ? <RefreshCw className="animate-spin" /> : <Download size={18} />}
                        Descargar Cambios
                    </button>
                </div>

                <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                    <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">💡 ¿Cómo sincronizar 2 dispositivos?</h4>
                    <ol className="text-xs text-gray-400 space-y-2 list-decimal ml-4">
                        <li>En el dispositivo con los cambios: Pulsa <b className="text-white">"Iniciar Migración Cloud"</b>.</li>
                        <li>En el dispositivo donde quieres ver los datos: Pulsa <b className="text-white">"Descargar Cambios"</b>.</li>
                        <li><span className="text-white font-bold">¡Listo!</span> Los datos se habrán fusionado correctamente.</li>
                    </ol>
                </div>

                {/* MAINTENANCE SECTION */}
                <div className="mt-8 p-6 bg-red-900/10 border border-red-500/20 rounded-2xl">
                    <h4 className="text-red-500 font-bold mb-4 flex items-center gap-2">⚙️ Mantenimiento de Datos</h4>
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                        Esta herramienta permite limpiar el historial de pruebas. Eliminará todos los pedidos realizados <b className="text-white">antes del 26 de diciembre</b>. Los puntos actuales de los clientes NO se verán afectados.
                    </p>
                    <button
                        onClick={async () => {
                            // FIX: Safe Purge - Keep data from Dec 26th onwards
                            const purgeDate = new Date('2025-12-26T00:00:00').getTime();
                            const ordersToPurge = allOrders.filter(o => o.timestamp < purgeDate).length;

                            if (ordersToPurge === 0) {
                                onShowToast('✨ El historial antiguo ya está limpio.');
                                return;
                            }

                            const confirmed = confirm(`⚠️ MANTENIMIENTO: Se eliminarán ${ordersToPurge} pedidos ANTERIORES al 26 de Diciembre.\n\nTus ventas de AYER (26) y HOY (27) se mantendrán intactas.\n¿Proceder con la limpieza?`);

                            if (confirmed) {
                                // 0. WIPE CLOUD (Partial)
                                onShowToast('⏳ Limpiando Nube (Datos Antiguos)...');
                                const { error: cloudError } = await wipeCloudData(purgeDate);
                                if (cloudError) {
                                    alert('Error limpiando nube: ' + cloudError);
                                }

                                // 1. Purge Guest Orders
                                const cleanGuestOrders = guestOrders.filter(o => o.timestamp >= purgeDate);
                                updateGuestOrders(cleanGuestOrders);

                                // 2. Purge Registered User Orders
                                const cleanUsers = registeredUsers.map(u => ({
                                    ...u,
                                    orders: (u.orders || []).filter(o => o.timestamp >= purgeDate)
                                }));
                                updateUsers(cleanUsers);

                                onShowToast(`✅ Mantenimiento Completado: Datos antiguos eliminados.`);

                                // Reset counters for refresh
                                setTimeout(() => window.location.reload(), 1500);
                            }
                        }}
                        className="w-full sm:w-auto px-6 py-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <Trash2 size={16} /> Limpiar Datos PREVIOS al 26 Dic
                    </button>
                </div>
            </div>
        </div>
    );
};


export default AdminDashboard;
