import { useState, useEffect, useCallback } from 'react';
import { Survey } from '../types';

export const useSurveys = () => {
    const [surveys, setSurveys] = useState<Survey[]>([]);

    useEffect(() => {
        const loadSurveys = () => {
            const storedSurveys = localStorage.getItem('rayburger_surveys');
            if (storedSurveys) {
                try {
                    setSurveys(JSON.parse(storedSurveys));
                } catch (error) {
                    console.error("Error parsing surveys:", error);
                    setSurveys([]); // Fallback to empty
                }
            }
        };

        loadSurveys();

        // Listen for updates (from other tabs or cloud sync)
        window.addEventListener('rayburger_surveys_updated', loadSurveys);
        return () => window.removeEventListener('rayburger_surveys_updated', loadSurveys);
    }, []);

    const addSurvey = useCallback((survey: Survey) => {
        setSurveys(prev => {
            const newSurveys = [...prev, survey];
            localStorage.setItem('rayburger_surveys', JSON.stringify(newSurveys));
            return newSurveys;
        });
    }, []);

    const getStats = useCallback(() => {
        if (!surveys || surveys.length === 0) return null;

        const total = surveys.length;
        const sums = surveys.reduce((acc, curr) => {
            // Safety check for missing ratings structure
            const r = curr.ratings || { foodQuality: 10, service: 10, price: 10, deliveryTime: 10 };
            return {
                foodQuality: acc.foodQuality + (r.foodQuality || 0),
                service: acc.service + (r.service || 0),
                price: acc.price + (r.price || 0),
                deliveryTime: acc.deliveryTime + (r.deliveryTime || 0),
            };
        }, { foodQuality: 0, service: 0, price: 0, deliveryTime: 0 });

        return {
            totalSurveys: total,
            averages: {
                foodQuality: (sums.foodQuality / total).toFixed(1),
                service: (sums.service / total).toFixed(1),
                price: (sums.price / total).toFixed(1),
                deliveryTime: (sums.deliveryTime / total).toFixed(1),
            },
            // Add a weighted overall average
            overall: ((sums.foodQuality + sums.service + sums.price + sums.deliveryTime) / (total * 4)).toFixed(1)
        };
    }, [surveys]);

    return {
        surveys,
        setSurveys, // Exposed for cloud sync
        addSurvey,
        getStats
    };
};
