import React, { useCallback } from 'react';
import { UserCircle, ClipboardCopy, MessageSquare, RefreshCw } from 'lucide-react';
import Modal from '../ui/Modal';
import { User, Order } from '../../types';
import QRCodeDisplay from '../loyalty/QRCodeDisplay';
import RewardsProgressBar from '../loyalty/RewardsProgressBar';
import { POINTS_VALUE_IN_USD } from '../../config/constants';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onShowToast: (message: string) => void;
    onReorder?: (order: Order) => void; // NEW: Callback para reordenar
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user, onShowToast, onReorder }) => {
    if (!user) return null;

    const handleCopyReferralCode = useCallback(async () => {
        if (user?.referralCode) {
            try {
                await navigator.clipboard.writeText(user.referralCode);
                onShowToast("¡Código de referido copiado al portapapeles!");
            } catch (err) {
                console.error("Error al copiar el código:", err);
                onShowToast("Error al copiar el código. Inténtalo manualmente.");
            }
        }
    }, [user, onShowToast]);

    // Calculate Pending Points
    const pendingPoints = user.orders
        .filter(o => o.status === 'pending' || !o.status)
        .reduce((sum, o) => sum + (o.pointsEarned || 0), 0);

    // Get last approved order for reorder
    const lastApprovedOrder = user.orders
        .filter(o => o.status === 'approved')
        .sort((a, b) => b.timestamp - a.timestamp)[0];

    const handleReorder = useCallback(() => {
        if (lastApprovedOrder && onReorder) {
            onReorder(lastApprovedOrder);
            onClose();
        }
    }, [lastApprovedOrder, onReorder, onClose]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Perfil de ${user.name.split(' ')[0]}`}>
            <div className="space-y-4 text-gray-300">
                <div className="flex flex-col gap-2 bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <p className="flex items-center text-lg"><UserCircle className="w-5 h-5 mr-2 text-orange-400" /> <span className="text-white font-semibold">Nombre:</span> {user.name}</p>
                    <p className="flex items-center text-lg">📞 <span className="text-white font-semibold ml-2">Teléfono:</span> {user.phone}</p>
                    {user.email && !user.email.endsWith('@rayburger.app') && (
                        <p className="flex items-center text-lg">📧 <span className="text-white font-semibold ml-2">Email:</span> {user.email}</p>
                    )}
                </div>

                <div className="pt-2 border-t border-gray-700 grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Nivel Actual</p>
                        <p className="text-2xl font-bold text-orange-400">{user.loyaltyTier}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 p-4 rounded-lg border border-green-700/50">
                        <p className="text-sm text-gray-400 mb-1">💰 Saldo Referidos</p>
                        <p className="text-2xl font-bold text-green-400">${(user.cashbackBalance_usd || 0).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Por traer amigos</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">🎯 Puntos Disponibles</p>
                        <p className="text-2xl font-bold text-white">{user.points}</p>
                        <p className="text-xs text-orange-400">= ${(user.points * POINTS_VALUE_IN_USD).toFixed(2)} valor</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-yellow-700/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 bg-yellow-500/20 text-yellow-500 text-xs font-bold rounded-bl-lg">PENDIENTES</div>
                        <p className="text-sm text-gray-400 mb-1">Por Liberar</p>
                        <p className="text-2xl font-bold text-yellow-500">+{pendingPoints}</p>
                    </div>
                </div>

                {/* Rewards Progress */}
                <div className="mt-4">
                    <RewardsProgressBar currentPoints={user.points} />
                </div>

                <div className="bg-gray-700 p-4 rounded-md border border-gray-600 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-white text-lg font-semibold">Tu Código de Referido:</p>
                    <span className="bg-gray-800 text-orange-300 font-mono px-4 py-2 rounded-md border border-gray-600 break-all text-center tracking-widest text-lg font-bold">
                        {user.referralCode.length > 12 ? user.referralCode.substring(0, 8).toUpperCase() : user.referralCode}
                    </span>
                    <button
                        onClick={handleCopyReferralCode}
                        className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        aria-label="Copiar código de referido al portapapeles"
                    >
                        <ClipboardCopy className="w-4 h-4 mr-2" /> Copiar
                    </button>
                </div>

                {/* NUEVO: WhatsApp Referral Button */}
                <div className="bg-gradient-to-r from-green-900/20 to-green-800/20 p-4 rounded-lg border border-green-700/50">
                    <p className="text-sm text-gray-300 mb-3 text-center">
                        💡 <strong>Forma más fácil:</strong> Comparte directamente por WhatsApp
                    </p>
                    <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                            `🍔 ¡Hola! Te invito a Ray Burger Grill, las mejores hamburguesas premium.\n\n✨ Regístrate con mi código: ${user.referralCode}\ny obtén $50 de bienvenida!\n\n👉 https://rayburgergrill.com.ve`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
                    >
                        <MessageSquare className="w-5 h-5" />
                        📲 Referir por WhatsApp
                    </a>
                </div>

                {user.referredByCode && (
                    <p className="text-sm text-gray-400 text-center">
                        Fuiste referido por el código: <span className="font-mono text-orange-300">{user.referredByCode}</span>
                    </p>
                )}

                {/* QR Code Section */}
                <div className="mt-4">
                    <QRCodeDisplay
                        value={`https://rayburgergrill.com.ve?ref=${user.referralCode}`}
                        title="🎁 Comparte y Gana"
                        subtitle="Escanea para referir amigos"
                        downloadable={true}
                        size={180}
                    />
                </div>

                <p className="text-sm text-gray-400 text-center mt-2">
                    ¡Comparte tu código y gana <span className="text-green-400 font-bold">2% de saldo</span> en cada compra de tus amigos!
                </p>

                {/* NUEVO: Reordenar Último Pedido */}
                {lastApprovedOrder && onReorder && (
                    <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 p-4 rounded-lg border border-orange-700/50">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <p className="text-orange-400 font-bold text-sm mb-1">🔄 ¿Repetir tu pedido?</p>
                                <p className="text-gray-300 text-sm">
                                    {lastApprovedOrder.items.slice(0, 2).map(i => i.name).join(', ')}
                                    {lastApprovedOrder.items.length > 2 && ` +${lastApprovedOrder.items.length - 2} más`}
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                    ${lastApprovedOrder.totalUsd.toFixed(2)} • {new Date(lastApprovedOrder.timestamp).toLocaleDateString()}
                                </p>
                            </div>
                            <button
                                onClick={handleReorder}
                                className="flex items-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-900/30"
                            >
                                <RefreshCw size={18} />
                                Pedir
                            </button>
                        </div>
                    </div>
                )}

                {/* Historial de Pedidos */}
                <div className="pt-4 mt-4 border-t border-gray-700">
                    <h3 className="text-xl font-bold text-orange-500 mb-4">Historial de Pedidos:</h3>
                    {user.orders.length === 0 ? (
                        <p className="text-gray-400 text-center">Aún no tienes pedidos.</p>
                    ) : (
                        <div className="overflow-x-auto rounded-md border border-gray-700">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID / Fecha</th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total</th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Estado</th>
                                        <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {user.orders.slice().reverse().map(order => (
                                        <tr key={order.orderId} className="hover:bg-gray-700 transition-colors duration-200">
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                <div className="text-white font-medium">#{order.orderId.substring(0, 6)}...</div>
                                                <div className="text-gray-400 text-xs">{new Date(order.timestamp).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                <div className="text-orange-400 font-semibold">${order.totalUsd.toFixed(2)}</div>
                                                <div className="text-green-500/80 text-xs">+{order.pointsEarned} pts</div>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'approved' ? 'bg-green-900 text-green-400' :
                                                    order.status === 'rejected' ? 'bg-red-900 text-red-400' :
                                                        'bg-yellow-900 text-yellow-500'
                                                    }`}>
                                                    {order.status === 'approved' ? 'Aprobado' :
                                                        order.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                                                {order.status === 'approved' && onReorder && (
                                                    <button
                                                        onClick={() => {
                                                            onReorder(order);
                                                            onClose();
                                                        }}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold text-xs transition-all hover:scale-105 active:scale-95 shadow-md"
                                                        title="Repetir este pedido"
                                                    >
                                                        <RefreshCw size={14} />
                                                        Repetir
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default UserProfileModal;
