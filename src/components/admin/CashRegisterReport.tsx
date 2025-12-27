import React, { useState } from 'react';
import { DollarSign, Calendar, Download, TrendingUp } from 'lucide-react';
import { Order } from '../../types';

interface CashRegisterReportProps {
    orders: (Order & { userName?: string })[];
    tasaBs: number;
}

export const CashRegisterReport: React.FC<CashRegisterReportProps> = ({ orders, tasaBs }) => {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'custom'>('today');

    const getFilteredOrders = () => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(todayStart);

        // Custom Date Range (Local Time)
        const [y, m, d] = selectedDate.split('-').map(Number);
        const customStart = new Date(y, m - 1, d, 0, 0, 0, 0);
        const customEnd = new Date(customStart);
        customEnd.setDate(customEnd.getDate() + 1);

        return orders.filter(order => {
            if (!order.timestamp) return false;
            const t = typeof order.timestamp === 'string' ? new Date(order.timestamp).getTime() : order.timestamp;

            if (dateRange === 'today') {
                return t >= todayStart.getTime() && t < todayEnd.getTime();
            } else if (dateRange === 'yesterday') {
                return t >= yesterdayStart.getTime() && t < yesterdayEnd.getTime();
            } else {
                return t >= customStart.getTime() && t < customEnd.getTime();
            }
        });
    };

    const filteredOrders = getFilteredOrders();
    const approvedOrders = filteredOrders.filter(o => o.status === 'approved' || o.status === 'delivered');

    const totalUSD = approvedOrders.reduce((sum, o) => sum + (o.totalUsd || 0), 0);
    const totalBs = totalUSD * tasaBs;
    const deliveryOrders = approvedOrders.filter(o => o.deliveryMethod === 'delivery').length;
    const pickupOrders = approvedOrders.filter(o => o.deliveryMethod === 'pickup').length;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <DollarSign className="text-green-500" size={28} />
                        Cierre de Caja
                    </h3>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all"
                    >
                        <Download size={18} />
                        Imprimir
                    </button>
                </div>

                {/* Date Selector */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <button
                        onClick={() => {
                            setDateRange('today');
                            setSelectedDate(new Date().toISOString().split('T')[0]);
                        }}
                        className={`px-4 py-3 rounded-xl font-bold transition-all ${dateRange === 'today'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        📅 Hoy
                    </button>
                    <button
                        onClick={() => {
                            setDateRange('yesterday');
                            const y = new Date();
                            y.setDate(y.getDate() - 1);
                            setSelectedDate(y.toISOString().split('T')[0]);
                        }}
                        className={`px-4 py-3 rounded-xl font-bold transition-all ${dateRange === 'yesterday'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        📆 Ayer
                    </button>
                    <div className="col-span-2 flex items-center gap-2">
                        <Calendar className="text-gray-400" size={20} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setDateRange('custom');
                            }}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none"
                        />
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 p-6 rounded-2xl border border-green-700/50">
                        <p className="text-sm text-gray-400 mb-2">Total en USD</p>
                        <p className="text-3xl font-black text-green-400">${totalUSD.toFixed(2)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 p-6 rounded-2xl border border-blue-700/50">
                        <p className="text-sm text-gray-400 mb-2">Total en Bs</p>
                        <p className="text-3xl font-black text-blue-400">Bs {totalBs.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">Tasa: {tasaBs} Bs/$</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 p-6 rounded-2xl border border-orange-700/50">
                        <p className="text-sm text-gray-400 mb-2">Órdenes Aprobadas</p>
                        <p className="text-3xl font-black text-orange-400">{approvedOrders.length}</p>
                        <p className="text-xs text-gray-500 mt-1">de {filteredOrders.length} totales</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 p-6 rounded-2xl border border-purple-700/50">
                        <p className="text-sm text-gray-400 mb-2">Delivery / Pickup</p>
                        <p className="text-3xl font-black text-purple-400">{deliveryOrders} / {pickupOrders}</p>
                    </div>
                </div>

                {/* Orders Table */}
                {approvedOrders.length > 0 ? (
                    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-800">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase">Hora</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase">Cliente</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 uppercase">Método</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-300 uppercase">USD</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-300 uppercase">Bs</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {approvedOrders.map((order) => (
                                        <tr key={order.orderId} className="hover:bg-gray-800/50">
                                            <td className="px-4 py-3 text-sm text-gray-400">
                                                {new Date(order.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-white font-medium">
                                                {order.userName || order.customerName || 'Invitado'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.deliveryMethod === 'delivery'
                                                    ? 'bg-blue-900/50 text-blue-400'
                                                    : 'bg-green-900/50 text-green-400'
                                                    }`}>
                                                    {order.deliveryMethod === 'delivery' ? '🛵 Delivery' : '🏪 Pickup'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-bold text-green-400">
                                                ${order.totalUsd.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-bold text-blue-400">
                                                Bs {(order.totalUsd * tasaBs).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-800">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-4 text-right text-sm font-black text-white uppercase">
                                            Total del Día:
                                        </td>
                                        <td className="px-4 py-4 text-right text-lg font-black text-green-400">
                                            ${totalUSD.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-4 text-right text-lg font-black text-blue-400">
                                            Bs {totalBs.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-bold">No hay ventas aprobadas para esta fecha</p>
                    </div>
                )}
            </div>
        </div>
    );
};
