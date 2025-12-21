import { useState, useEffect, useCallback } from 'react';
import { Survey } from '../types';

export const useSurveys = () => {
    const [surveys, setSurveys] = useState<Survey[]>([]);

    useEffect(() => {
        const storedSurveys = localStorage.getItem('rayburger_surveys');
        if (storedSurveys) {
            try {
                setSurveys(JSON.parse(storedSurveys));
            } catch (error) {
                console.error("Error parsing surveys:", error);
                setSurveys([]); // Fallback to empty
            }
        }
    }, []);

    const addSurvey = useCallback((survey: Survey) => {
        setSurveys(prev => {
            const newSurveys = [...prev, survey];
            localStorage.setItem('rayburger_surveys', JSON.stringify(newSurveys));
            return newSurveys;
        });
    }, []);

    const getStats = useCallback(() => {
        if (surveys.length === 0) return null;

        const total = surveys.length;
        const sums = surveys.reduce((acc, curr) => ({
            foodQuality: acc.foodQuality + curr.ratings.foodQuality,
            service: acc.service + curr.ratings.service,
            price: acc.price + curr.ratings.price,
            deliveryTime: acc.deliveryTime + curr.ratings.deliveryTime,
        }), { foodQuality: 0, service: 0, price: 0, deliveryTime: 0 });

        return {
            totalSurveys: total,
            averages: {
                foodQuality: (sums.foodQuality / total).toFixed(1),
                service: (sums.service / total).toFixed(1),
                price: (sums.price / total).toFixed(1),
                deliveryTime: (sums.deliveryTime / total).toFixed(1),
            }
        };
    }, [surveys]);

    return {
        surveys,
        addSurvey,
        getStats
    };
};
