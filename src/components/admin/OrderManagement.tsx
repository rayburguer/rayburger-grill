import React, { useState, useEffect } from 'react';
import { User, Order, Product } from '../../types';
// import { useAuth } from '../../hooks/useAuth'; // REMOVED
import { useLoyalty } from '../../hooks/useLoyalty';
import { Search, Trash2, Clock, CheckCircle2, ChevronRight, DollarSign, PackageCheck } from 'lucide-react';
import { triggerSuccessConfetti } from '../../utils/confetti';
import { useCloudSync } from '../../hooks/useCloudSync';

interface OrderManagementProps {
    registeredUsers: User[];
    updateUsers: (users: User[]) => void;
    guestOrders: Order[];
    updateGuestOrders: (updatedOrders: Order[]) => void;
    highlightOrderId?: string; // For deep linking
    allProducts: Product[]; // NEW: To resolve option names
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
    registeredUsers, updateUsers, guestOrders, updateGuestOrders, highlightOrderId, allProducts
}) => {
    const { confirmOrderRewards, rejectOrder } = useLoyalty();
    const { deleteFromCloud, replaceInCloud } = useCloudSync();
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'pending' | 'received' | 'preparing' | 'shipped' | 'payment_confirmed' | 'approved' | 'rejected' | 'all'>('pending');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['today', 'yesterday', 'thisWeek', 'older'])); // Default ALL OPEN // Default: only "today" expanded

    // EFFECT: Auto-scroll to highlighted order if provided via deep link
    useEffect(() => {
        if (highlightOrderId) {
            const element = document.getElementById(`order-${highlightOrderId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Optionally, add a temporary highlight
                element.classList.add('highlight-order');
                const timer = setTimeout(() => {
                    element.classList.remove('highlight-order');
                }, 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [highlightOrderId]);

    const allOrders = [...registeredUsers.flatMap(user => user.orders.map(order => ({ ...order, userName: order.customerName || user.name, userEmail: user.email, isGuest: false }))),
    ...guestOrders.map(order => ({ ...order, userName: order.customerName || 'Invitado', userEmail: order.customerPhone || 'N/A', isGuest: true }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort by newest first

    const filteredOrders = allOrders.filter(order => {
        const matchesSearch = searchTerm === '' ||
            order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.userName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filter === 'all'
            ? order.status !== 'rejected'
            : order.status === filter;

        return matchesSearch && matchesFilter;
    });

    const handleReject = (orderId: string, userEmail: string, isGuest: boolean) => {
        if (confirm(`¿Rechazar pedido de ${userEmail}?`)) {
            if (isGuest) {
                const updated = guestOrders.map(o => o.orderId === orderId ? { ...o, status: 'rejected' as const } : o);
                updateGuestOrders(updated);
                // SYNC guest orders
                const targetOrder = updated.find(o => o.orderId === orderId);
                if (targetOrder) replaceInCloud('rb_orders', [{ ...targetOrder, id: targetOrder.orderId }]);
            } else {
                const updatedUsers = rejectOrder(orderId, userEmail, registeredUsers);
                updateUsers(updatedUsers);
                // NOTE: Registered user orders synced via rb_users
            }
        }
    };

    const handleDeleteRecord = async (orderId: string, isGuest: boolean) => {
        if (confirm(`⚠️ ELIMINAR PERMANENTEMENTE\n\n¿Estás seguro de que deseas eliminar este registro de pedido? Esta acción no se puede deshacer.`)) {
            if (isGuest) {
                const updated = guestOrders.filter(o => o.orderId !== orderId);
                await updateGuestOrders(updated);
                await deleteFromCloud('rb_orders', orderId);
            } else {
                const updatedUsers = registeredUsers.map(u => ({
                    ...u,
                    orders: (u.orders || []).filter(o => o.orderId !== orderId)
                }));
                await updateUsers(updatedUsers);
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por ID, Email o Nombre..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:border-orange-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar md:flex-wrap">
                    {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-none px-4 py-2 rounded-full text-sm font-semibold capitalize transition-colors whitespace-nowrap ${filter === f
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : f === 'approved' ? 'Aprobados' : 'Rechazados'}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {filteredOrders.length === 0 ? (
                    <p className="text-center text-gray-400 py-10">No se encontraron pedidos.</p>
                ) : (
                    (() => {
                        // Group orders by date
                        const now = Date.now();
                        const today = new Date(now).setHours(0, 0, 0, 0);
                        const yesterday = today - 24 * 60 * 60 * 1000;
                        const thisWeek = today - 7 * 24 * 60 * 60 * 1000;

                        const groups = {
                            today: [] as typeof filteredOrders,
                            yesterday: [] as typeof filteredOrders,
                            thisWeek: [] as typeof filteredOrders,
                            older: [] as typeof filteredOrders,
                        };

                        filteredOrders.forEach(order => {
                            const orderDate = new Date(order.timestamp).setHours(0, 0, 0, 0);
                            if (orderDate === today) groups.today.push(order);
                            else if (orderDate === yesterday) groups.yesterday.push(order);
                            else if (order.timestamp >= thisWeek) groups.thisWeek.push(order);
                            else {
                                // HIDE REJECTED FROM OLDER GROUP unless specifically filtered to 'rejected' or 'all' but even in 'all' it's better to keep it clean
                                // If filter is 'all', let's hide rejected in older to reduce noise as requested
                                if (filter === 'all' && order.status === 'rejected') return;
                                groups.older.push(order);
                            }
                        });

                        return (
                            <>
                                {groups.today.length > 0 && (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => {
                                                const newExpanded = new Set(expandedGroups);
                                                if (newExpanded.has('today')) newExpanded.delete('today');
                                                else newExpanded.add('today');
                                                setExpandedGroups(newExpanded);
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-orange-900/20 hover:bg-orange-900/30 border border-orange-700/30 rounded-xl transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">🔥</span>
                                                <div className="text-left">
                                                    <h3 className="text-sm font-black text-orange-500 uppercase tracking-widest">Hoy</h3>
                                                    <p className="text-xs text-orange-400/60">{groups.today.length} pedido{groups.today.length !== 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                            <span className={`text-orange-500 transition-transform ${expandedGroups.has('today') ? 'rotate-180' : ''}`}>▼</span>
                                        </button>
                                        {expandedGroups.has('today') && (
                                            <div className="space-y-3 pl-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {groups.today.map(order => (
                                                    <OrderCard key={order.orderId} order={order} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {groups.yesterday.length > 0 && (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => {
                                                const newExpanded = new Set(expandedGroups);
                                                if (newExpanded.has('yesterday')) newExpanded.delete('yesterday');
                                                else newExpanded.add('yesterday');
                                                setExpandedGroups(newExpanded);
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">📅</span>
                                                <div className="text-left">
                                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Ayer</h3>
                                                    <p className="text-xs text-gray-500">{groups.yesterday.length} pedido{groups.yesterday.length !== 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                            <span className={`text-gray-500 transition-transform ${expandedGroups.has('yesterday') ? 'rotate-180' : ''}`}>▼</span>
                                        </button>
                                        {expandedGroups.has('yesterday') && (
                                            <div className="space-y-3 pl-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {groups.yesterday.map(order => (
                                                    <OrderCard key={order.orderId} order={order} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {groups.thisWeek.length > 0 && (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => {
                                                const newExpanded = new Set(expandedGroups);
                                                if (newExpanded.has('thisWeek')) newExpanded.delete('thisWeek');
                                                else newExpanded.add('thisWeek');
                                                setExpandedGroups(newExpanded);
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">📆</span>
                                                <div className="text-left">
                                                    <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Esta Semana</h3>
                                                    <p className="text-xs text-gray-600">{groups.thisWeek.length} pedido{groups.thisWeek.length !== 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                            <span className={`text-gray-600 transition-transform ${expandedGroups.has('thisWeek') ? 'rotate-180' : ''}`}>▼</span>
                                        </button>
                                        {expandedGroups.has('thisWeek') && (
                                            <div className="space-y-3 pl-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {groups.thisWeek.map(order => (
                                                    <OrderCard key={order.orderId} order={order} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {groups.older.length > 0 && (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => {
                                                const newExpanded = new Set(expandedGroups);
                                                if (newExpanded.has('older')) newExpanded.delete('older');
                                                else newExpanded.add('older');
                                                setExpandedGroups(newExpanded);
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">🗂️</span>
                                                <div className="text-left">
                                                    <h3 className="text-sm font-black text-gray-600 uppercase tracking-widest">Anteriores</h3>
                                                    <p className="text-xs text-gray-700">{groups.older.length} pedido{groups.older.length !== 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                            <span className={`text-gray-700 transition-transform ${expandedGroups.has('older') ? 'rotate-180' : ''}`}>▼</span>
                                        </button>
                                        {expandedGroups.has('older') && (
                                            <div className="space-y-3 pl-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {groups.older.map(order => (
                                                    <OrderCard key={order.orderId} order={order} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        );
                    })()
                )}
            </div>
        </div>
    );

    function OrderCard({ order }: { order: typeof filteredOrders[0] }) {
        const [isProcessing, setIsProcessing] = useState(false);

        return (
            <div id={`order-${order.orderId}`} className="relative bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-white text-lg">#{order.orderId.substring(0, 8).toUpperCase()}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${order.status === 'approved' || order.status === 'delivered' ? 'bg-green-900 text-green-400' :
                                order.status === 'rejected' ? 'bg-red-900 text-red-400' :
                                    order.status === 'preparing' ? 'bg-orange-900 text-orange-400' :
                                        order.status === 'shipped' ? 'bg-purple-900 text-purple-400' :
                                            'bg-yellow-900 text-yellow-500' // Pending
                                }`}>
                                {order.status === 'received' ? 'RECIBIDO' :
                                    order.status === 'preparing' ? 'EN COCINA' :
                                        order.status === 'shipped' ? 'EN CAMINO' :
                                            order.status === 'payment_confirmed' ? 'PAGO OK' :
                                                (order.status || 'PENDING')}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400">
                            {new Date(order.timestamp).toLocaleString()} • {order.userName} ({order.userEmail})
                        </p>
                        {/* DEBT INDICATOR */}
                        {order.status !== 'approved' && order.status !== 'rejected' && order.paymentStatus === 'pending' && (
                            <div className="mt-2 flex items-center gap-2 bg-red-900/30 border border-red-500/30 px-3 py-1 rounded-full w-fit animate-pulse">
                                <Clock size={12} className="text-red-500" />
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Cuenta Abierta / Por Cobrar</span>
                            </div>
                        )}
                        {order.status !== 'approved' && order.status !== 'rejected' && order.paymentStatus === 'paid' && (
                            <div className="mt-2 flex items-center gap-2 bg-green-900/20 border border-green-500/20 px-3 py-1 rounded-full w-fit">
                                <CheckCircle2 size={12} className="text-green-500" />
                                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Pago Verificado</span>
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-white">${order.totalUsd.toFixed(2)}</p>
                        {!order.isGuest && order.status !== 'approved' && order.rewardsEarned_usd && (
                            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-tighter">+${order.rewardsEarned_usd.toFixed(2)} Reward</p>
                        )}
                        {order.balanceUsed_usd && order.balanceUsed_usd > 0 && (
                            <p className="text-[10px] text-red-400 font-bold uppercase tracking-tighter">-${order.balanceUsed_usd.toFixed(2)} Wallet</p>
                        )}
                    </div>
                </div>

                {/* DELETE BUTTON for finalized orders */}
                {
                    (order.status === 'approved' || order.status === 'rejected') && (
                        <button
                            onClick={() => handleDeleteRecord(order.orderId, order.isGuest)}
                            className="absolute top-2 right-2 p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-900/10 rounded transition-colors"
                            title="Eliminar Registro"
                        >
                            <Trash2 size={14} />
                        </button>
                    )
                }

                <div className="bg-gray-900/50 p-3 rounded mb-4 text-sm text-gray-300">
                    {order.items.map((item, idx) => {
                        const product = allProducts.find(p => p.name === item.name);
                        const customizations = item.selectedOptions && product?.customizableOptions?.map((opt: any) => {
                            const isSelected = item.selectedOptions![opt.id];
                            if (opt.defaultIncluded && !isSelected) return `SIN ${opt.name.toUpperCase()}`;
                            if (!opt.defaultIncluded && isSelected) return `EXTRA ${opt.name.toUpperCase()}`;
                            return null;
                        }).filter(Boolean).join(', ');

                        return (
                            <div key={idx} className="flex flex-col border-b border-gray-800 last:border-0 py-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold">{item.quantity}x {item.name}</span>
                                    <span className="font-mono">${(item.price_usd * item.quantity).toFixed(2)}</span>
                                </div>
                                {customizations && (
                                    <span className="text-[10px] text-orange-400 font-black tracking-widest mt-1">
                                        ✨ {customizations}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Actions - Simplified 3-Step Workflow */}
                {
                    order.status !== 'rejected' && order.status !== 'approved' && (
                        <div className="flex flex-col gap-3 mt-4">
                            {/* NEW STEP 1: PENDING -> PREPARING */}
                            {(!order.status || order.status === 'pending') && (
                                <button
                                    onClick={() => {
                                        const newStatus = 'preparing';
                                        const updated = order.isGuest
                                            ? guestOrders.map(o => o.orderId === order.orderId ? { ...o, status: newStatus as any } : o)
                                            : registeredUsers.map(u => u.email === order.userEmail ? { ...u, orders: u.orders.map(o => o.orderId === order.orderId ? { ...o, status: newStatus as any } : o) } : u);

                                        if (order.isGuest) {
                                            updateGuestOrders(updated as Order[]);
                                            replaceInCloud('rb_orders', [{ ...order, status: newStatus, id: order.orderId }]);
                                        } else {
                                            updateUsers(updated as User[]);
                                        }
                                    }}
                                    className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"
                                >
                                    <ChevronRight size={24} /> ACEPTAR Y PREPARAR
                                </button>
                            )}

                            {/* NEW STEP 2: PREPARING -> DELIVERED (Notification) */}
                            {order.status === 'preparing' && (
                                <button
                                    onClick={() => {
                                        const newStatus = 'delivered';
                                        const updated = order.isGuest
                                            ? guestOrders.map(o => o.orderId === order.orderId ? { ...o, status: newStatus as any } : o)
                                            : registeredUsers.map(u => u.email === order.userEmail ? { ...u, orders: u.orders.map(o => o.orderId === order.orderId ? { ...o, status: newStatus as any } : o) } : u);

                                        if (order.isGuest) {
                                            updateGuestOrders(updated as Order[]);
                                            replaceInCloud('rb_orders', [{ ...order, status: newStatus, id: order.orderId }]);
                                        } else {
                                            updateUsers(updated as User[]);
                                        }
                                    }}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"
                                >
                                    <PackageCheck size={24} /> LISTO PARA ENTREGAR
                                </button>
                            )}

                            {/* STEP 3: DELIVERED -> APPROVED (Final & Points) */}
                            {order.status === 'delivered' && (
                                <button
                                    onClick={async () => {
                                        const confirmMsg = order.paymentStatus === 'pending'
                                            ? '¿Confirmar que el cliente YA PAGÓ y cerrar cuenta?'
                                            : '¿Cerrar cuenta y liberar puntos?';

                                        if (!confirm(confirmMsg)) return;

                                        setIsProcessing(true);
                                        try {
                                            if (order.isGuest) {
                                                const updated = guestOrders.map(o => o.orderId === order.orderId ? { ...o, status: 'approved' as const, paymentStatus: 'paid' as const } : o);
                                                updateGuestOrders(updated);
                                                await replaceInCloud('rb_orders', [{ ...order, status: 'approved', paymentStatus: 'paid', id: order.orderId }]);
                                            } else {
                                                const updatedUsers = confirmOrderRewards(order.orderId, order.userEmail, registeredUsers);
                                                // Ensure the order in user object also gets paymentStatus: 'paid'
                                                const finalUsers = updatedUsers.map(u => u.email === order.userEmail ? {
                                                    ...u,
                                                    orders: u.orders.map(o => o.orderId === order.orderId ? { ...o, paymentStatus: 'paid' as const } : o)
                                                } : u);
                                                updateUsers(finalUsers);
                                            }
                                            triggerSuccessConfetti();
                                        } catch (error) {
                                            console.error('Error al cerrar cuenta:', error);
                                        } finally {
                                            setIsProcessing(false);
                                        }
                                    }}
                                    disabled={isProcessing}
                                    className={`w-full py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-3 transform transition-all active:scale-95 ${order.paymentStatus === 'pending'
                                        ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                                        : 'bg-green-600 hover:bg-green-500 text-white'
                                        }`}
                                >
                                    <DollarSign size={24} />
                                    {order.paymentStatus === 'pending' ? 'CONFIRMAR PAGO Y CERRAR' : 'CERRAR CUENTA'}
                                </button>
                            )}

                            {/* REJECT BUTTON */}
                            {(!order.status || order.status === 'pending' || order.status === 'preparing' || order.status === 'delivered') && (
                                <button
                                    onClick={() => handleReject(order.orderId, order.userEmail, order.isGuest)}
                                    className="w-full py-2 text-gray-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest transition-colors"
                                >
                                    Rechazar / Cancelar
                                </button>
                            )}
                        </div>
                    )
                }
            </div>
        );
    }
};
