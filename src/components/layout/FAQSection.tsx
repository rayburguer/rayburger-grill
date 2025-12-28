import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, HelpCircle } from 'lucide-react';
import { WHATSAPP_URL } from '../../config/constants';

const faqs = [
    {
        question: "¿Cómo gano puntos?",
        answer: "¡Ganas puntos en TODAS tus compras! Si pides por la Web, se suman automático. Si pides por WhatsApp o en el Local, nuestro sistema te crea una cuenta al instante y te enviamos tus puntos en el recibo. ¡Nadie se queda sin premio!"
    },
    {
        question: "¿Cuál es mi Usuario y Clave?",
        answer: "Si es tu primera vez comprando por WhatsApp o en el Local, tu usuario es tu **Número de Celular** y tu clave temporal es **1234**. Puedes cambiarla luego en tu perfil. Si te registraste por la Web, usa la clave que elegiste."
    },
    {
        question: "¿Qué es la Ruleta Semanal?",
        answer: "¡Es tu oportunidad de ganar premios gratis! Cada semana puedes girar la ruleta y ganar desde papas fritas hasta hamburguesas completas. Solo necesitas estar registrado y tener al menos una compra aprobada."
    },
    {
        question: "¿Cómo funcionan los Referidos?",
        answer: "¡Es tu mejor opción! Comparte tu código de referido por WhatsApp y ganarás un 2% de Cashback de por vida por cada compra que realicen tus amigos. El saldo se acumula en tu RayCash y puedes usarlo en tus pedidos."
    },
    {
        question: "¿Puedo repetir un pedido anterior?",
        answer: "¡Sí! En tu perfil de usuario encontrarás tu historial de pedidos. Cada pedido aprobado tiene un botón 'Repetir' que agrega automáticamente todos los productos al carrito con las mismas personalizaciones."
    },
    {
        question: "¿Cómo funcionan las calificaciones y rankings?",
        answer: "Mostramos las hamburguesas mejor valoradas por nuestros clientes. Los productos con calificación 4.9+ reciben el badge 'TOP VENTAS' y aparecen en nuestro ranking especial. ¡Así sabes cuáles son las favoritas!"
    },
    {
        question: "¿Puedo sugerir nuevas hamburguesas?",
        answer: "¡Sí! Con nuestra nueva sección 'Crea la Burger Ideal', puedes votar por tus ingredientes favoritos. Cada mes, la combinación ganadora se convertirá en la 'Burger del Mes' y estará disponible para todos. ¡Tú decides qué cocinamos!"
    },
    {
        question: "¿Tienen fecha de vencimiento los puntos?",
        answer: "Para mantener tus puntos activos, solo debes realizar al menos una compra cada 30 días. Si pasas más de un mes sin actividad, tus puntos expirarán automáticamente."
    },
    {
        question: "¿Qué es un Código Promocional VIP?",
        answer: "Si recibiste un enlace especial de Ray Burger (por ejemplo, una invitación del dueño), al registrarte verás un mensaje verde que dice '✓ Código Promo Activo (2x Puntos)'. ¡Esto significa que tu primera compra valdrá el DOBLE en puntos! Es nuestro regalo de bienvenida exclusivo."
    },
    {
        question: "¿Qué beneficios tengo al registrarme?",
        answer: "¡Muchos! Recibes 50 puntos de bienvenida ($0.50), accedes a niveles de lealtad con hasta 8% de cashback, puedes girar la Ruleta Semanal, obtienes un código de referido para ganar dinero, y puedes repetir tus pedidos favoritos con un click."
    },
    {
        question: "¿Cómo canjeo mis puntos?",
        answer: "Puedes canjear tus puntos en cualquier momento. Cada 100 puntos = $1.00 USD de descuento. Solo debes indicarlo al hacer tu pedido (online o presencial). Tu saldo de puntos se descuenta automáticamente y se aplica el descuento al total."
    },
    {
        question: "¿Cómo navego por el menú?",
        answer: "¡Súper fácil! En la página principal verás un botón naranja gigante '🍔 VER MENÚ COMPLETO' que te lleva directo a todas nuestras hamburguesas. En móvil, también tenemos un menú hamburguesa (☰) donde puedes acceder al Ranking y la Ruleta. ¡Todo pensado para que pidas rápido!"
    },
    {
        question: "¿Puedo añadir productos rápido sin abrir detalles?",
        answer: "¡Sí! Los productos simples (sin opciones de personalización) se añaden directo al carrito con un solo tap en el botón '+'. Los productos con opciones (como 'Hacerla Doble') abren un modal para que elijas tus preferencias. ¡Pedidos en segundos!"
    }
];

const FAQSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="w-full max-w-4xl mx-auto px-6 mb-16">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-3xl p-8 shadow-xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-wider flex items-center justify-center gap-3">
                        <HelpCircle className="text-orange-500" /> Preguntas Frecuentes
                    </h2>
                    <p className="text-gray-400 mt-2 text-sm">Todo lo que necesitas saber sobre tus recompensas</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="border border-gray-700/50 rounded-xl overflow-hidden bg-gray-900/30">
                            <button
                                onClick={() => toggleAccordion(index)}
                                className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-800/50 transition-colors"
                            >
                                <span className="font-bold text-gray-200">{faq.question}</span>
                                <motion.div
                                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronDown className="text-orange-500" />
                                </motion.div>
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="p-4 pt-0 text-gray-400 text-sm leading-relaxed border-t border-gray-800">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                {/* Contact CTA */}
                <div className="mt-8 text-center pt-6 border-t border-gray-700/50">
                    <p className="text-gray-400 text-sm mb-4">¿Aún tienes dudas?</p>
                    <a
                        href={WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full transition-all shadow-lg hover:shadow-green-900/30 hover:-translate-y-1"
                    >
                        <MessageCircle size={20} />
                        Escríbenos al WhatsApp
                    </a>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
