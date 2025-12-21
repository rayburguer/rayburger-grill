import confetti from 'canvas-confetti';

interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
}

export const triggerConfetti = (options?: ConfettiOptions) => {
    const defaults = {
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EA580C', '#F97316', '#FDBA74', '#FFF'], // Orange fire colors
    };

    confetti({
        ...defaults,
        ...options,
    });
};

export const triggerSuccessConfetti = () => {
    // More dramatic confetti for order confirmation
    const count = 200;
    const defaults = {
        origin: { y: 0.7 },
        colors: ['#EA580C', '#F97316', '#FDBA74', '#FFF', '#FFD700'],
    };

    function fire(particleRatio: number, opts: any) {
        confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
        });
    }

    fire(0.25, {
        spread: 26,
        startVelocity: 55,
    });

    fire(0.2, {
        spread: 60,
    });

    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
    });

    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
    });

    fire(0.1, {
        spread: 120,
        startVelocity: 45,
    });
};
