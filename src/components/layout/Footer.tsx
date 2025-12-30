import React from 'react';
import { Instagram, Facebook, MapPin, Eye } from 'lucide-react';
import { INSTAGRAM_URL, FACEBOOK_URL, GOOGLE_MAPS_URL } from '../../config/constants';
import { useCloudSync } from '../../hooks/useCloudSync';

interface FooterProps {
    onAdminClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
    const currentYear = new Date().getFullYear();
    const { fetchFromCloud } = useCloudSync();
    const [visitorCount, setVisitorCount] = React.useState<number | null>(null);

    React.useEffect(() => {
        const getStats = async () => {
            const { data } = await fetchFromCloud('rb_site_stats');
            if (data) {
                const visitors = data.find((s: any) => s.id === 'visitors');
                if (visitors) setVisitorCount(Number(visitors.value));
            }
        };
        getStats();
        // Refresh every 5 minutes
        const interval = setInterval(getStats, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchFromCloud]);

    return (
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 to-gray-700 text-white p-4 text-center shadow-lg border-t border-orange-500/20">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex flex-col sm:items-start">
                    <p className="text-sm text-gray-300">
                        &copy; {currentYear} RayburgerGrill.
                    </p>
                    {visitorCount !== null && (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono uppercase tracking-widest mt-0.5">
                            <Eye size={10} className="animate-pulse text-orange-500" />
                            <span>Visitas: {visitorCount.toLocaleString()}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <a
                        href={GOOGLE_MAPS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-full text-xs font-black uppercase transition-all shadow-lg hover:-translate-y-1 active:scale-95 group"
                    >
                        <MapPin size={14} className="group-hover:animate-bounce" />
                        📍 Cómo llegar
                    </a>
                </div>

                <div className="flex space-x-4 items-center">
                    <button
                        onClick={onAdminClick}
                        className="text-[10px] text-gray-600 hover:text-orange-500 transition-colors uppercase font-bold tracking-widest opacity-70 hover:opacity-100"
                    >
                        🔒 Admin
                    </button>
                    <a
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-orange-500 transition-colors duration-300"
                        aria-label="Instagram"
                    >
                        <Instagram className="w-5 h-5" />
                    </a>
                    <a
                        href={FACEBOOK_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-orange-500 transition-colors duration-300"
                        aria-label="Facebook"
                    >
                        <Facebook className="w-5 h-5" />
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
