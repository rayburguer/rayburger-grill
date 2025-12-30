export interface RewardMilestone {
    points: number;
    name: string;
    emoji: string;
    description: string;
    value: number; // Value in $
}

export const REWARD_MILESTONES: RewardMilestone[] = [
    { points: 100, name: "Salsa Extra Gratis", emoji: "🥫", description: "Una tarrina de 2oz de tu salsa favorita.", value: 0.25 },
    { points: 300, name: "Papas Fritas Regular", emoji: "🍟", description: "Una ración de papas fritas clásicas.", value: 1.50 },
    { points: 600, name: "Refresco 1L", emoji: "🥤", description: "Un refresco de 1 litro para acompañar.", value: 2.00 },
    { points: 1000, name: "Hamburguesa Clásica", emoji: "🍔", description: "¡Una Clásica del Rey totalmente gratis!", value: 5.00 },
    { points: 2000, name: "Combo Dúo", emoji: "👫", description: "2 Hamburguesas Clásicas + Papas + Refresco.", value: 12.00 },
];

// Anti-Fraud Limits
export const REFERRAL_LIMITS = {
    DAILY_MAX: 5,
    MONTHLY_MAX: 20,
};
