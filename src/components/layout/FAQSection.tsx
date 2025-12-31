import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, Wallet, Award, Clock, Star, Gift } from 'lucide-react';
import { WHATSAPP_URL } from '../../config/constants';

const faqs = [
    {
        icon: <Wallet className="text-green-400" size={20} />,
        question: "¿Cómo funciona mi Billetera Ray?",
        answer: "¡Es súper simple! No más puntos complicados. Cada vez que compras, el 3% (o más según tu nivel) del total se guarda como saldo en DÓLARES en tu Billetera. Ese saldo lo puedes usar para pagar tus próximos pedidos total o parcialmente."
    },
    {
        icon: <Award className="text-yellow-400" size={20} />,
        question: "¿Cómo subo de nivel y gano más?",
        answer: "Tu nivel depende de tus **puntos acumulados**: **Bronze** (0-99 pts, ganas 3%), **Silver** (100-499 pts, ganas 5%), **Gold** (500-999 pts, ganas 8%), **Diamond** (1000+ pts, ganas 10%). ¡Mientras más disfrutas, más ganas!"
    },
    {
        icon: <Star className="text-orange-400" size={20} />,
        question: "¿Cómo gano puntos?",
        answer: "Ganas **1 punto por cada dólar** que gastes. Por ejemplo, si compras una hamburguesa de $5, ganas 5 puntos. Estos puntos determinan tu nivel y cuánto cashback recibes en tu billetera."
    },
    {
        icon: <Clock className="text-blue-400" size={20} />,
        question: "¿Cuál es mi Usuario y Clave?",
        answer: "Tu usuario es tu **Número de Celular**. Si pediste por WhatsApp o en el Local, tu clave temporal es **1234**. Si te registraste por la Web, usa la clave que creaste. ¡Puedes cambiarla en tu perfil cuando quieras!"
    },
    {
        icon: <Gift className="text-purple-400" size={20} />,
        question: "¿Qué es la Ruleta Semanal?",
        answer: "¡Premios gratis! Si estás registrado y has hecho al menos una compra, cada semana tienes un tiro en la Ruleta. Puedes ganar saldo extra para tu billetera, papas fritas o hasta hamburguesas gratis."
    },
    {
        icon: <MessageCircle className="text-green-400" size={20} />,
        question: "¿Qué beneficios tienen los Invitados?",
        answer: "Los invitados pueden comprar rápido sin registrarse, pero **NO acumulan puntos** ni saldo en su billetera, ni suben de nivel. Te recomendamos registrarte (toma 10 segundos) para que cada dólar que gastes te regrese dinero."
    },
    {
        icon: <MessageCircle className="text-green-500" size={20} />,
        question: "¿Cómo uso mis Referidos?",
        answer: "Comparte tu código personal con amigos. Cuando ellos se registren con tu código, tú ganas saldo extra de por vida por cada compra que ellos hagan. ¡Es dinero pasivo para comer gratis!"
    },
    {
        icon: <ChevronDown className="text-gray-400" size={20} />,
        question: "¿Puedo repetir un pedido anterior?",
        answer: "¡Sí! Ve a tu 'Historial de Pedidos' en el perfil. Con un solo click en 'Repetir', todo tu pedido anterior (con las mismas salsas y extras) se añade al carrito."
    }
];

const FAQSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0); // First one open by default

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="w-full max-w-3xl mx-auto px-4 mb-20 mt-12">
            <div className="text-center mb-10">
                <span className="inline-block py-1 px-3 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 text-xs font-bold uppercase tracking-widest mb-4">
                    ¿Tienes dudas?
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-wider">
                    Preguntas Frecuentes
                </h2>
            </div>

            <div className="flex flex-col gap-4">
                {faqs.map((faq, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className={`group border rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === index ? 'bg-gray-800/80 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'}`}
                    >
                        <button
                            onClick={() => toggleAccordion(index)}
                            className="w-full flex justify-between items-center p-5 text-left transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg transition-colors duration-300 ${openIndex === index ? 'bg-orange-500/20' : 'bg-gray-800'}`}>
                                    {faq.icon}
                                </div>
                                <span className={`font-bold text-lg ${openIndex === index ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                    {faq.question}
                                </span>
                            </div>
                            <motion.div
                                animate={{ rotate: openIndex === index ? 180 : 0 }}
                                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                                className={`p-1 rounded-full ${openIndex === index ? 'bg-orange-500 text-white' : 'text-gray-500'}`}
                            >
                                <ChevronDown size={20} />
                            </motion.div>
                        </button>
                        <AnimatePresence>
                            {openIndex === index && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <div className="px-5 pb-6 pl-[4.5rem] text-gray-300 text-base leading-relaxed border-t border-gray-700/50 pt-4">
                                        {faq.answer.split('**').map((part, i) =>
                                            i % 2 === 1 ? <span key={i} className="text-white font-bold">{part}</span> : part
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            {/* Contact CTA */}
            <div className="mt-12 text-center">
                <p className="text-gray-400 text-sm mb-6">¿No encontraste lo que buscabas?</p>
                <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-xl hover:shadow-green-600/30 hover:-translate-y-1 group"
                >
                    <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />
                    <span>Hablar con un Humano</span>
                </a>
            </div>
        </section>
    );
};

export default FAQSection;
