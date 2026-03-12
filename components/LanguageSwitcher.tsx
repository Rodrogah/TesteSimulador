import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { Language } from '../types';

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useTranslations();

    return (
        <div className="flex items-center bg-surface p-1 rounded-lg border border-white/10">
            <button
                onClick={() => setLanguage(Language.EN)}
                className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${
                    language === Language.EN ? 'bg-nba-blue text-white' : 'text-secondary hover:bg-nba-gray/20'
                }`}
            >
                EN
            </button>
            <button
                onClick={() => setLanguage(Language.PT_BR)}
                className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${
                    language === Language.PT_BR ? 'bg-nba-blue text-white' : 'text-secondary hover:bg-nba-gray/20'
                }`}
            >
                PT-BR
            </button>
        </div>
    );
};

export default LanguageSwitcher;
