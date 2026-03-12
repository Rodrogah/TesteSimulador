
import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

const EventLoadingIndicator: React.FC = () => {
    const { t } = useTranslations();

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-surface border border-white/10 rounded-xl p-6 w-full max-w-sm text-center shadow-2xl">
                <div className="w-12 h-12 border-4 border-nba-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-2xl font-bold mb-2 text-primary">{t('eventLoading.title') as string}</h2>
                <p className="text-secondary">{t('eventLoading.description') as string}</p>
            </div>
        </div>
    );
};

export default EventLoadingIndicator;
