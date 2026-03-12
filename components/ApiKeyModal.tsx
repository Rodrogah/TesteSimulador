import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import LanguageSwitcher from './LanguageSwitcher';

interface SettingsModalProps {
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
    const { t } = useTranslations();
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            setApiKey(storedKey);
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('gemini_api_key', apiKey);
        onClose();
    };

    const handleRemove = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-surface border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl animate-slide-in space-y-6">
                <h2 className="text-2xl font-bold text-primary text-center">{t('settingsModal.title') as string}</h2>
                
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-secondary">{t('settingsModal.language') as string}</h3>
                    <div className="flex justify-center">
                        <LanguageSwitcher />
                    </div>
                </div>

                <div className="space-y-2 border-t border-white/10 pt-6">
                    <h3 className="text-lg font-semibold text-secondary">{t('settingsModal.apiKeyTitle') as string}</h3>
                    <p className="text-sm text-secondary">{t('settingsModal.apiKeyDescription') as string}</p>
                    
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={t('settingsModal.inputPlaceholder') as string}
                        className="w-full bg-background border border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-nba-blue focus:border-nba-blue outline-none"
                    />
                    <a 
                        href="https://ai.google.dev/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline mt-2 inline-block"
                    >
                        {t('settingsModal.getYourKey') as string}
                    </a>

                    <div className="flex justify-between gap-4 pt-2">
                        <button
                            onClick={handleRemove}
                            className="flex-1 bg-nba-red/80 text-white font-bold py-2 px-4 rounded-lg hover:bg-nba-red transition-colors"
                        >
                            {t('settingsModal.removeButton') as string}
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-nba-blue/80 text-white font-bold py-2 px-4 rounded-lg hover:bg-nba-blue transition-colors"
                        >
                            {t('settingsModal.saveButton') as string}
                        </button>
                    </div>
                </div>
                
                 <button
                    onClick={onClose}
                    className="w-full mt-2 bg-nba-gray/20 text-white font-bold py-2 px-4 rounded-lg hover:bg-nba-gray/40 transition-colors"
                >
                    {t('settingsModal.closeButton') as string}
                </button>
            </div>
        </div>
    );
};

export default SettingsModal;