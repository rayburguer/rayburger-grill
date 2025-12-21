// Reward Milestones Configuration
// Logic based on: 1.5$ Fries, 5$ Burger.
// 200 pts = ~$1 value logic approx? Or hardcoded milestones.
export const REWARD_MILESTONES = [
    {
        points: 50,
        name: "Salsa o Topping Extra",
        emoji: "🧂",
        value: 0.5,
        description: "¡Un toque extra de sabor para tu comida!"
    },
    {
        points: 150,
        name: "Ración de Papas",
        emoji: "🍟",
        value: 1.5,
        description: "¡Crujientes y doraditas! El acompañante perfecto."
    },
    {
        points: 300,
        name: "Perro Caliente",
        emoji: "🌭",
        value: 3,
        description: "Un clásico rápido y delicioso."
    },
    {
        points: 500,
        name: "Burger Clásica",
        emoji: "🍔",
        value: 5,
        description: "El premio mayor: El sabor original de Ray Burger."
    },
];

// Anti-Fraud Limits
export const REFERRAL_LIMITS = {
    DAILY_MAX: 5,
    MONTHLY_MAX: 20,
};

export interface RewardMilestone {
    points: number;
    name: string;
    emoji: string;
    value: number;
    description: string;
}
