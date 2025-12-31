import React from 'react';
import { User, Order } from '../../types';
import { AdminBI } from './AdminBI';
import { LogOut } from 'lucide-react';

interface StatsManagementProps {
    registeredUsers: User[];
    allOrders: (Order & { userEmail: string; userName: string; isGuest: boolean })[];
    tasaBs: number;
    onUpdateTasa: (newTasa: number) => Promise<void>;
    surveyStats: any;
    surveys: any[];
    logoutAdmin: () => void;
}

export const StatsManagement: React.FC<StatsManagementProps> = ({
    registeredUsers, allOrders, tasaBs, onUpdateTasa, surveyStats, surveys, logoutAdmin
}) => {
    // Filter out admins from all statistics
    const realCustomers = registeredUsers.filter(u => u.role !== 'admin');
    const posRegistered = realCustomers.filter(u => u.registeredVia === 'pos');
    const webRegistered = realCustomers.filter(u => !u.registeredVia || u.registeredVia === 'web');

    return (
        <div className="space-y-6 p-4 lg:p-8 animate-in fade-in duration-500">
            <AdminBI orders={allOrders} />

            {/* CUSTOMER ANALYTICS SECTION */}
            <div className="space-y-6 mt-8">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <span className="text-3xl">👥</span>
                    Análisis de Clientes
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Customers */}
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 p-6 rounded-xl border border-blue-700/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-blue-400 text-sm font-bold uppercase tracking-wider">Total Clientes</span>
                            <span className="text-2xl">👤</span>
                        </div>
                        <div className="text-4xl font-black text-white">{realCustomers.length}</div>
                        <div className="flex gap-2 mt-2 text-xs">
                            <span className="text-green-400">🏪 {posRegistered.length} POS</span>
                            <span className="text-blue-400">🌐 {webRegistered.length} Web</span>
                        </div>
                    </div>

                    {/* Total Points in Circulation */}
                    <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/10 p-6 rounded-xl border border-orange-700/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-orange-400 text-sm font-bold uppercase tracking-wider">Dinero en Billeteras</span>
                            <span className="text-2xl">💰</span>
                        </div>
                        <div className="text-4xl font-black text-white">
                            ${realCustomers.reduce((sum, u) => sum + (u.walletBalance_usd || 0), 0).toFixed(2)}
                        </div>
                        <p className="text-orange-400/60 text-xs mt-1">Saldo a favor (clientes reales)</p>
                    </div>

                    {/* Points Awarded Today */}
                    <div className="bg-gradient-to-br from-green-900/30 to-green-800/10 p-6 rounded-xl border border-green-700/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-green-400 text-sm font-bold uppercase tracking-wider">Recompensas Hoy</span>
                            <span className="text-2xl">🎁</span>
                        </div>
                        <div className="text-4xl font-black text-white">
                            ${(() => {
                                const today = new Date().toDateString();
                                const realCustomerEmails = new Set(realCustomers.map(u => u.email));
                                return allOrders
                                    .filter(o => o.status === 'approved' &&
                                        new Date(o.timestamp).toDateString() === today &&
                                        realCustomerEmails.has(o.userEmail))
                                    .reduce((sum, o) => sum + (o.rewardsEarned_usd || 0), 0);
                            })().toFixed(2)}
                        </div>
                        <p className="text-green-400/60 text-xs mt-1">Otorgado hoy en cashback</p>
                    </div>

                    {/* New Registrations Today */}
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 p-6 rounded-xl border border-purple-700/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-purple-400 text-sm font-bold uppercase tracking-wider">Nuevos Hoy</span>
                            <span className="text-2xl">🆕</span>
                        </div>
                        <div className="text-4xl font-black text-white">
                            {(() => {
                                const today = new Date().toDateString();
                                return realCustomers.filter(u => u.registrationDate && new Date(u.registrationDate).toDateString() === today).length;
                            })()}
                        </div>
                        <p className="text-purple-400/60 text-xs mt-1">Registros hoy</p>
                    </div>
                </div>

                {/* Registration Source Breakdown */}
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        📍 Origen de Registros
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-6 rounded-xl border border-green-700/30">
                            <div className="flex items-center gap-4">
                                <div className="text-5xl">🏪</div>
                                <div className="flex-1">
                                    <div className="text-3xl font-black text-green-500">{posRegistered.length}</div>
                                    <p className="text-green-400 font-bold">Registrados desde POS</p>
                                    <p className="text-green-400/60 text-xs mt-1">Invitados en persona</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-6 rounded-xl border border-blue-700/30">
                            <div className="flex items-center gap-4">
                                <div className="text-5xl">🌐</div>
                                <div className="flex-1">
                                    <div className="text-3xl font-black text-blue-500">{webRegistered.length}</div>
                                    <p className="text-blue-400 font-bold">Registrados desde Web</p>
                                    <p className="text-blue-400/60 text-xs mt-1">Llegaron orgánicamente</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trends & Best Day */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            📈 Registros Últimos 7 Días
                        </h3>
                        <div className="space-y-2">
                            {(() => {
                                const last7Days = Array.from({ length: 7 }, (_, i) => {
                                    const date = new Date();
                                    date.setDate(date.getDate() - i);
                                    return date;
                                }).reverse();

                                const registrationsByDay = last7Days.map(date => {
                                    const dateStr = date.toDateString();
                                    const count = realCustomers.filter(u =>
                                        u.registrationDate && new Date(u.registrationDate).toDateString() === dateStr
                                    ).length;
                                    return {
                                        dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
                                        dateLabel: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
                                        count
                                    };
                                });

                                const maxCount = Math.max(...registrationsByDay.map(d => d.count), 1);

                                return registrationsByDay.map((day, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <span className="text-gray-400 text-xs w-16 capitalize">{day.dayName} {day.dateLabel}</span>
                                        <div className="flex-1 bg-gray-900 rounded-full h-6 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-blue-600 to-blue-400 h-full flex items-center justify-end pr-2 transition-all"
                                                style={{ width: `${(day.count / maxCount) * 100}%` }}
                                            >
                                                {day.count > 0 && <span className="text-white text-xs font-bold">{day.count}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            🎯 Mejor Día para Publicar
                        </h3>
                        {(() => {
                            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                            const registrationsByDayOfWeek = Array(7).fill(0);

                            realCustomers.forEach(u => {
                                if (u.registrationDate) {
                                    const dayOfWeek = new Date(u.registrationDate).getDay();
                                    registrationsByDayOfWeek[dayOfWeek]++;
                                }
                            });

                            const maxDay = registrationsByDayOfWeek.indexOf(Math.max(...registrationsByDayOfWeek));
                            const maxCount = registrationsByDayOfWeek[maxDay];

                            return (
                                <div className="space-y-4">
                                    <div className="bg-gradient-to-r from-orange-900/30 to-orange-800/10 p-6 rounded-xl border border-orange-700/30 text-center">
                                        <div className="text-5xl mb-2">🔥</div>
                                        <div className="text-3xl font-black text-orange-500">{dayNames[maxDay]}</div>
                                        <p className="text-orange-400/60 text-sm mt-2">{maxCount} registros históricos</p>
                                    </div>
                                    <div className="space-y-1">
                                        {dayNames.map((day, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                <span className={`${idx === maxDay ? 'text-orange-400 font-bold' : 'text-gray-400'}`}>{day}</span>
                                                <span className={`${idx === maxDay ? 'text-orange-400 font-bold' : 'text-gray-500'}`}>{registrationsByDayOfWeek[idx]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Conversion Rate */}
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        💰 Tasa de Conversión
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(() => {
                            const usersWithOrders = realCustomers.filter(u => u.orders && u.orders.length > 0).length;
                            const conversionRate = realCustomers.length > 0 ? (usersWithOrders / realCustomers.length * 100).toFixed(1) : 0;
                            const avgOrdersPerCustomer = realCustomers.length > 0
                                ? (allOrders.filter(o => !o.isGuest && realCustomers.some(u => u.email === o.userEmail)).length / realCustomers.length).toFixed(1)
                                : 0;

                            return (
                                <>
                                    <div className="text-center">
                                        <div className="text-4xl font-black text-green-500">{conversionRate}%</div>
                                        <p className="text-gray-400 text-sm mt-1">Clientes que compran</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl font-black text-blue-500">{avgOrdersPerCustomer}</div>
                                        <p className="text-gray-400 text-sm mt-1">Pedidos promedio/cliente</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl font-black text-purple-500">{usersWithOrders}</div>
                                        <p className="text-gray-400 text-sm mt-1">Clientes activos</p>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>

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
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                        Calidad del Servicio
                        <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20">
                            {surveyStats?.totalSurveys || 0} Encuestas
                        </span>
                    </h3>

                    {surveyStats ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-6 bg-gray-900 p-4 rounded-xl border border-gray-800">
                                <div className="text-4xl font-black text-orange-500">{surveyStats.overall}</div>
                                <div>
                                    <p className="text-white font-bold">Puntaje General</p>
                                    <p className="text-gray-500 text-xs">Basado en todas las categorías</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                    <p className="text-xs text-gray-500 uppercase font-black">Comida</p>
                                    <p className="text-xl font-bold text-white">{surveyStats.averages.foodQuality}</p>
                                </div>
                                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                    <p className="text-xs text-gray-500 uppercase font-black">Servicio</p>
                                    <p className="text-xl font-bold text-white">{surveyStats.averages.service}</p>
                                </div>
                                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                    <p className="text-xs text-gray-500 uppercase font-black">Precio</p>
                                    <p className="text-xl font-bold text-white">{surveyStats.averages.price}</p>
                                </div>
                                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                    <p className="text-xs text-gray-500 uppercase font-black">Entrega</p>
                                    <p className="text-xl font-bold text-white">{surveyStats.averages.deliveryTime}</p>
                                </div>
                            </div>

                            <button onClick={logoutAdmin} className="mt-6 text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                <LogOut size={14} /> Cerrar Sesión Admin
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-gray-900 rounded-xl border border-gray-700 text-gray-500 font-medium italic">
                            Aún no hay encuestas suficientes
                        </div>
                    )}

                    {/* Recent Reviews List (Added back) */}
                    {surveys && surveys.length > 0 && (
                        <div className="mt-8 bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Reseñas Recientes</h4>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {surveys
                                    .slice()
                                    .sort((a, b) => b.timestamp - a.timestamp)
                                    .map((s: any) => (
                                        <div key={s.id} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-sm hover:border-orange-500/30 transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-orange-500 font-bold">{s.userId || 'Invitado'}</span>
                                                <span className="text-[10px] text-gray-600 font-mono">{new Date(s.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            {s.comments && <p className="text-gray-300 italic mb-3 leading-relaxed">"{s.comments}"</p>}
                                            <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 font-bold">
                                                <span className="bg-gray-900 px-2.5 py-1 rounded border border-gray-700">COMIDA: {s.ratings.foodQuality}</span>
                                                <span className="bg-gray-900 px-2.5 py-1 rounded border border-gray-700">SERVICIO: {s.ratings.service}</span>
                                                <span className="bg-gray-900 px-2.5 py-1 rounded border border-gray-700">PRECIO: {s.ratings.price}</span>
                                                <span className="bg-gray-900 px-2.5 py-1 rounded border border-gray-700">ENTREGA: {s.ratings.deliveryTime}</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
