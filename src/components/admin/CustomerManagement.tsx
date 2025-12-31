import React, { useState } from 'react';
import { User } from '../../types';
import { WELCOME_BONUS_USD } from '../../config/constants';
import { normalizePhone } from '../../utils/helpers';
import { hashPassword } from '../../utils/security';
import {
    Download, Edit, RefreshCw, Users, X, User as UserIcon
} from 'lucide-react';

interface CustomerManagementProps {
    registeredUsers: User[];
    updateUsers: (users: User[]) => Promise<void>;
    onShowToast: (msg: string) => void;
    mergeDuplicates: () => Promise<{ error?: string; merged?: number; deleted?: number }>;
    isSyncing: boolean;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
    registeredUsers,
    updateUsers,
    onShowToast,
    mergeDuplicates,
    isSyncing
}) => {
    const [isEditingCustomer, setIsEditingCustomer] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Partial<User>>({});
    const [showPasswords, setShowPasswords] = useState(false);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h3 className="font-bold text-orange-500 mb-4">Registro POS</h3>
                        <form onSubmit={async (e: any) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const phone = formData.get('phone') as string;
                            const normalizedPhone = normalizePhone(phone);
                            const name = formData.get('name') as string;
                            const lastName = formData.get('lastName') as string;
                            const birthDate = formData.get('birthDate') as string;

                            if (!normalizedPhone) return;

                            const exists = registeredUsers.find(u =>
                                normalizePhone(u.phone) === normalizedPhone ||
                                u.email === normalizedPhone + "@rayburger.app"
                            );

                            if (exists) {
                                onShowToast(`⚠️ El cliente ya existe: ${exists.name}`);
                                return;
                            }

                            const newUser: User = {
                                email: normalizedPhone + "@rayburger.app",
                                phone: normalizedPhone,
                                name: name || "Cliente",
                                lastName: lastName || undefined,
                                birthDate: birthDate || undefined,
                                walletBalance_usd: WELCOME_BONUS_USD,
                                lifetimeSpending_usd: 0,
                                referralCode: 'POS-' + Date.now(),
                                role: 'customer',
                                orders: [],
                                loyaltyTier: 'Bronze',
                                passwordHash: '1234',
                                registrationDate: Date.now(),
                                registeredVia: 'pos',
                                points: 50
                            };
                            await updateUsers([...registeredUsers, newUser]);
                            e.target.reset();
                            onShowToast('✅ Cliente registrado desde POS');
                        }} className="space-y-3">
                            <input
                                name="phone"
                                placeholder="Teléfono (11 dígitos) *"
                                required
                                pattern="[0-9]{11}"
                                maxLength={11}
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white placeholder-gray-500"
                            />
                            <input
                                name="name"
                                placeholder="Nombre"
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white placeholder-gray-500"
                            />
                            <input
                                name="lastName"
                                placeholder="Apellido (recomendado)"
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white placeholder-gray-500"
                            />
                            <div>
                                <label className="block text-gray-400 text-xs mb-1">Cumpleaños (opcional)</label>
                                <input
                                    name="birthDate"
                                    type="date"
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                                />
                            </div>
                            <button className="w-full bg-orange-600 hover:bg-orange-700 py-2 rounded font-bold transition-colors">
                                Inscribir Cliente
                            </button>
                        </form>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white">Base de Datos ({registeredUsers.length})</h3>
                        <button
                            onClick={() => {
                                const csv = "Nombre,Telefono,Saldo,Email\n" + registeredUsers.map(u => `${u.name},${u.phone},$${(u.walletBalance_usd || 0).toFixed(2)},${u.email}`).join("\n");
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `clientes_rayburger_${new Date().toISOString().split('T')[0]}.csv`;
                                a.click();
                                onShowToast('📊 Lista de clientes descargada (CSV)');
                            }}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] font-black uppercase rounded border border-gray-600 transition-all flex items-center gap-1"
                        >
                            <Download size={12} /> Exportar CSV
                        </button>
                    </div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {registeredUsers.map(u => (
                            <div key={u.phone} className="bg-gray-900/50 p-3 rounded border border-gray-800 flex justify-between items-center group">
                                <div
                                    className="cursor-pointer hover:bg-white/5 p-1 rounded transition-all flex-1"
                                    onClick={() => {
                                        setCustomerToEdit(u);
                                        setIsEditingCustomer(true);
                                    }}
                                >
                                    <p className="font-bold text-white text-sm">
                                        {(['Cliente', 'Cliente Nuevo', 'Invitado'].includes(u.name) || !u.name) ? <span className="text-orange-500/50 italic">Sin nombre (Tocar para editar)</span> : `${u.name} ${u.lastName || ''}`}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-mono">+58 {normalizePhone(u.phone)}</p>
                                    {showPasswords && (
                                        <p className="text-[10px] text-orange-400 mt-1">
                                            Clave: <span className="bg-orange-900/20 px-1 rounded">{u.passwordHash === '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4' ? '1234' : '••••••'}</span>
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right mr-2">
                                        <p className="text-orange-500 font-bold text-sm">${(u.walletBalance_usd || 0).toFixed(2)}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setCustomerToEdit(u);
                                            setIsEditingCustomer(true);
                                        }}
                                        className="p-2 text-orange-500 hover:bg-orange-900/20 rounded transition-all"
                                        title="Editar Nombre/Apellido"
                                    >
                                        <Edit size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="text-[10px] font-black uppercase text-gray-500 hover:text-orange-500"
                        >
                            {showPasswords ? 'Ocultar Claves' : 'Ver Claves (Modo Gestión)'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-6 p-6 bg-purple-900/10 border border-purple-500/20 rounded-2xl">
                <h4 className="text-purple-500 font-bold mb-4 flex items-center gap-2">
                    🧬 Unificación de Clientes
                </h4>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                    Detecta clientes duplicados por número de teléfono, suma sus saldos en una cuenta maestra y elimina los registros sobrantes.
                </p>
                <button
                    onClick={async () => {
                        if (confirm('🧬 ¿Fusionar clientes duplicados?\n\nEsto agrupará saldos y pedidos de usuarios con el mismo teléfono.\nEsta acción no se puede deshacer.')) {
                            const result = await mergeDuplicates();
                            if (result.error) {
                                onShowToast('❌ Error: ' + result.error);
                            } else {
                                if (result.merged && result.merged > 0) {
                                    onShowToast(`✅ Éxito: ${result.merged} cuentas fusionadas y ${result.deleted} duplicados eliminados.`);
                                    setTimeout(() => window.location.reload(), 2000);
                                } else {
                                    onShowToast('✨ No se encontraron duplicados para fusionar.');
                                }
                            }
                        }
                    }}
                    disabled={isSyncing}
                    className="w-full sm:w-auto px-6 py-3 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/30 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                    {isSyncing ? <RefreshCw className="animate-spin" size={16} /> : <Users size={16} />}
                    Fusionar Duplicados
                </button>
            </div>

            {/* CUSTOMER EDIT MODAL */}
            {isEditingCustomer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-gray-800 border border-gray-700 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <UserIcon size={20} className="text-orange-500" /> Editar Cliente
                            </h3>
                            <button onClick={() => setIsEditingCustomer(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase mb-2 tracking-widest">Nombre</label>
                                <input
                                    type="text"
                                    value={customerToEdit.name || ''}
                                    onChange={(e) => setCustomerToEdit({ ...customerToEdit, name: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-orange-500 transition-all font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase mb-2 tracking-widest">Apellido</label>
                                <input
                                    type="text"
                                    value={customerToEdit.lastName || ''}
                                    onChange={(e) => setCustomerToEdit({ ...customerToEdit, lastName: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-orange-500 transition-all font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase mb-2 tracking-widest">Teléfono (Solo Lectura)</label>
                                <input
                                    type="text"
                                    value={customerToEdit.phone || ''}
                                    readOnly
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-500 outline-none font-mono cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase mb-2 tracking-widest">Saldo en Billetera</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={customerToEdit.walletBalance_usd || 0}
                                        onChange={(e) => setCustomerToEdit({ ...customerToEdit, walletBalance_usd: parseFloat(e.target.value) || 0 })}
                                        className="flex-1 bg-gray-900 border border-gray-700 rounded-xl p-3 text-orange-500 outline-none focus:border-orange-500 transition-all font-black text-xl"
                                    />
                                    <div className="text-gray-500 text-xs font-bold w-20">
                                        USD
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-700 flex flex-col gap-3">
                                <p className="text-[10px] text-gray-500 text-center px-4">
                                    Si el cliente olvidó su clave, puedes resetearla a <span className="text-orange-500 font-bold">1234</span>
                                </p>
                                <button
                                    onClick={async () => {
                                        if (confirm(`¿Resetear la clave de ${customerToEdit.name} a "1234"?`)) {
                                            const hash = await hashPassword('1234');
                                            setCustomerToEdit({ ...customerToEdit, passwordHash: hash });
                                            onShowToast('🔑 Clave reseteada a 1234. ¡No olvides guardar!');
                                        }
                                    }}
                                    className="w-full py-2 border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    Resetear Clave a 1234
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsEditingCustomer(false)}
                                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    if (!customerToEdit.name) {
                                        onShowToast('❌ El nombre es obligatorio');
                                        return;
                                    }
                                    const updatedUsers = registeredUsers.map(u => u.phone === customerToEdit.phone ? ({ ...u, ...customerToEdit } as User) : u);
                                    await updateUsers(updatedUsers);
                                    setIsEditingCustomer(false);
                                    onShowToast('✅ Cliente actualizado correctamente');
                                }}
                                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-900/20"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
