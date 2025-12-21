import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';

interface QRCodeDisplayProps {
    value: string;
    title: string;
    subtitle?: string;
    downloadable?: boolean;
    size?: number;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
    value,
    title,
    subtitle,
    downloadable = false,
    size = 200
}) => {
    const handleDownload = () => {
        const svg = document.getElementById(`qr-${value.slice(-8)}`);
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        canvas.width = size * 2;
        canvas.height = size * 2;

        img.onload = () => {
            ctx?.drawImage(img, 0, 0, size * 2, size * 2);
            const pngFile = canvas.toDataURL('image/png');

            const downloadLink = document.createElement('a');
            downloadLink.download = `rayburger-qr-${Date.now()}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-gray-800/40 backdrop-blur-md rounded-2xl border border-white/10">
            <div className="text-center">
                <h3 className="text-xl font-display font-bold text-white mb-1">{title}</h3>
                {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
            </div>

            <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG
                    id={`qr-${value.slice(-8)}`}
                    value={value}
                    size={size}
                    level="H"
                    includeMargin={true}
                    fgColor="#1a1a1a"
                    bgColor="#ffffff"
                />
            </div>

            {downloadable && (
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors"
                >
                    <Download size={18} />
                    Descargar QR
                </button>
            )}

            <p className="text-xs text-gray-500 text-center max-w-xs">
                Escanea este código con tu cámara para acceder rápidamente
            </p>
        </div>
    );
};

export default QRCodeDisplay;
