export const INSTAGRAM_URL = "https://www.instagram.com/rayburguergrill";
export const FACEBOOK_URL = "https://www.facebook.com/rayburguergrill";
export const WHATSAPP_NUMBER = "584128344594";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const IMAGE_PLACEHOLDER = "https://via.placeholder.com/400x300.png?text=RayburgerGrill";

export const RAYBURGERGRILL_LOGO_BASE64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJvcmFuZ2UiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1mbGFtZSI+PHBhdGggZD0iTTguNSAxNC41QTIuNSAyLjUgMCAwIDAgMTEgMTJjMC0xLjM4LS41LTItMS0zLTEuMDcyLTIuMTI2LTEuNS0zLjg3NC0xLjUtNkEyLjUgMi41IDAgMCAwIDkgMWMwIDIuMTI2LjQzIDMsMDcyIDEuNSA2IDAgLjc0OC41IDEgMS41IDJoLjVBMi41IDIyNSAwIDAgMSAxNiAxNC41YzAgMS45My0xLjg5NiAyLTMuNSAyLTEuNjE1IDAtMyAxLjUtMyAyLjVzMS43NzQgMi41IDMgMi41YzEuMTU3IDAgMy41LTEuNSAzLjUtNC41aDJjMCA0LjEtMy41IDYtNi41IDZjLTMuMDg1IDAtNS41LTItNS51LTRsMC01Yy41LTYuNzUgMy41LTEwIDYuNS0xMCIvPjwvc3ZnPg==";

export const ALL_CATEGORIES_KEY = "Todas";
export const INITIAL_TASA_BS = 35;
export const DELIVERY_TIERS = {
    Zone1: 1.0,
    Zone2: 2.0,
    Zone3: 3.0,
    Pickup: 0.0
};

export const PAGO_MOVIL_BANK = "Mercantil / Venezuela";
export const PAGO_MOVIL_ID = "V-13412781";
export const PAGO_MOVIL_PHONE = "0412-8344594";

export const SKIP_LINK_ID = "main-content";

// NUEVO SISTEMA DE LEALTAD (Dic 2024)
// Puntos = por comprar (% del monto según tier)
// Cashback = solo por referir (2% fijo)

// Tasa de puntos por tier (% del monto en USD)
export const POINTS_TIER_RATES = {
    Bronze: 0.03, // 3% del monto
    Silver: 0.05, // 5% del monto
    Gold: 0.08,   // 8% del monto
};

// Conversión: cuántos puntos valen $1
// Ejemplo: 100 puntos = $1 → POINTS_VALUE_IN_USD = 0.01
export const POINTS_VALUE_IN_USD = 0.01; // Cada punto vale $0.01

// Bono de bienvenida
export const WELCOME_BONUS_POINTS = 50;

// Referidos: Solo dan CASHBACK (saldo en $), no puntos
export const REFERRAL_CASHBACK_RATE = 0.02; // 2% del monto del referido

// DEPRECADO - Ya no se usan
export const POINTS_EARN_RATE_PER_USD = 0; // Deprecado
export const REFERRAL_BONUS_POINTS = 0; // Deprecado
export const CASHBACK_TIER_RATES = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 }; // Deprecado


export const ROULETTE_COOLDOWN_DAYS = 7;
export const UNLOCK_THRESHOLD = 100;

export interface RoulettePrize {
    id: string;
    type: 'points' | 'cashback' | 'nothing';
    value: number;
    label: string;
    probability: number; // Percentage (0-100)
    color: string;
}

export const ROULETTE_PRIZES: RoulettePrize[] = [
    { id: 'try_again', type: 'nothing', value: 0, label: 'Sigue Intentando', probability: 35, color: '#6b7280' },
    { id: 'points_25', type: 'points', value: 25, label: '25 Puntos', probability: 25, color: '#cd7f32' },
    { id: 'points_50', type: 'points', value: 50, label: '50 Puntos', probability: 20, color: '#C0C0C0' },
    { id: 'points_100', type: 'points', value: 100, label: '100 Puntos', probability: 12, color: '#22c55e' },
    { id: 'points_150', type: 'points', value: 150, label: '150 Puntos', probability: 5, color: '#eab308' },
    { id: 'points_200', type: 'points', value: 200, label: '200 Puntos', probability: 2.5, color: '#ef4444' },
    { id: 'jackpot', type: 'points', value: 500, label: 'JACKPOT 500pts', probability: 0.5, color: '#FFD700' },
];
