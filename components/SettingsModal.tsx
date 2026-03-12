import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface SettingsModalProps {
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
    const { t } = useTranslations();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-surface p-6 rounded-lg shadow-xl max-w-sm w-full animate-pop-in">
                <h2 className="text-2xl font-bold text-primary mb-4">{t('settings.title')}</h2>
                <p className="text-secondary mb-4">{t('settings.description')}</p>
                {/* Add settings options here */}
                <button
                    onClick={onClose}
                    className="w-full bg-nba-blue text-white py-2 px-4 rounded-md hover:bg-nba-red transition-colors"
                >
                    {t('settings.close')}
                </button>
            </div>
        </div>
    );
};

export default SettingsModal;
