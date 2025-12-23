import React, { useState } from 'react';
import { User, Order, Product } from '../../types';
import { useProducts } from '../../hooks/useProducts';
import { useAdmin } from '../../hooks/useAdmin';
import { useSurveys } from '../../hooks/useSurveys';
import {
    Plus, Edit, Trash2, X, BarChart3, Clock,
    Download, Upload, Search, Gift, Cloud, RefreshCw,
    CheckCircle2, LogOut, Lightbulb, DollarSign
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
    const { isSyncing } = useCloudSync();
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState<'stats' | 'cashregister' | 'products' | 'orders' | 'redeem' | 'customers' | 'suggestions' | 'cloud'>('stats');
    const [redeemSearch, setRedeemSearch] = useState('');
    const [redeemAmount, setRedeemAmount] = useState<number>(0);

    // Deep Link: Auto-navigate to orders if orderId present
    React.useEffect(() => {
        if (initialOrderId && isAdmin) {
            setActiveTab('orders');
        }
    }, [initialOrderId, isAdmin]);

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
                                    onShowToast('✅ Respaldo descargado exitosamente');
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md transition-all flex items-center gap-1.5 shadow-lg"
                            >
                                <Download size={14} /> Backup
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
                    {(['stats', 'cashregister', 'products', 'orders', 'redeem', 'customers', 'suggestions', 'cloud'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-none sm:flex-1 px-8 py-5 text-center font-bold tracking-tight transition-all whitespace-nowrap capitalize border-b-2 ${activeTab === tab ? 'text-orange-500 border-orange-500 bg-orange-500/5' : 'text-gray-400 border-transparent hover:text-white'}`}
                        >
                            <div className="flex flex-col items-center gap-1">
                                {tab === 'stats' && <BarChart3 className="w-5 h-5 mb-1" />}
                                {tab === 'cashregister' && <DollarSign className="w-5 h-5 mb-1" />}
                                {tab === 'products' && <Edit className="w-5 h-5 mb-1" />}
                                {tab === 'orders' && <Clock className="w-5 h-5 mb-1 text-orange-400" />}
                                {tab === 'redeem' && <Gift className="w-5 h-5 mb-1" />}
                                {tab === 'customers' && <Search className="w-5 h-5 mb-1" />}
                                {tab === 'suggestions' && <Lightbulb className="w-5 h-5 mb-1" />}
                                {tab === 'cloud' && <Cloud className="w-5 h-5 mb-1 text-blue-400" />}
                                <span className="text-[10px] uppercase font-black">{tab === 'stats' ? 'Analytics' : tab === 'suggestions' ? 'Ideas' : tab === 'cashregister' ? 'CAJA' : tab}</span>
                            </div>
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
                            highlightOrderId={initialOrderId}
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
                {status === 'error' && (
                    <p className="text-center text-red-400 text-sm mt-2">
                        Hubo un problema. Revisa la consola o tu conexión. (Supabase Keys)
                    </p>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
