import React from 'react';
import { User, Order } from '../../types';
import { TrendingUp } from 'lucide-react';

interface MarketingManagementProps {
    registeredUsers: User[];
    updateUsers: (users: User[]) => Promise<void>;
    allOrders: (Order & { userEmail: string; userName: string; isGuest: boolean })[];
    yesterdayTotal: number;
    todayTotal: number;
    onShowToast: (msg: string) => void;
}

export const MarketingManagement: React.FC<MarketingManagementProps> = ({
    registeredUsers, updateUsers, yesterdayTotal, todayTotal, onShowToast
}) => {
    const now = Date.now();
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* FOUNDER CAMPAIGN SECTION */}
            <div className="bg-gradient-to-br from-orange-900/20 to-gray-800 p-8 rounded-2xl border border-orange-700/30 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    🏆 Campaña FUNDADOR
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                    Mensaje listo para enviar a tus clientes más cercanos. Copia y pega en WhatsApp.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 flex flex-col justify-center">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Ayer</p>
                        <p className="text-xl font-black text-blue-400 leading-none">${(yesterdayTotal || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-orange-700/30 flex flex-col justify-center">
                        <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-1">Hoy</p>
                        <p className="text-xl font-black text-white leading-none">${(todayTotal || 0).toFixed(2)}</p>
                    </div>
                </div>

                {/* Message Template */}
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 mb-4">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-3">📱 Mensaje para WhatsApp:</p>
                    <div className="bg-black/30 p-4 rounded-lg font-mono text-sm text-gray-300 whitespace-pre-wrap border border-gray-800 max-h-64 overflow-y-auto custom-scrollbar">
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
                        📋 Copiar Texto Completo
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

            {/* VIP LINK SECTION */}
            <div className="bg-gradient-to-br from-purple-900/20 to-gray-800 p-8 rounded-2xl border border-purple-700/30 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    🎁 Link VIP (2x Puntos)
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                    Comparte este enlace especial para que nuevos clientes se registren con doble puntos en su primera compra.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value="https://rayburgergrill.com.ve/?promo=VIP_RAY"
                        readOnly
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-purple-500 transition-all"
                    />
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText('https://rayburgergrill.com.ve/?promo=VIP_RAY');
                            onShowToast('🔗 Link VIP copiado');
                        }}
                        className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/30"
                    >
                        Copiar Enlace
                    </button>
                </div>
            </div>

            {/* RETENTION MARKETING */}
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="text-pink-500" /> Marketing de Retención
                </h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    Clientes que no han pedido en más de 7 días. ¡Envíales un recordatorio con un beneficio exclusivo para reactivarlos!
                </p>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {registeredUsers
                        .filter(u => {
                            if (u.role === 'admin') return false;
                            if (!u.orders || u.orders.length === 0) return true; // Never ordered
                            const lastOrder = Math.max(...u.orders.map(o => o.timestamp));
                            const daysSince = (now - lastOrder) / (1000 * 60 * 60 * 24);
                            return daysSince > 7;
                        })
                        .map(u => (
                            <div key={u.phone} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 group hover:border-pink-500/30 transition-all">
                                <div>
                                    <p className="font-bold text-white text-lg">{u.name} {u.lastName || ''}</p>
                                    <p className="text-gray-500 text-xs font-mono">+58 {u.phone}</p>
                                    <p className="text-pink-400 text-xs mt-1 font-bold">
                                        {!u.orders || u.orders.length === 0
                                            ? '⚠️ Sin pedidos previos'
                                            : '⏳ Última compra hace ' + Math.floor((now - Math.max(...u.orders.map(o => o.timestamp))) / (1000 * 60 * 60 * 24)) + ' días'}
                                    </p>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button
                                        onClick={() => {
                                            const updated = registeredUsers.map(user => user.phone === u.phone ? { ...user, nextPurchaseMultiplier: 2 } : user);
                                            updateUsers(updated);
                                            const msg = `🍔 ¡Felicidades! Te acabo de enviar un REGALO en Ray Burger Grill. 🎁✨\n\nTe activamos *DOBLE PUNTUACIÓN (2x)* en tu próxima compra para que canjees comida gratis más rápido. 🍟🔥\n\n¡Aprovecha aquí!: https://rayburgergrill.com.ve`;
                                            window.open(`https://wa.me/${u.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                            onShowToast(`✅ Beneficio 2X enviado a ${u.name}`);
                                        }}
                                        className="w-full px-4 py-2.5 bg-pink-600/10 hover:bg-pink-600 text-pink-500 hover:text-white border border-pink-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        📲 Enviar Beneficio 2X
                                    </button>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};
