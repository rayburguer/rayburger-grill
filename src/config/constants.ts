export const INSTAGRAM_URL = "https://www.instagram.com/rayburguergrill";
export const FACEBOOK_URL = "https://www.facebook.com/rayburguergrill";
export const WHATSAPP_NUMBER = "584128344594";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/KCKsBWq45Bs4ubSi9?g_st=awb";
export const IMAGE_PLACEHOLDER = "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop";

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

// NUEVA BILLETERA RAY (Dic 2024 - Simplificado)
// Recompensa = % del monto según gasto total acumulado

// Tasa de recompensa por tier (% del monto en USD)
export const REWARD_TIER_RATES = {
    Bronze: 0.03, // 3%
    Silver: 0.05, // 5%
    Gold: 0.08,   // 8%
};

// Bono de bienvenida directo en $
export const WELCOME_BONUS_USD = 0.50;

// Referidos: Ganan 2% del monto de la primera compra
export const REFERRAL_REWARD_RATE = 0.02;

// NIVELES DE LEALTAD (Basados en Gasto Total Acumulado $)
export const LOYALTY_TIERS = [
    { name: 'Bronze', minSpend: 0, minPoints: 0, color: 'text-orange-600' },
    { name: 'Silver', minSpend: 100, minPoints: 1000, color: 'text-gray-400' },
    { name: 'Gold', minSpend: 500, minPoints: 5000, color: 'text-yellow-400' },
];

export const ROULETTE_COOLDOWN_DAYS = 7;

export interface RoulettePrize {
    id: string;
    type: 'usd' | 'nothing';
    value: number;
    label: string;
    probability: number; // Percentage (0-100)
    color: string;
}

export const ROULETTE_PRIZES: RoulettePrize[] = [
    { id: 'try_again', type: 'nothing', value: 0, label: 'Sigue Intentando', probability: 40, color: '#6b7280' },
    { id: 'usd_025', type: 'usd', value: 0.25, label: '$0.25 Ray', probability: 30, color: '#cd7f32' },
    { id: 'usd_050', type: 'usd', value: 0.50, label: '$0.50 Ray', probability: 15, color: '#C0C0C0' },
    { id: 'usd_100', type: 'usd', value: 1.00, label: '$1.00 Ray', probability: 10, color: '#22c55e' },
    { id: 'usd_500', type: 'usd', value: 5.00, label: '$5.00 Ray', probability: 4, color: '#eab308' },
    { id: 'jackpot', type: 'usd', value: 20.00, label: 'JACKPOT $20', probability: 1, color: '#FFD700' },
];
