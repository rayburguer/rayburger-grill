import React from 'react';
import { Instagram, Facebook, MessageSquare } from 'lucide-react';
import { INSTAGRAM_URL, FACEBOOK_URL, WHATSAPP_URL } from '../../config/constants';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 to-gray-700 text-white p-4 text-center shadow-lg">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                <p className="text-sm text-gray-300">
                    &copy; {currentYear} RayburgerGrill. Todos los derechos reservados.
                </p>
                <div className="flex space-x-4 items-center">
                    <a href="/admin" className="text-[10px] text-gray-600 hover:text-gray-400 no-underline opacity-50">
                        Acceso Personal
                    </a>
                    <a
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-orange-500 transition-colors duration-300"
                        aria-label="Visita nuestro Instagram"
                    >
                        <Instagram className="w-6 h-6" />
                    </a>
                    <a
                        href={FACEBOOK_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-orange-500 transition-colors duration-300"
                        aria-label="Visita nuestro Facebook"
                    >
                        <Facebook className="w-6 h-6" />
                    </a>
                    <a
                        href={WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-orange-500 transition-colors duration-300"
                        aria-label="Contáctanos por WhatsApp"
                    >
                        <MessageSquare className="w-6 h-6" />
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
