import React, { useState } from 'react';
import { User, Order, Product } from '../../types';
import { useProducts } from '../../hooks/useProducts';
import { useAdmin } from '../../hooks/useAdmin';
import { useSurveys } from '../../hooks/useSurveys';
import {
    Plus, Edit, Trash2, X, BarChart3, Clock,
    Download, Upload, Search, Gift, Cloud, RefreshCw,
    CheckCircle2, LogOut, Lightbulb, DollarSign, TrendingUp
} from 'lucide-react';
import { useCloudSync } from '../../hooks/useCloudSync';
import { useSuggestions } from '../../hooks/useSuggestions';
import { OrderManagement } from './OrderManagement';
import { AdminBI } from './AdminBI';
import { CashRegisterReport } from './CashRegisterReport';
import { persistence } from '../../utils/persistence';

interface AdminDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    registeredUsers: User[];
    updateUsers: (users: User[]) => void;
    tasaBs: number;
    onUpdateTasa: (newTasa: number) => void;
    guestOrders: Order[];
    updateGuestOrders: (updatedOrders: Order[]) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    isOpen, onClose, registeredUsers, updateUsers,
    tasaBs, onUpdateTasa, guestOrders, updateGuestOrders
}) => {
    const { products, addProduct, updateProduct, deleteProduct, resetToSample } = useProducts();
    const { suggestions, deleteSuggestion } = useSuggestions();
    const { isAdmin, loginAdmin, logoutAdmin } = useAdmin();
    const { getStats } = useSurveys();
    const { migrateAllToCloud, isSyncing } = useCloudSync();
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState<'stats' | 'cashregister' | 'products' | 'orders' | 'redeem' | 'customers' | 'retention' | 'suggestions' | 'cloud'>('stats');
    const [redeemSearch, setRedeemSearch] = useState('');
    const [redeemAmount, setRedeemAmount] = useState<number>(0);

    const allOrders = [
        ...registeredUsers.flatMap(u => (u.orders || []).map(o => ({ ...o, userEmail: u.email, userName: u.name, isGuest: false }))),
        ...guestOrders.map(o => ({ ...o, userEmail: 'Invitado', userName: o.customerName || 'Invitado', isGuest: true }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    const surveyStats = getStats();
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});

    if (!isOpen) return null;

    if (!isAdmin) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md border border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-orange-500">Acceso Admin</h2>
                        <button onClick={onClose}><X className="text-gray-400 hover:text-white" /></button>
                    </div>
                    <input
                        type="password"
                        placeholder="Contraseña Maestra"
                        className="w-full bg-gray-700 border border-gray-600 rounded p-3 mb-4 text-white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        onClick={() => loginAdmin(password)}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded transition-colors"
                    >
                        Entrar
                    </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md overflow-y-auto">
            <div className="bg-gray-900 w-full min-h-screen lg:min-h-[auto] lg:max-w-6xl lg:rounded-2xl shadow-xl overflow-hidden flex flex-col pt-20 lg:pt-0">
                {/* Header */}
                <div className="bg-gray-800 p-4 lg:p-6 flex flex-col sm:flex-row justify-between items-center border-b border-gray-700 gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl lg:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
                                Ray Dashboard
                            </h2>
                            <span className="px-2 py-0.5 bg-green-900/50 text-green-400 text-[10px] lg:text-xs rounded-full border border-green-700">Premium</span>
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
                                    alert('✅ Respaldo descargado.');
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md transition-all flex items-center gap-1.5 shadow-lg"
                            >
                                <Download size={14} /> Backup
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 bg-gray-700 hover:bg-red-900/50 rounded-full transition-colors text-white"><X size={20} /></button>
                    </div>
                </div>

                {/* Navbar */}
                <div className="flex border-b border-gray-700 bg-gray-800/50 overflow-x-auto hide-scrollbar">
                    {(['stats', 'cashregister', 'products', 'orders', 'redeem', 'customers', 'retention', 'suggestions', 'cloud'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-none sm:flex-1 px-6 py-4 text-center font-semibold transition-colors whitespace-nowrap capitalize ${activeTab === tab ? 'text-orange-500 border-b-2 border-orange-500 bg-gray-800' : 'text-gray-400 hover:text-white'}`}
                        >
                            {tab === 'stats' && <BarChart3 className="inline mr-2 w-4 h-4" />}
                            {tab === 'cashregister' && <DollarSign className="inline mr-2 w-4 h-4" />}
                            {tab === 'products' && <Edit className="inline mr-2 w-4 h-4" />}
                            {tab === 'orders' && <Clock className="inline mr-2 w-4 h-4" />}
                            {tab === 'redeem' && <Gift className="inline mr-2 w-4 h-4" />}
                            {tab === 'customers' && <Search className="inline mr-2 w-4 h-4" />}
                            {tab === 'retention' && <TrendingUp className="inline mr-2 w-4 h-4" />}
                            {tab === 'suggestions' && <Lightbulb className="inline mr-2 w-4 h-4" />}
                            {tab === 'cloud' && <Cloud className="inline mr-2 w-4 h-4" />}
                            {tab === 'stats' ? 'BI Analytics' : tab === 'suggestions' ? 'Buzón de Ideas' : tab === 'cashregister' ? 'Cierre Caja' : tab === 'retention' ? 'Marketing' : tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-8 flex-1 overflow-y-auto max-h-[75vh]">
                    {activeTab === 'stats' && (
                        <div className="space-y-6">
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
                            products={products}
                            updateProduct={updateProduct}
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
                                    <input
                                        className="bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-orange-500 outline-none"
                                        placeholder="Stock (Opcional)"
                                        type="number"
                                        value={currentProduct.stockQuantity || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, stockQuantity: Number(e.target.value) })}
                                    />
                                    <input
                                        className="bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-orange-500 outline-none lg:col-span-2"
                                        placeholder="Categoría"
                                        value={currentProduct.category || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                                    />
                                    <div className="flex flex-col gap-2">
                                        <label className="text-gray-400 text-xs">Imagen</label>
                                        <div className="flex items-center gap-2">
                                            <label className="flex-1 cursor-pointer bg-gray-900 border border-gray-700 hover:border-orange-500 rounded p-3 text-white flex items-center justify-center gap-2">
                                                <Upload size={16} />
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => setCurrentProduct({ ...currentProduct, image: reader.result as string });
                                                        reader.readAsDataURL(file);
                                                    }
                                                }} />
                                            </label>
                                            {currentProduct.image && <img src={currentProduct.image} className="w-12 h-12 rounded object-cover" />}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={async () => {
                                            if (confirm('¿Cargar menú oficial y sincronizar con la nube?')) {
                                                resetToSample();
                                                // Wait a bit for state to update and then migrate
                                                setTimeout(async () => {
                                                    await migrateAllToCloud();
                                                    alert('✅ Menú Oficial cargado y sincronizado en la Nube');
                                                }, 1000);
                                            }
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
                                            <button
                                                onClick={() => updateProduct({ ...p, isAvailable: p.isAvailable === false })}
                                                className={`px - 3 py - 1 rounded text - xs font - bold ${p.isAvailable !== false ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'} `}
                                            >
                                                {p.isAvailable !== false ? '🚫 Agotar' : '✓ Activar'}
                                            </button>
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
                                                points: 0, referralCode: 'POS-' + Date.now(), role: 'customer', orders: [], loyaltyTier: 'Bronze', passwordHash: '1234'
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
                                    <h3 className="font-bold text-white mb-4">Base de Datos ({registeredUsers.length})</h3>
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
                                                            alert('✅ Canje exitoso');
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

                    {activeTab === 'cashregister' && (
                        <CashRegisterReport orders={allOrders} tasaBs={tasaBs} />
                    )}

                    {activeTab === 'retention' && (
                        <div className="space-y-6">
                            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <TrendingUp className="text-blue-500" size={28} />
                                    Marketing de Retención
                                </h3>

                                {(() => {
                                    const inactiveUsers = registeredUsers.filter(user => {
                                        if (!user.orders || user.orders.length === 0) return false;
                                        const lastOrder = user.orders.sort((a, b) => b.timestamp - a.timestamp)[0];
                                        const daysSinceLastOrder = (Date.now() - lastOrder.timestamp) / (1000 * 60 * 60 * 24);
                                        return daysSinceLastOrder >= 15;
                                    });

                                    return (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                                <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 p-6 rounded-2xl border border-red-700/50">
                                                    <p className="text-sm text-gray-400 mb-2">Clientes Inactivos</p>
                                                    <p className="text-4xl font-black text-red-400">{inactiveUsers.length}</p>
                                                    <p className="text-xs text-gray-500 mt-1">15+ días sin comprar</p>
                                                </div>
                                                <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 p-6 rounded-2xl border border-green-700/50">
                                                    <p className="text-sm text-gray-400 mb-2">Clientes Activos</p>
                                                    <p className="text-4xl font-black text-green-400">{registeredUsers.length - inactiveUsers.length}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Compraron recientemente</p>
                                                </div>
                                                <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 p-6 rounded-2xl border border-blue-700/50">
                                                    <p className="text-sm text-gray-400 mb-2">Tasa de Retención</p>
                                                    <p className="text-4xl font-black text-blue-400">
                                                        {registeredUsers.length > 0 ? Math.round(((registeredUsers.length - inactiveUsers.length) / registeredUsers.length) * 100) : 0}%
                                                    </p>
                                                </div>
                                            </div>

                                            {inactiveUsers.length === 0 ? (
                                                <div className="text-center py-12 text-gray-500">
                                                    <p className="text-lg font-bold">¡Excelente! No hay clientes inactivos</p>
                                                    <p className="text-sm mt-2">Todos tus clientes están comprando regularmente 🎉</p>
                                                </div>
                                            ) : (
                                                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-800">
                                                            <thead className="bg-gray-800">
                                                                <tr>
                                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase">Cliente</th>
                                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase">Última Compra</th>
                                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase">Días Inactivo</th>
                                                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-300 uppercase">Acción</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-800">
                                                                {inactiveUsers.map(user => {
                                                                    const lastOrder = user.orders.sort((a, b) => b.timestamp - a.timestamp)[0];
                                                                    const daysSince = Math.floor((Date.now() - lastOrder.timestamp) / (1000 * 60 * 60 * 24));

                                                                    return (
                                                                        <tr key={user.phone} className="hover:bg-gray-800/50">
                                                                            <td className="px-4 py-3 text-sm">
                                                                                <div className="text-white font-bold">{user.name}</div>
                                                                                <div className="text-gray-500 text-xs">{user.phone}</div>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-sm text-gray-400">
                                                                                {new Date(lastOrder.timestamp).toLocaleDateString()}
                                                                            </td>
                                                                            <td className="px-4 py-3 text-sm">
                                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${daysSince > 30 ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'
                                                                                    }`}>
                                                                                    {daysSince} días
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-center">
                                                                                <a
                                                                                    href={`https://wa.me/${user.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                                                                        `¡Hola ${user.name}! 😊\nTe extrañamos en Ray Burger Grill 🍔\n\nTenemos una PROMO ESPECIAL para ti:\n🎁 20% OFF en tu próximo pedido\n\n¡Haz tu pedido ahora!\n👉 https://rayburgergrill.com.ve`
                                                                                    )}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs transition-all"
                                                                                >
                                                                                    📲 Enviar Promo
                                                                                </a>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {activeTab === 'cloud' && <CloudSyncSection />}
                </div>
            </div>
        </div>
    );
};

const CloudSyncSection: React.FC = () => {
    const { isSyncing, lastSync, migrateAllToCloud } = useCloudSync();
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
                        const results = await migrateAllToCloud();
                        if (results.some(r => r.error)) setStatus('error');
                        else setStatus('success');
                    }}
                    disabled={isSyncing}
                    className={`w-full py-4 rounded-xl font-black text-lg uppercase transition-all flex items-center justify-center gap-3
                        ${isSyncing ? 'bg-gray-700' : status === 'success' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {isSyncing ? <><RefreshCw className="animate-spin" /> Sincronizando...</> : status === 'success' ? <><CheckCircle2 /> ¡Protegido!</> : 'Iniciar Migración Cloud'}
                </button>
            </div>
        </div>
    );
};

export default AdminDashboard;
