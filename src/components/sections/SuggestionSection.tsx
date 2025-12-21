import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Send, X, UtensilsCrossed, Sparkles } from 'lucide-react';
import { useSuggestions } from '../../hooks/useSuggestions';

export const SuggestionSection: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState('');
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const { addSuggestion } = useSuggestions();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content || !phone) return;

        addSuggestion(content, phone, name);
        setSubmitted(true);
        setTimeout(() => {
            setIsOpen(false);
            setSubmitted(false);
            setContent('');
            setName('');
        }, 3000);
    };

    return (
        <section className="py-20 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="relative bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl rounded-[3rem] border border-orange-500/30 p-8 lg:p-12 overflow-hidden">
                    {/* Decoration */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-full text-orange-400 text-sm font-bold mb-4">
                                <Lightbulb size={16} /> Buzón de Ideas
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-anton text-white mb-6 uppercase tracking-tight">
                                Diseña tu <span className="text-orange-500">Hamburguesa Ideal</span>
                            </h2>
                            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                ¿Te falta algún extra? ¿Alguna salsa secreta? Cuéntanos qué te gustaría ver en nuestro menú y ayúdanos a crear la próxima "Intocable".
                            </p>
                            <button
                                onClick={() => setIsOpen(true)}
                                className="group relative px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-orange-900/40 flex items-center gap-3 overflow-hidden"
                            >
                                <span className="relative z-10">¡Enviar mi Idea!</span>
                                <Sparkles className="relative z-10 group-hover:rotate-12 transition-transform" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            </button>
                        </div>

                        <div className="w-full max-w-[280px] aspect-square relative hidden md:block">
                            <motion.div
                                animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop"
                                    alt="Creative Burger"
                                    className="w-full h-full object-cover rounded-[2rem] shadow-2xl rotate-3 border-4 border-gray-800"
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                            onClick={() => !submitted && setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-gray-900 rounded-[2.5rem] border border-gray-700 p-8 shadow-2xl overflow-hidden"
                        >
                            {submitted ? (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Send className="text-green-500 w-10 h-10" />
                                    </div>
                                    <h3 className="text-3xl font-anton text-white mb-4 uppercase">¡Idea Recibida!</h3>
                                    <p className="text-gray-400">Gracias por ayudarnos a ser los mejores. ¡Cocinaremos algo increíble!</p>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="absolute top-6 right-6 p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>

                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-3 bg-orange-600 rounded-2xl shadow-lg shadow-orange-900/20 text-white">
                                            <UtensilsCrossed size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-anton text-white uppercase">Tu Hamburguesa Ideal</h3>
                                            <p className="text-gray-500 text-sm">Cuéntanos tus sueños gastronómicos</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Descripción</label>
                                            <textarea
                                                required
                                                placeholder="Ej: Me gustaría una con piña a la parrilla, salsa tartara y doble queso cheddar..."
                                                className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white placeholder:text-gray-600 focus:border-orange-500 outline-none min-h-[150px] transition-all"
                                                value={content}
                                                onChange={e => setContent(e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tu Teléfono</label>
                                                <input
                                                    required
                                                    type="tel"
                                                    placeholder="0412..."
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white focus:border-orange-500 outline-none transition-all"
                                                    value={phone}
                                                    onChange={e => setPhone(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tu Nombre</label>
                                                <input
                                                    type="text"
                                                    placeholder="Opcional"
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white focus:border-orange-500 outline-none transition-all"
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-orange-900/20 mt-4 flex items-center justify-center gap-3"
                                        >
                                            <Send size={24} /> Enviar Sugerencia
                                        </button>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
};
