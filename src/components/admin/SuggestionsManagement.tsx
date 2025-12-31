import React from 'react';
import { Lightbulb, Trash2 } from 'lucide-react';

interface Suggestion {
    id: string;
    content: string;
    name?: string;
    phone: string;
    timestamp: number;
}

interface SuggestionsManagementProps {
    suggestions: Suggestion[];
    deleteSuggestion: (id: string) => void;
}

export const SuggestionsManagement: React.FC<SuggestionsManagementProps> = ({
    suggestions, deleteSuggestion
}) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="bg-yellow-500/20 p-2 rounded-lg">
                        <Lightbulb className="text-yellow-500" size={24} />
                    </div>
                    Buzón de Sugerencias
                </h3>

                {suggestions.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-dashed border-gray-700">
                        <div className="text-4xl mb-4 opacity-30">📬</div>
                        <p className="text-gray-500 italic font-medium">No hay sugerencias todavía. ¡Las ideas aparecerán aquí!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {suggestions.map(s => (
                            <div key={s.id} className="bg-gray-900 p-5 rounded-2xl border border-gray-800 flex justify-between items-start gap-4 group hover:border-yellow-500/30 transition-all">
                                <div className="flex-1">
                                    <p className="text-white text-lg leading-relaxed mb-4 font-medium italic">"{s.content}"</p>
                                    <div className="flex flex-wrap items-center gap-3 text-xs">
                                        <span className="bg-orange-600/10 px-3 py-1 rounded-full text-orange-400 font-black uppercase tracking-widest border border-orange-500/20">
                                            {s.name || 'Anónimo'}
                                        </span>
                                        <span className="text-gray-500 font-mono">{s.phone}</span>
                                        <span className="text-gray-600 font-medium">
                                            • {new Date(s.timestamp).toLocaleDateString()} a las {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => confirm('¿Eliminar esta idea del buzón?') && deleteSuggestion(s.id)}
                                    className="p-2.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                    title="Eliminar sugerencia"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
