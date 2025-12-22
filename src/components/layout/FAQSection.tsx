import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, HelpCircle } from 'lucide-react';
import { WHATSAPP_URL } from '../../config/constants';

const faqs = [
    {
        question: "¿Cómo gano puntos?",
        answer: "¡Ganas puntos con cada compra! Recibes entre un 3% y un 8% de Cashback dependiendo de tu nivel (Bronze, Silver, Gold, Platinum). Además, ¡te regalamos 50 puntos solo por registrarte!"
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
        question: "¿Qué beneficios tengo al registrarme?",
        answer: "¡Muchos! Recibes 50 puntos de bienvenida ($0.50), accedes a niveles de lealtad con hasta 8% de cashback, puedes girar la Ruleta Semanal, obtienes un código de referido para ganar dinero, y puedes repetir tus pedidos favoritos con un click."
    },
    {
        question: "¿Cómo canjeo mis puntos?",
        answer: "Puedes canjear tus puntos en cualquier momento. Cada 100 puntos = $1.00 USD de descuento. Solo debes indicarlo al hacer tu pedido (online o presencial). Tu saldo de puntos se descuenta automáticamente y se aplica el descuento al total."
    },
    {
        question: "¿Qué es el RayCash y cómo lo uso?",
        answer: "RayCash es dinero REAL en USD que ganas cuando tus amigos referidos compran (2% de cada compra). Aparece en tu perfil como 'Saldo Referidos'. Puedes usarlo para pagar parte o la totalidad de tu pedido. ¡Es como tener una billetera digital exclusiva!"
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
