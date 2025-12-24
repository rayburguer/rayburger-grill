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
        customizableOptions: [
            { id: "double_meat", name: "Hacerla Doble ($7.50 Total)", price_usd: 2.50, defaultIncluded: false },
        ]
    },
    {
        id: 2,
        name: "Ray Bacon Melt",
        description: "Queso fundido + Tocineta.",
        basePrice_usd: 6.50,
        image: "/bacon-melt.jpg",
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
        image: "/crispy.jpg",
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
        image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&h=400&fit=crop",
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
        image: "/la-romana.jpg",
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
        image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&h=400&fit=crop",
        category: "Hamburguesas",
        customizableOptions: []
    },
    {
        id: 7,
        name: "Victoria \"Il Capo\"",
        description: "250g Rellena + Tomates deshidratados.",
        basePrice_usd: 10.00,
        image: "/il-capo.jpg",
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
        image: "/perro-clasico.jpg",
        category: "Perros",
        customizableOptions: []
    },
    {
        id: 9,
        name: "Perro Especial",
        description: "Con un toque extra.",
        basePrice_usd: 3.00,
        image: "/perro-especial.jpg",
        category: "Perros",
        customizableOptions: []
    },
    {
        id: 10,
        name: "Perripollo",
        description: "Salchicha de pollo.",
        basePrice_usd: 3.50,
        image: "https://images.unsplash.com/photo-1619740455993-9e0c79f97a8e?w=600&h=400&fit=crop",
        category: "Perros",
        customizableOptions: []
    },
    {
        id: 11,
        name: "Perro Jumbo",
        description: "Para el hambre grande.",
        basePrice_usd: 3.50,
        image: "/perro-jumbo.jpg",
        category: "Perros",
        customizableOptions: []
    },

    // ========== COMBOS ==========
    {
        id: 101,
        name: "Pack Clásico",
        description: "4 Hamburguesas Clásicas + Papas + Refresco 2L.",
        basePrice_usd: 25.00,
        image: "/combo-hamburguesas.jpg",
        category: "Combos",
        customizableOptions: []
    },
    {
        id: 102,
        name: "Cheese Bacon Special",
        description: "4 Cheese Bacon Burgers + Papas + Refresco 2L.",
        basePrice_usd: 30.00,
        image: "/combo-hamburguesas.jpg",
        category: "Combos",
        customizableOptions: []
    },
    {
        id: 103,
        name: "Crispy Burger",
        description: "4 Crispy Cheese Burgers + Papas + Refresco 2L.",
        basePrice_usd: 32.00,
        image: "/combo-hamburguesas.jpg",
        category: "Combos",
        customizableOptions: []
    },
    {
        id: 104,
        name: "Victoria Cheese",
        description: "4 Victoria Cheese Burgers + Papas + Refresco 2L.",
        basePrice_usd: 35.00,
        image: "/combo-hamburguesas.jpg",
        category: "Combos",
        customizableOptions: []
    },
    {
        id: 105,
        name: "Squad Clásico",
        description: "4 Perros Clásicos + Papas + Refresco 1L.",
        basePrice_usd: 13.00,
        image: "/combo-perros.jpg",
        category: "Combos",
        customizableOptions: []
    },
    {
        id: 106,
        name: "Squad Especial",
        description: "4 Perros Especiales + Papas + Refresco 1L.",
        basePrice_usd: 17.00,
        image: "/combo-perros.jpg",
        category: "Combos",
        customizableOptions: []
    },
    {
        id: 107,
        name: "Squad Jumbo",
        description: "4 Perros Especiales (Jumbo) + Papas + Refresco 1L.",
        basePrice_usd: 18.00,
        image: "/combo-perros.jpg",
        category: "Combos",
        customizableOptions: []
    },

    // ========== EXTRAS ==========
    {
        id: 301,
        name: "Pepinillo",
        description: "Extra para tu burger.",
        basePrice_usd: 0.00,
        image: "https://images.unsplash.com/photo-1591873809494-1100f7caaf35?w=400&h=300&fit=crop",
        category: "Extras",
        customizableOptions: []
    },
    {
        id: 302,
        name: "Cebolla",
        description: "Extra para tu burger.",
        basePrice_usd: 0.00,
        image: "https://images.unsplash.com/photo-1580201006863-14262fca6115?w=400&h=300&fit=crop",
        category: "Extras",
        customizableOptions: []
    },
    {
        id: 303,
        name: "Cebolla Caramelizada",
        description: "Dulce y deliciosa.",
        basePrice_usd: 0.50,
        image: "https://images.unsplash.com/photo-1512485600893-b08ec1d59f1c?w=400&h=300&fit=crop",
        category: "Extras",
        customizableOptions: []
    },
    {
        id: 304,
        name: "Tocineta",
        description: "Crujiente y ahumada.",
        basePrice_usd: 1.00,
        image: "https://images.unsplash.com/photo-1529854140021-3444469e383d?w=400&h=300&fit=crop",
        category: "Extras",
        customizableOptions: []
    },
    {
        id: 305,
        name: "Queso Cheddar",
        description: "Fundido y cremoso.",
        basePrice_usd: 0.50,
        image: "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=400&h=300&fit=crop",
        category: "Extras",
        customizableOptions: []
    },
    {
        id: 306,
        name: "Papas Fritas",
        description: "Porción individual crujiente.",
        basePrice_usd: 1.50,
        image: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&h=300&fit=crop",
        category: "Extras",
        customizableOptions: []
    },
    {
        id: 307,
        name: "Salsas para llevar",
        description: "Tarrina de 2oz.",
        basePrice_usd: 0.25,
        image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&h=300&fit=crop",
        category: "Extras",
        customizableOptions: []
    },
    {
        id: 308,
        name: "Tomates deshidratados",
        description: "Sabor intenso italiano.",
        basePrice_usd: 2.00,
        image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop",
        category: "Extras",
        customizableOptions: []
    }
];
