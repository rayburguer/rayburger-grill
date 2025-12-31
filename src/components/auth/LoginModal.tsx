import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (email: string, password: string) => Promise<boolean>; // Returns true if success, false if fail
    onOpenRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, onOpenRegister }) => {
    // ... state ...
    const [identifier, setIdentifier] = useState<string>(''); // Can be email or phone
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIdentifier('');
            setPassword('');
            setError('');
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleIdentifierChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setIdentifier(e.target.value);
        setError('');
    }, []);

    const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        setError('');
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (identifier.trim() === '' || password.trim() === '') {
            setError('Por favor, ingresa tu teléfono y contraseña.');
            return;
        }

        setIsLoading(true);
        setError('');

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 600));

        try {
            const success = await onLogin(identifier, password);
            if (!success) {
                setError('Credenciales incorrectas. Verifica tu teléfono/email y contraseña.');
            }
        } catch (err) {
            console.error("Login error", err);
            setError('Ocurrió un error al iniciar sesión.');
        } finally {
            setIsLoading(false);
        }
    }, [identifier, password, onLogin]);

    const handleRegisterRedirect = useCallback(() => {
        onClose();
        onOpenRegister();
    }, [onClose, onOpenRegister]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Inicia Sesión (v2.0)">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="loginIdentifier" className="block text-white text-lg font-semibold mb-2">Teléfono (o Email)</label>
                    <input
                        id="loginIdentifier"
                        type="text"
                        placeholder="Ingresa tu teléfono (11 dígitos)"
                        value={identifier}
                        onChange={handleIdentifierChange}
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-md bg-gray-700 text-white border-2 border-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-300 placeholder-gray-400 text-lg disabled:opacity-50"
                        aria-required="true"
                    />
                </div>
                <div>
                    <label htmlFor="loginPassword" className="block text-white text-lg font-semibold mb-2">Contraseña</label>
                    <input
                        id="loginPassword"
                        type="password"
                        placeholder="Tu contraseña"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-md bg-gray-700 text-white border-2 border-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-300 placeholder-gray-400 text-lg disabled:opacity-50"
                        aria-required="true"
                    />
                </div>
                {error && <p className="text-red-500 text-sm mt-1 bg-red-900/10 p-2 rounded border border-red-500/20" role="alert">⚠️ {error}</p>}
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full mt-6 py-3 rounded-full text-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center justify-center gap-2
                        ${isLoading ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg active:scale-95'}`}
                    aria-label={isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Entrando...
                        </>
                    ) : (
                        'Iniciar Sesión'
                    )}
                </button>
            </form>
            <p className="text-gray-400 text-center mt-4 text-sm">
                ¿No tienes cuenta?{' '}
                <button type="button" onClick={handleRegisterRedirect} className="text-orange-400 hover:underline focus:outline-none focus:ring-2 focus:ring-orange-400 rounded">
                    Regístrate aquí.
                </button>
            </p>
        </Modal>
    );
};

export default LoginModal;
