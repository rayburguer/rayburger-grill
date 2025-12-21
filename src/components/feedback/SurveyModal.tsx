import React, { useState } from 'react';
import { Survey } from '../../types';
import Modal from '../ui/Modal';
import { generateUuid } from '../../utils/helpers';
import { Star } from 'lucide-react';

interface SurveyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (survey: Survey) => void;
    orderId: string;
    userId?: string;
}

const SurveyModal: React.FC<SurveyModalProps> = ({ isOpen, onClose, onSubmit, orderId, userId }) => {
    const [ratings, setRatings] = useState({
        foodQuality: 10,
        service: 10,
        price: 10,
        deliveryTime: 10
    });
    const [comments, setComments] = useState('');

    const handleRatingChange = (field: keyof typeof ratings, value: number) => {
        setRatings(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        const newSurvey: Survey = {
            id: generateUuid(),
            orderId,
            userId,
            timestamp: Date.now(),
            ratings,
            comments
        };
        onSubmit(newSurvey);
        // Reset form
        setRatings({ foodQuality: 10, service: 10, price: 10, deliveryTime: 10 });
        setComments('');
    };

    const renderRatingInput = (label: string, field: keyof typeof ratings) => (
        <div className="mb-4">
            <label className="block text-gray-300 mb-2 font-semibold">{label} ({ratings[field]}/10)</label>
            <input
                type="range"
                min="1"
                max="10"
                value={ratings[field]}
                onChange={(e) => handleRatingChange(field, Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Malo (1)</span>
                <span>Excelente (10)</span>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="¡Ayúdanos a Mejorar!">
            <div className="text-white">
                <p className="text-sm text-gray-400 mb-6 text-center">
                    Tu opinión es clave para que sigamos siendo los N°1. <br />
                    Tómate un minuto para calificar tu experiencia.
                </p>

                {renderRatingInput('Calidad de la Comida', 'foodQuality')}
                {renderRatingInput('Atención y Servicio', 'service')}
                {renderRatingInput('Precio / Valor', 'price')}
                {renderRatingInput('Tiempo de Entrega', 'deliveryTime')}

                <div className="mb-6">
                    <label className="block text-gray-300 mb-2 font-semibold">Comentarios Adicionales</label>
                    <textarea
                        className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-white outline-none focus:border-orange-500 resize-none h-24"
                        placeholder="¿Qué te gustó? ¿Qué podemos mejorar?"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        Omitir
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded shadow-lg shadow-orange-900/30 flex items-center"
                    >
                        <Star className="w-4 h-4 mr-2" /> Enviar Opinión
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SurveyModal;
