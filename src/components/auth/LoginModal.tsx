import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../ui/Modal';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (email: string, password: string) => void;
    onOpenRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, onOpenRegister }) => {
    const [identifier, setIdentifier] = useState<string>(''); // Can be email or phone
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (!isOpen) {
            setIdentifier('');
            setPassword('');
            setError('');
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

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (identifier.trim() === '' || password.trim() === '') {
            setError('Por favor, ingresa tu teléfono y contraseña.');
            return;
        }
        onLogin(identifier, password);
    }, [identifier, password, onLogin]);

    const handleRegisterRedirect = useCallback(() => {
        onClose();
        onOpenRegister();
    }, [onClose, onOpenRegister]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Inicia Sesión">
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
                        className="w-full px-4 py-3 rounded-md bg-gray-700 text-white border-2 border-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-300 placeholder-gray-400 text-lg"
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
                        className="w-full px-4 py-3 rounded-md bg-gray-700 text-white border-2 border-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-300 placeholder-gray-400 text-lg"
                        aria-required="true"
                    />
                </div>
                {error && <p className="text-red-500 text-sm mt-1" role="alert">{error}</p>}
                <button
                    type="submit"
                    className="w-full mt-6 py-3 rounded-full text-lg font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    aria-label="Iniciar sesión"
                >
                    Iniciar Sesión
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
