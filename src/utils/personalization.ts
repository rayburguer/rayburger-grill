import { User, Product } from '../types';

/**
 * Analyzes user's order history to find their most frequent customization preferences
 */
export const getUserPreferences = (user: User | null, product: Product): { [optionId: string]: boolean } => {
    if (!user || !user.orders || !product.customizableOptions) {
        return {};
    }

    // Find all past orders containing this product
    const relevantOrders = user.orders.filter(order =>
        order.items.some(item => item.name === product.name)
    );

    if (relevantOrders.length === 0) {
        return {};
    }

    // Count frequency of each customization option
    const optionFrequency: { [optionId: string]: number } = {};
    let totalOccurrences = 0;

    relevantOrders.forEach(order => {
        order.items.forEach(item => {
            if (item.name === product.name && item.selectedOptions) {
                totalOccurrences++;
                Object.entries(item.selectedOptions).forEach(([optionId, isSelected]) => {
                    if (isSelected) {
                        optionFrequency[optionId] = (optionFrequency[optionId] || 0) + 1;
                    }
                });
            }
        });
    });

    // Return options that appear in 60%+ of past orders (strong preference)
    const predictedPreferences: { [optionId: string]: boolean } = {};
    const threshold = totalOccurrences * 0.6;

    Object.entries(optionFrequency).forEach(([optionId, count]) => {
        if (count >= threshold) {
            predictedPreferences[optionId] = true;
        }
    });

    return predictedPreferences;
};

/**
 * Checks if a given set of options matches the user's usual preferences
 */
export const hasHabitualPreferences = (predictedPreferences: { [optionId: string]: boolean }): boolean => {
    return Object.keys(predictedPreferences).length > 0;
};

/**
 * Gets a human-readable description of the user's preferences
 */
export const getPreferenceDescription = (
    predictedPreferences: { [optionId: string]: boolean },
    product: Product
): string => {
    if (!hasHabitualPreferences(predictedPreferences) || !product.customizableOptions) {
        return '';
    }

    const selectedOptions = product.customizableOptions.filter(opt =>
        predictedPreferences[opt.id.toString()]
    );

    if (selectedOptions.length === 0) return '';

    const names = selectedOptions.map(opt => opt.name).join(', ');
    return `Siempre pides: ${names}`;
};
