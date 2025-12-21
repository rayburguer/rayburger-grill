import { useState, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { User, Order, Product } from '../types';

export const useGemini = () => {
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const getRecommendations = useCallback(async (currentUser: User | null, userOrders: Order[], allProducts: Product[], mood?: string) => {
        // En Vite, se accede a las variables de entorno con import.meta.env
        const apiKey = (import.meta as any).env.VITE_API_KEY;

        if (!apiKey) {
            console.error("VITE_API_KEY no está configurada en el archivo .env.");
            return { success: false, error: "API_KEY_MISSING" };
        }

        setIsLoading(true);
        let prompt = ""; // Initialize prompt

        if (currentUser && userOrders.length > 0) {
            const lastOrder = userOrders[userOrders.length - 1];
            const lastItems = lastOrder.items.map(item => item.name).join(', ');
            prompt = `El usuario ${currentUser.name} recientemente pidió: ${lastItems}. `;
        }

        if (mood) {
            if (mood === 'beast') prompt += "El usuario tiene MUCHA hambre (Nivel Bestia). Recomienda las hamburguesas más grandes y completas.";
            if (mood === 'light') prompt += "El usuario busca algo ligero. Recomienda opciones como ensaladas, wraps o hamburguesas sencillas sin muchos extras.";
            if (mood === 'explorer') prompt += "El usuario se siente explorador. Recomienda sabores únicos, salsas especiales o combinaciones exóticas.";
            if (mood === 'sweet') prompt += "El usuario tiene un antojo dulce. Recomienda los mejores postres, malteadas o acompañamientos dulces.";
            if (mood === 'party') prompt += "El usuario está en mood fiesta o para compartir. Recomienda combos grandes, buckets o bandejas de snacks.";
        }

        prompt += " Recomienda 3 platos del menú (basándote en los nombres típicos: Hamburguesa, Papas, etc.). El output debe ser solo los nombres, separados por comas y sin números ni viñetas. Ej: Hamburguesa Clásica, Papas Fritas, Refresco Cola.";

        try {
            const ai = new GoogleGenerativeAI(apiKey);
            // Note: Use a more stable model name if possible, or keep preview
            const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const rawText = response.text();

            const parsedRecommendations = rawText
                .split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);

            // Filter to ensure recommendations match existing products (fuzzy match logic could be better but keeping simple)
            const validRecommendations = parsedRecommendations.filter(rec =>
                allProducts.some(p => p.name.toLowerCase().includes(rec.toLowerCase()))
            ).slice(0, 3);

            setRecommendations(validRecommendations);
            return { success: true };

        } catch (error) {
            console.error("Error al obtener recomendaciones de Gemini:", error);
            setRecommendations([]);
            return { success: false, error: error };
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        recommendations,
        isLoading,
        getRecommendations
    };
};
