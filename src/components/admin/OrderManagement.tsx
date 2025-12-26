import React, { useState } from 'react';
import { User, Order, Product } from '../../types';
// import { useAuth } from '../../hooks/useAuth'; // REMOVED
import { useLoyalty } from '../../hooks/useLoyalty';
import { Search } from 'lucide-react';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'pending' | 'received' | 'preparing' | 'shipped' | 'payment_confirmed' | 'approved' | 'rejected' | 'all'>('all');

    // EFFECT: Auto-scroll to highlighted order if provided via deep link
    React.useEffect(() => {
        if (highlightOrderId) {
            setFilter('all');
            setSearchTerm(highlightOrderId);
            setTimeout(() => {
                const element = document.getElementById(`order-${highlightOrderId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-2', 'ring-orange-500', 'animate-pulse');
                }
            }, 500);
        }
    }, [highlightOrderId]);

    // ... (rest of filtering logic)

    // Flatten all orders from all users + guest orders into a single list
    const allOrders = [
        ...registeredUsers.flatMap(user =>
            (user.orders || []).map(order => ({ ...order, userEmail: user.email, userName: user.name, isGuest: false }))
        ),
        ...guestOrders.map(order => ({ ...order, userEmail: 'Invitado', userName: order.customerName || 'Anónimo', isGuest: true }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    const filteredOrders = allOrders.filter(order => {
        const matchesSearch =
            order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.userName.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'all') return matchesSearch;
        return matchesSearch && (order.status || 'pending') === filter; // Default to pending if undefined
    });

    const handleApprove = (orderId: string, userEmail: string, isGuest: boolean) => {
        if (confirm(`¿Aprobar pedido y liberar puntos${isGuest ? '' : ' para ' + userEmail}?`)) {
            if (isGuest) {
                const updated = guestOrders.map(o => o.orderId === orderId ? { ...o, status: 'approved' as const } : o);
                updateGuestOrders(updated);
            } else {
                const updatedUsers = confirmOrderRewards(orderId, userEmail, registeredUsers);
                updateUsers(updatedUsers);
            }
        }
    };

    const handleReject = (orderId: string, userEmail: string, isGuest: boolean) => {
        if (confirm(`¿Rechazar pedido de ${userEmail}?`)) {
            if (isGuest) {
                const updated = guestOrders.map(o => o.orderId === orderId ? { ...o, status: 'rejected' as const } : o);
                updateGuestOrders(updated);
            } else {
                const updatedUsers = rejectOrder(orderId, userEmail, registeredUsers);
                updateUsers(updatedUsers);
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
                    filteredOrders.map(order => (
                        <div key={order.orderId} id={`order-${order.orderId}`} className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">
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
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-white">${order.totalUsd.toFixed(2)}</p>
                                    {!order.isGuest && <p className="text-sm text-orange-400">+{order.pointsEarned} Pts Pendientes</p>}
                                    {order.deliveryMethod && (
                                        <p className="text-xs text-gray-400 mt-1 capitalize">
                                            {order.deliveryMethod === 'delivery' ? `🛵 Delivery ($${order.deliveryFee})` : '🏠 Retiro'}
                                        </p>
                                    )}
                                </div>
                            </div>

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
                            {order.status !== 'rejected' && order.status !== 'approved' && (
                                <div className="flex flex-col gap-3 mt-4">
                                    {/* STEP 1: PENDING -> DELIVERED */}
                                    {(!order.status || order.status === 'pending') && (
                                        <button
                                            onClick={() => {
                                                const updated = order.isGuest
                                                    ? guestOrders.map(o => o.orderId === order.orderId ? { ...o, status: 'delivered' as const } : o)
                                                    : registeredUsers.map(u => u.email === order.userEmail ? { ...u, orders: u.orders.map(o => o.orderId === order.orderId ? { ...o, status: 'delivered' as const } : o) } : u);

                                                if (order.isGuest) updateGuestOrders(updated as Order[]);
                                                else updateUsers(updated as User[]);
                                            }}
                                            className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2"
                                        >
                                            🚚 MARCAR ENTREGADO
                                        </button>
                                    )}

                                    {/* STEP 2: DELIVERED -> APPROVED (Final & Points) */}
                                    {order.status === 'delivered' && (
                                        <button
                                            onClick={async () => {
                                                if (confirm('¿Confirmar pago recibido y otorgar puntos?')) {
                                                    if (order.isGuest) {
                                                        const updated = guestOrders.map(o => o.orderId === order.orderId ? { ...o, status: 'approved' as const } : o);
                                                        updateGuestOrders(updated);
                                                    } else {
                                                        const updatedUsers = confirmOrderRewards(order.orderId, order.userEmail, registeredUsers);
                                                        updateUsers(updatedUsers);
                                                    }
                                                    // CONFETTI CELEBRATION! 🎊
                                                    const { triggerConfetti } = await import('../../utils/confetti');
                                                    triggerConfetti();
                                                }
                                            }}
                                            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black text-lg shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                                        >
                                            💰 PAGO RECIBIDO / CERRAR
                                        </button>
                                    )}

                                    <div className="flex gap-2">
                                        {/* Reject Button (Smaller but accessible) */}
                                        <button
                                            onClick={() => handleReject(order.orderId, order.userEmail, !!order.isGuest)}
                                            className="flex-1 py-3 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded-xl transition-colors text-sm font-bold border border-red-900/30"
                                        >
                                            Rechazar
                                        </button>

                                        {/* WhatsApp Quick Link */}
                                        {order.customerPhone && (
                                            <button
                                                onClick={() => {
                                                    let text = '';
                                                    if (order.status === 'delivered') text = `✅ Hola ${order.userName}, ¡Tu pedido fue entregado! ¿Todo bien?`;
                                                    else text = `🛍️ Hola ${order.userName}, recibimos tu pedido en Ray Burger.`;

                                                    window.open(`https://wa.me/${order.customerPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                                                }}
                                                className="flex-1 py-3 bg-green-600/20 text-green-400 hover:bg-green-600/40 border border-green-600/30 rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-1"
                                            >
                                                📲 Mensaje
                                            </button>
                                        )}
                                    </div>

                                    {/* Direct Bypass for Admin Errors */}
                                    {(!order.status || order.status === 'pending') && (
                                        <button
                                            onClick={() => handleApprove(order.orderId, order.userEmail, !!order.isGuest)}
                                            className="w-full py-2 text-gray-500 hover:text-gray-400 text-[10px] font-bold uppercase tracking-widest"
                                        >
                                            Aprobación Directa (Saltar Pasos)
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
