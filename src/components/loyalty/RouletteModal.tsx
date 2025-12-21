import React, { useState, useEffect, useRef } from 'react';
import { X, Gift, Clock, Sparkles } from 'lucide-react';
import { User } from '../../types';
import { useLoyalty } from '../../hooks/useLoyalty';
import { ROULETTE_COOLDOWN_DAYS, ROULETTE_PRIZES } from '../../config/constants';

interface RouletteModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User | null;
    onUpdateUser: (updatedUser: User) => void;
    onShowToast: (msg: string) => void;
}

const RouletteModal: React.FC<RouletteModalProps> = ({ isOpen, onClose, currentUser, onUpdateUser, onShowToast }) => {
    const { canSpin, spinRoulette } = useLoyalty();
    const [isSpinning, setIsSpinning] = useState(false);
    const [prize, setPrize] = useState<any | null>(null);
    const [canPlay, setCanPlay] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [rotation, setRotation] = useState(0);
    const [clapperActive, setClapperActive] = useState(false);

    const wheelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && currentUser) {
            const available = canSpin(currentUser);
            setCanPlay(available);

            if (!available && currentUser.lastSpinDate) {
                const updateCountdown = () => {
                    const nextSpin = currentUser.lastSpinDate + (ROULETTE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
                    const diff = nextSpin - Date.now();
                    if (diff <= 0) {
                        setCanPlay(true);
                        return;
                    }
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    setTimeRemaining(`${days}d ${hours}h ${mins}m`);
                };
                updateCountdown();
                const interval = setInterval(updateCountdown, 60000);
                return () => clearInterval(interval);
            }
        }
    }, [isOpen, currentUser, canSpin]);

    const handleSpin = () => {
        if (!currentUser || isSpinning || !canPlay) return;

        setIsSpinning(true);
        setPrize(null);
        setClapperActive(true);

        // 1. Get the result from the hook
        const { result, updatedUser } = spinRoulette(currentUser);

        // 2. Calculate the destination angle
        // Find the index of the prize in the ROULETTE_PRIZES array
        const prizeIndex = ROULETTE_PRIZES.findIndex(p => p.id === result.id);
        const segmentAngle = 360 / ROULETTE_PRIZES.length;

        // The wheel starts at 0. We want the prize to be at the TOP (pointer position).
        // Each segment is segmentAngle wide. 
        // Index 0 is at [0, segmentAngle]. Center of index 0 is at segmentAngle/2.
        // To put center of index I at the top (270deg or -90deg in CSS rotation context often):
        // Actually, CSS rotation 0 has the right-side pointing East. 
        // My segments are drawn with origin-bottom-left and rotated.

        const fullSpins = 5 + Math.floor(Math.random() * 5);
        // Angle to put prize at the pointer (top = 0deg in our SVG/Div setup if pointer is at top)
        // Adjust for the fact that the wheel rotates clockwise.
        const targetAngle = 360 - (prizeIndex * segmentAngle) - (segmentAngle / 2);
        const finalRotation = (fullSpins * 360) + targetAngle;

        setRotation(finalRotation);

        // Visual finish
        setTimeout(() => {
            setIsSpinning(false);
            setClapperActive(false);
            setPrize(result);
            onUpdateUser(updatedUser);
            setCanPlay(false);

            if (result.type !== 'nothing') {
                import('canvas-confetti').then((confetti) => {
                    confetti.default({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#f97316', '#fbbf24', '#ffffff']
                    });
                });
            }
        }, 4000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 overflow-y-auto">
            <style>{`
                @keyframes neon-pulse {
                    0%, 100% { box-shadow: 0 0 20px #f97316, inset 0 0 10px #f97316; border-color: #fb923c; }
                    50% { box-shadow: 0 0 40px #ea580c, inset 0 0 20px #ea580c; border-color: #ffedd5; }
                }
                @keyframes clapper-hit {
                    0%, 100% { transform: translateX(-50%) rotate(0deg); }
                    50% { transform: translateX(-50%) rotate(-20deg); }
                }
                .clapper-animate {
                    animation: clapper-hit 0.1s infinite;
                }
                .wheel-neon {
                    animation: neon-pulse 2s infinite;
                }
            `}</style>

            <div className="bg-gray-900 w-full max-w-xl rounded-[2.5rem] border-4 border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col items-center">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-[110] p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
                >
                    <X size={24} />
                </button>

                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent pointer-events-none" />

                {/* Header */}
                <div className="pt-12 pb-8 flex flex-col items-center z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1 bg-orange-500/20 rounded-full border border-orange-500/30 text-orange-400 text-xs font-bold tracking-widest uppercase mb-4">
                        <Sparkles size={14} className="animate-pulse" /> Ray Burger Club
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter text-center">
                        RULETA <span className="text-orange-500">SEMANAL</span>
                    </h2>
                    <p className="text-gray-400 text-sm mt-2 text-center max-w-xs">
                        ¡Gira cada 7 días para ganar puntos acumulables y premios sorpresa!
                    </p>
                </div>

                {/* Roulette Body */}
                <div className="relative w-full flex flex-col items-center pb-12 pt-4 px-8 z-10">

                    {/* The Wheel Container */}
                    <div className="relative w-72 h-72 sm:w-80 sm:h-80 mb-10">
                        {/* Lighting Frame */}
                        <div className="absolute inset-[-12px] rounded-full wheel-neon border-8 border-gray-800" />

                        {/* Pointer (Clapper) */}
                        <div
                            className={`absolute top-[-20px] left-1/2 z-30 w-10 h-12 bg-white shadow-2xl origin-top transition-transform ${clapperActive ? 'clapper-animate' : ''}`}
                            style={{
                                clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                                filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))'
                            }}
                        />

                        {/* The Moving Wheel */}
                        <div
                            ref={wheelRef}
                            className="w-full h-full rounded-full border-4 border-gray-700 relative overflow-hidden bg-gray-900 shadow-2xl"
                            style={{
                                transform: `rotate(${rotation}deg)`,
                                transition: isSpinning ? 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)' : 'none'
                            }}
                        >
                            {ROULETTE_PRIZES.map((p, i) => {
                                const angle = (360 / ROULETTE_PRIZES.length) * i;
                                const skewY = 90 - (360 / ROULETTE_PRIZES.length);
                                return (
                                    <div
                                        key={p.id}
                                        className="absolute w-[50%] h-[50%] top-0 right-0 origin-bottom-left flex items-start justify-center pt-8"
                                        style={{
                                            transform: `rotate(${angle}deg) skewY(-${skewY}deg)`,
                                            backgroundColor: p.color,
                                            borderLeft: '2px solid rgba(0,0,0,0.2)',
                                        }}
                                    >
                                        <div
                                            className="font-black text-white text-sm tracking-tighter flex flex-col items-center gap-1"
                                            style={{
                                                transform: `skewY(${skewY}deg) rotate(${360 / ROULETTE_PRIZES.length / 2}deg) translate(25px, 0) rotate(90deg)`,
                                            }}
                                        >
                                            <span className="opacity-80 text-[10px] uppercase">{p.type === 'points' ? 'Pts' : p.type === 'cashback' ? 'USD' : ''}</span>
                                            <span className="text-lg">{p.value === 0 ? 'X' : p.value}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Center Cap */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gray-900 border-4 border-orange-500 rounded-full z-20 flex items-center justify-center shadow-2xl">
                            <div className="text-orange-500 font-display font-black text-xl italic tracking-tighter leading-none text-center">
                                RAY<br /><span className="text-[10px] text-white">grill</span>
                            </div>
                        </div>
                    </div>

                    {/* Controls & Status */}
                    <div className="w-full max-w-xs text-center">
                        {!prize ? (
                            <>
                                {!currentUser ? (
                                    <div className="bg-gray-800/80 p-6 rounded-3xl border border-gray-700 shadow-xl">
                                        <p className="text-white font-bold text-lg mb-2">¡Únete al Club!</p>
                                        <p className="text-gray-400 text-xs mb-4">Regístrate para poder girar la ruleta y acumular puntos reales.</p>
                                        <button
                                            onClick={onClose}
                                            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-2xl transition-all"
                                        >
                                            Ir al Registro
                                        </button>
                                    </div>
                                ) : canPlay ? (
                                    <button
                                        onClick={handleSpin}
                                        disabled={isSpinning}
                                        className="w-full group relative overflow-hidden h-16 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-black text-xl italic tracking-wider shadow-[0_10px_30px_rgba(234,88,12,0.4)] hover:shadow-[0_15px_40px_rgba(234,88,12,0.6)] hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="relative z-10">{isSpinning ? '¡GIRO EN CURSO!' : '¡GIRAR AHORA!'}</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                    </button>
                                ) : (
                                    <div className="bg-gray-800/50 p-6 rounded-3xl border border-gray-700/50">
                                        <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-2">Próximo giro disponible en</p>
                                        <div className="text-3xl font-black text-white font-mono flex items-center justify-center gap-3">
                                            <Clock size={28} className="text-orange-500" /> {timeRemaining}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="bg-white rounded-3xl p-8 shadow-[0_20px_60px_rgba(255,255,255,0.1)] animate-in fade-in zoom-in duration-500 flex flex-col items-center">
                                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                                    {prize.type === 'nothing' ? <Clock size={40} className="text-gray-400" /> : <Gift size={40} className="text-orange-500 animate-bounce" />}
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 uppercase italic leading-tight mb-2">
                                    {prize.type === 'nothing' ? '¡CASI LO LOGRAS!' : `¡GANASTE ${prize.label}!`}
                                </h3>
                                <p className="text-gray-500 text-sm mb-6 px-4">
                                    {prize.type === 'nothing'
                                        ? 'No te preocupes, el próximo lunes tendrás un nuevo giro esperándote.'
                                        : 'Tu premio ha sido acreditado en tu cuenta automáticamente. ¡Disfrútalo!'}
                                </p>
                                <button
                                    onClick={onClose}
                                    className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-lg"
                                >
                                    ¡EXCELENTE!
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer text */}
                <p className="pb-8 text-[10px] text-gray-600 uppercase font-black tracking-widest opacity-50">
                    Sorteo regulado por Ray Burger Grill &bull; 1 giro por cliente a la semana
                </p>
            </div>
        </div>
    );
};

export default RouletteModal;
