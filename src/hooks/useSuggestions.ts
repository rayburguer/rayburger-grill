import { useState, useCallback } from 'react';
import { Suggestion } from '../types';

export const useSuggestions = () => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>(() => {
        const saved = localStorage.getItem('rayburger_suggestions');
        return saved ? JSON.parse(saved) : [];
    });

    const saveSuggestions = useCallback((newSuggestions: Suggestion[]) => {
        setSuggestions(newSuggestions);
        localStorage.setItem('rayburger_suggestions', JSON.stringify(newSuggestions));
        // Also dispatch event for sync
        window.dispatchEvent(new CustomEvent('rayburger_suggestions_updated', { detail: newSuggestions }));
    }, []);

    const addSuggestion = useCallback((content: string, phone: string, name?: string) => {
        const newSuggestion: Suggestion = {
            id: Date.now().toString(),
            phone,
            name,
            content,
            timestamp: Date.now()
        };
        const updated = [newSuggestion, ...suggestions];
        saveSuggestions(updated);
    }, [suggestions, saveSuggestions]);

    const deleteSuggestion = useCallback((id: string) => {
        const updated = suggestions.filter(s => s.id !== id);
        saveSuggestions(updated);
    }, [suggestions, saveSuggestions]);

    return {
        suggestions,
        addSuggestion,
        deleteSuggestion
    };
};
