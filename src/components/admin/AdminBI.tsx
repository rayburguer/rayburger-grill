import React, { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { TrendingUp, ShoppingBag, Truck } from 'lucide-react';
import { Order } from '../../types';

interface AdminBIProps {
    orders: (Order & { userEmail: string; userName: string; isGuest: boolean })[];
}

export const AdminBI: React.FC<AdminBIProps> = ({ orders }) => {
    const stats = useMemo(() => {
        // Daily Sales (Last 7 days)
        const dailyMap = new Map();
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            dailyMap.set(key, 0);
        }

        const productMap = new Map();
        let deliveryCount = 0;
        let pickupCount = 0;

        orders.forEach(order => {
            // Daily Sales
            const dateKey = new Date(order.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            if (dailyMap.has(dateKey)) {
                dailyMap.set(dateKey, dailyMap.get(dateKey) + (order.totalUsd || 0));
            }

            // Top Products
            order.items?.forEach((item: any) => {
                productMap.set(item.name, (productMap.get(item.name) || 0) + (item.quantity || 0));
            });

            // Delivery vs Pickup
            if (order.deliveryMethod === 'delivery') deliveryCount++;
            else pickupCount++;
        });

        const dailyData = Array.from(dailyMap).map(([name, total]) => ({ name, total }));
        const productData = Array.from(productMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const deliveryData = [
            { name: 'Delivery', value: deliveryCount, color: '#f97316' },
            { name: 'Retiro', value: pickupCount, color: '#6366f1' }
        ];

        return { dailyData, productData, deliveryData };
    }, [orders]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500/20 rounded-xl text-orange-500">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Ventas Totales</p>
                            <h4 className="text-2xl font-black text-white">$ {orders.reduce((acc, o) => acc + (o.totalUsd || 0), 0).toFixed(2)}</h4>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-500">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Pedidos Realizados</p>
                            <h4 className="text-2xl font-black text-white">{orders.length}</h4>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-500">
                            <Truck size={24} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Crecimiento</p>
                            <h4 className="text-2xl font-black text-white">Saludable</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales Chart */}
                <div className="bg-gray-800/80 backdrop-blur-md p-6 rounded-[2rem] border border-gray-700 shadow-2xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="text-orange-500" /> Rendimiento de Ventas (USD)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.dailyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                                    itemStyle={{ color: '#f97316' }}
                                />
                                <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={4} dot={{ r: 6, fill: '#f97316' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-gray-800/80 backdrop-blur-md p-6 rounded-[2rem] border border-gray-700 shadow-2xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <ShoppingBag className="text-indigo-500" /> Productos Más Vendidos
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.productData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={10} width={100} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                                />
                                <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                                    {stats.productData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#f97316' : '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Delivery Mix */}
                <div className="bg-gray-800/80 backdrop-blur-md p-6 rounded-[2rem] border border-gray-700 shadow-2xl lg:col-span-2">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Truck className="text-emerald-500" /> Preferencia de Entrega
                    </h3>
                    <div className="h-[300px] w-full flex flex-col md:flex-row items-center justify-around">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.deliveryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {stats.deliveryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-2 gap-8 w-full md:w-auto px-8">
                            <div className="text-center">
                                <p className="text-orange-500 text-3xl font-black">{stats.deliveryData[0].value}</p>
                                <p className="text-gray-400 text-xs uppercase font-bold">Delivery</p>
                            </div>
                            <div className="text-center">
                                <p className="text-indigo-500 text-3xl font-black">{stats.deliveryData[1].value}</p>
                                <p className="text-gray-400 text-xs uppercase font-bold">Pick-up</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
