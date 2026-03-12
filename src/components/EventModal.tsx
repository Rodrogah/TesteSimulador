import React from 'react';
import { GameEvent, EventChoice } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface EventModalProps {
    event: GameEvent;
    onDecision: (choice: EventChoice) => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, onDecision }) => {
    const { t } = useTranslations();

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-surface border border-white/10 rounded-xl p-6 w-full max-w-lg text-center shadow-2xl animate-slide-in">
                <h2 className="text-2xl font-bold mb-2 text-primary">{event.title}</h2>
                <p className="text-secondary mb-6 whitespace-pre-wrap">{event.description}</p>
                
                <div className="space-y-3">
                    {event.choices.map((choice, index) => (
                        <button
                            key={index}
                            onClick={() => onDecision(choice)}
                            className="w-full bg-background border border-white/10 p-4 rounded-lg text-left hover:bg-nba-blue/20 hover:border-nba-blue transition-all duration-200"
                        >
                            <p className="font-semibold text-primary">{choice.text}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EventModal;
