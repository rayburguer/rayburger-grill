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
    products: Product[];
    updateProduct: (p: Product) => void;
    highlightOrderId?: string; // For deep linking
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
    registeredUsers, updateUsers, guestOrders, updateGuestOrders, products, updateProduct, highlightOrderId
}) => {
    const { confirmOrderRewards, rejectOrder } = useLoyalty();
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'pending' | 'preparing' | 'shipped' | 'approved' | 'rejected' | 'all'>('pending');

    const restoreStock = (orderItems: { name: string; quantity: number }[]) => {
        orderItems.forEach(item => {
            const product = products.find(p => p.name === item.name);
            if (product && product.stockQuantity !== undefined) {
                const newStock = product.stockQuantity + item.quantity;
                updateProduct({ ...product, stockQuantity: newStock });
            }
        });
    };

    const deductStock = (orderItems: { name: string; quantity: number }[]) => {
        orderItems.forEach(item => {
            const product = products.find(p => p.name === item.name);
            if (product && product.stockQuantity !== undefined) {
                const newStock = Math.max(0, product.stockQuantity - item.quantity);
                updateProduct({ ...product, stockQuantity: newStock });
            }
        });
    };

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
        const orderToReject = allOrders.find(o => o.orderId === orderId);
        if (confirm(`¿Rechazar pedido de ${userEmail}?`)) {
            // Restore stock if it was already deducted (preparing or shipped)
            if (orderToReject && (orderToReject.status === 'preparing' || orderToReject.status === 'shipped')) {
                restoreStock(orderToReject.items);
            }

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
                        <div key={order.orderId} className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">
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
                                            {order.status === 'preparing' ? 'EN COCINA' :
                                                order.status === 'shipped' ? 'EN CAMINO' :
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

                            {/* Items */}
                            <div className="bg-gray-900/50 p-3 rounded mb-4 text-sm text-gray-300">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between border-b border-gray-800 last:border-0 py-1">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span>${(item.price_usd * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Actions - Workflow Statuses */}
                            {order.status !== 'rejected' && order.status !== 'approved' && order.status !== 'delivered' && (
                                <div className="flex flex-wrap justify-end gap-2 mt-4">
                                    {/* Reject always possible if not final */}
                                    <button
                                        onClick={() => handleReject(order.orderId, order.userEmail, !!order.isGuest)}
                                        className="px-3 py-2 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded transition-colors text-xs font-bold border border-red-900/30"
                                    >
                                        Rechazar
                                    </button>

                                    {(!order.status || order.status === 'pending') && (
                                        <button
                                            onClick={() => {
                                                deductStock(order.items);
                                                const updated = order.isGuest
                                                    ? guestOrders.map(o => o.orderId === order.orderId ? { ...o, status: 'preparing' as const } : o)
                                                    : registeredUsers.map(u => u.email === order.userEmail ? { ...u, orders: u.orders.map(o => o.orderId === order.orderId ? { ...o, status: 'preparing' as const } : o) } : u);

                                                if (order.isGuest) updateGuestOrders(updated as Order[]);
                                                else updateUsers(updated as User[]);
                                            }}
                                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-bold text-sm shadow-lg shadow-orange-900/20"
                                        >
                                            👨‍🍳 A Cocina
                                        </button>
                                    )}

                                    {order.status === 'preparing' && (
                                        <button
                                            onClick={() => {
                                                const updated = order.isGuest
                                                    ? guestOrders.map(o => o.orderId === order.orderId ? { ...o, status: 'shipped' as const } : o)
                                                    : registeredUsers.map(u => u.email === order.userEmail ? { ...u, orders: u.orders.map(o => o.orderId === order.orderId ? { ...o, status: 'shipped' as const } : o) } : u);

                                                if (order.isGuest) updateGuestOrders(updated as Order[]);
                                                else updateUsers(updated as User[]);
                                            }}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-sm shadow-lg shadow-purple-900/20"
                                        >
                                            🛵 Despachar
                                        </button>
                                    )}

                                    {order.status === 'shipped' && (
                                        <button
                                            onClick={() => {
                                                if (confirm('¿Confirmar entrega y otorgar puntos?')) {
                                                    if (order.isGuest) {
                                                        const updated = guestOrders.map(o => o.orderId === order.orderId ? { ...o, status: 'approved' as const } : o);
                                                        updateGuestOrders(updated);
                                                    } else {
                                                        const updatedUsers = confirmOrderRewards(order.orderId, order.userEmail, registeredUsers);
                                                        updateUsers(updatedUsers);
                                                    }
                                                }
                                            }}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-sm shadow-lg shadow-green-900/20"
                                        >
                                            ✅ Entregado
                                        </button>
                                    )}

                                    {/* Quick Approve for transition */}
                                    {(!order.status || order.status === 'pending') && (
                                        <button
                                            onClick={() => handleApprove(order.orderId, order.userEmail, !!order.isGuest)}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold"
                                        >
                                            Aprobación Directa
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
