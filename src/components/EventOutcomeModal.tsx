import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface EventOutcomeModalProps {
    title: string;
    description: string;
    onClose: () => void;
}

const EventOutcomeModal: React.FC<EventOutcomeModalProps> = ({ title, description, onClose }) => {
    const { t } = useTranslations();

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-surface border border-white/10 rounded-xl p-6 w-11/12 max-w-md text-center shadow-2xl animate-slide-in">
                <h2 className="text-2xl font-bold mb-2 text-primary">
                    {title}
                </h2>
                <p className="text-secondary mb-6 whitespace-pre-wrap">{description}</p>
                <button
                    onClick={onClose}
                    className="w-full bg-nba-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-nba-red transition-all transform hover:scale-105 active:scale-100"
                >
                    {t('continue') as string}
                </button>
            </div>
        </div>
    );
};

export default EventOutcomeModal;
