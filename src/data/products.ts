import { Product } from '../types';

export const SAMPLE_PRODUCTS: Product[] = [
    // ========== HAMBURGUESAS (Las Intocables) ==========
    {
        id: 1,
        name: "La Clásica del Rey",
        description: "Carne 120g, vegetales y salsas.",
        basePrice_usd: 5.00,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop",
        category: "Hamburguesas",
        rating: 4.8,
        ratingCount: 120,
        customizableOptions: [
            { id: "double_meat", name: "Hacerla Doble ($7.50 Total)", price_usd: 2.50, defaultIncluded: false },
        ]
    },
    {
        id: 2,
        name: "Ray Bacon Melt",
        description: "Queso fundido + Tocineta.",
        basePrice_usd: 6.50,
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=400&fit=crop",
        category: "Hamburguesas",
        customizableOptions: [
            { id: "double_meat", name: "Hacerla Doble ($9.00 Total)", price_usd: 2.50, defaultIncluded: false }
        ]
    },
    {
        id: 3,
        name: "La Crispy Supreme",
        description: "Pollo apanado extra crujiente.",
        basePrice_usd: 7.00,
        image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop",
        category: "Hamburguesas",
        customizableOptions: [
            { id: "double_meat", name: "Hacerla Doble ($10.50 Total)", price_usd: 3.50, defaultIncluded: false }
        ]
    },
    {
        id: 4,
        name: "La Chistoburguer",
        description: "Carne + Chistorra Monserrat.",
        basePrice_usd: 7.50,
        image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop",
        category: "Hamburguesas",
        customizableOptions: [
            { id: "double_meat", name: "Hacerla Doble ($11.00 Total)", price_usd: 3.50, defaultIncluded: false }
        ]
    },
    // ========== HAMBURGUESAS (Las Especiales / Edición Italiana) ==========
    {
        id: 5,
        name: "La Romana",
        description: "Doble queso + Tomates deshidratados.",
        basePrice_usd: 7.00,
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
        category: "Hamburguesas",
        customizableOptions: [
            { id: "double_meat", name: "Hacerla Doble ($9.50 Total)", price_usd: 2.50, defaultIncluded: false }
        ]
    },
    {
        id: 6,
        name: "Victoria Rellena",
        description: "250g Rellena de queso + Tocineta.",
        basePrice_usd: 8.50,
        image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop",
        category: "Hamburguesas",
        customizableOptions: []
    },
    {
        id: 7,
        name: "Victoria \"Il Capo\"",
        description: "250g Rellena + Tomates deshidratados.",
        basePrice_usd: 10.00,
        image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop",
        category: "Hamburguesas",
        customizableOptions: [],
        highlight: "NEW"
    },

    // ========== PERROS (Hot Dogs) ==========
    {
        id: 8,
        name: "Perro Clásico",
        description: "El sabor de siempre.",
        basePrice_usd: 2.00,
        image: "https://images.unsplash.com/photo-1612392062798-2dbaa7c0c9c0?w=400&h=300&fit=crop",
        category: "Perros",
        customizableOptions: []
    },
    {
        id: 9,
        name: "Perro Especial",
        description: "Con un toque extra.",
        basePrice_usd: 3.00,
        image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop",
        category: "Perros",
        customizableOptions: []
    },
    {
        id: 10,
        name: "Perripollo",
        description: "Salchicha de pollo.",
        basePrice_usd: 3.50,
        image: "https://images.unsplash.com/photo-1619740455993-9e0c79f97a8e?w=400&h=300&fit=crop",
        category: "Perros",
        customizableOptions: []
    },
    {
        id: 11,
        name: "Perro Jumbo",
        description: "Para el hambre grande.",
        basePrice_usd: 3.50,
        image: "https://images.unsplash.com/photo-1603894584373-5ac82b2fb6c2?w=400&h=300&fit=crop",
        category: "Perros",
        customizableOptions: []
    },

    // ========== COMBOS ==========
    {
        id: 101,
        name: "Combo Clásicas",
        description: "4 Hamburguesas Clásicas + Papas + Refresco 2L.",
        basePrice_usd: 25.00,
        image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop",
        category: "Combos",
        customizableOptions: []
    },
    {
        id: 102,
        name: "Combo Chess Bacon", // Keeping "Chess" as per manual image typo? Corrected to Cheese logic but name in image is Chess Beacon
        description: "4 Cheese Burger + Papas + Refresco 2L.",
        basePrice_usd: 30.00,
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop",
        category: "Combos",
        customizableOptions: []
    },
    {
        id: 103,
        name: "Combo Victoria Cheese",
        description: "4 Victoria Cheese + Papas + Refresco 2L.",
        basePrice_usd: 35.00,
        image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop",
        category: "Combos",
        customizableOptions: []
    },
    {
        id: 104,
        name: "Combo Crispy Burguer",
        description: "4 Crispy Cheese + Papas + Refresco 2L.",
        basePrice_usd: 32.00,
        image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop",
        category: "Combos",
        customizableOptions: []
    },
    {
        id: 105,
        name: "Combo Perros Clásicos",
        description: "4 Perros Clásicos + Papas + Refresco 1L.",
        basePrice_usd: 13.00,
        image: "https://images.unsplash.com/photo-1612392062798-2dbaa7c0c9c0?w=400&h=300&fit=crop",
        category: "Combos",
        customizableOptions: []
    },
    {
        id: 106,
        name: "Combo Perros Especiales",
        description: "4 Perros Especiales + Papas + Refresco 1L.",
        basePrice_usd: 17.00,
        image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop",
        category: "Combos",
        customizableOptions: []
    },
    {
        id: 107,
        name: "Combo Especiales (Jumbo)", // Image says "Perros Especiales" again but desc says "4 perros jumbo"
        description: "4 Perros Jumbo + Papas + Refresco 1L.",
        basePrice_usd: 18.00,
        image: "https://images.unsplash.com/photo-1603894584373-5ac82b2fb6c2?w=400&h=300&fit=crop",
        category: "Combos",
        customizableOptions: []
    },

    // ========== EXTRAS (Apart del menu) ==========
    {
        id: 301,
        name: "Extra Pepinillo",
        description: "Porción adicional.",
        basePrice_usd: 0.00,
        image: "https://via.placeholder.com/150?text=Pepinillo",
        category: "Extras",
        customizableOptions: []
    },
    {
        id: 302,
        name: "Extra Cebolla",
        description: "Porción adicional.",
        basePrice_usd: 0.00,
        image: "https://via.placeholder.com/150?text=Cebolla",
        category: "Extras",
        customizableOptions: []
    },
    {
        id: 303,
        name: "Cebolla Caramelizada",
        description: "Dulce y deliciosa.",
        basePrice_usd: 0.50,
        image: "https://via.placeholder.com/150?text=Cebolla+Caramelizada",
        category: "Extras",
        customizableOptions: []
    },
    {
        id: 304,
        name: "Extra Tocineta",
        description: "Crujiente y ahumada.",
        basePrice_usd: 1.00,
        image: "https://via.placeholder.com/150?text=Tocineta",
        category: "Extras",
        customizableOptions: []
    },
    {
        id: 305,
        name: "Queso Cheddar",
        description: "Fundido y cremoso.",
        basePrice_usd: 0.50,
        image: "https://via.placeholder.com/150?text=Cheddar",
        category: "Extras",
        customizableOptions: []
    },
    {
        id: 306,
        name: "Salsas",
        description: "Porción extra de salsas de la casa.",
        basePrice_usd: 0.25,
        image: "https://via.placeholder.com/150?text=Salsas",
        category: "Extras",
        customizableOptions: []
    }
];
