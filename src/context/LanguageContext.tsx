
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Language, Translations, LanguageContextType } from '../types';
import en from '../locales/en.json';
import ptBr from '../locales/pt-br.json';

// Define the shape of the loaded translations state
type LoadedTranslations = { [key in Language]: Translations };

const initialTranslations: LoadedTranslations = {
    [Language.EN]: en as unknown as Translations,
    [Language.PT_BR]: ptBr as unknown as Translations,
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // MODIFICADO: Definido PT_BR como idioma padrão inicial
    const [language, setLanguage] = useState<Language>(Language.PT_BR);
    const [translations] = useState<LoadedTranslations>(initialTranslations);

    useEffect(() => {
        const detectedLanguage = navigator.language.split('-')[0];
        if (detectedLanguage === 'pt') {
            setLanguage(Language.PT_BR);
        } else {
            setLanguage(Language.EN);
        }
    }, []);

    const t = useCallback((key: string, replacements?: { [key: string]: string | number }): string | Translations => {
        const keys = key.split('.');
        let result: any = translations[language];

        for (const k of keys) {
            result = result?.[k];
            if (result === undefined) {
                // Fallback to English if the key is not found in the current language.
                result = translations[Language.EN];
                for (const fk of keys) {
                    result = result?.[fk];
                }
                if (result === undefined) return key;
            }
        }

        if (typeof result === 'string' && replacements) {
            Object.keys(replacements).forEach(rKey => {
                result = result.replace(`{{${rKey}}}`, String(replacements[rKey]));
            });
        }
        
        return result ?? key;
    }, [language, translations]);

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
