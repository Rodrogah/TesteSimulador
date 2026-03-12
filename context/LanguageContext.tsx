
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Language, Translations, LanguageContextType } from '../types';

// Define the shape of the loaded translations state
type LoadedTranslations = { [key in Language]: Translations };

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // MODIFICADO: Definido PT_BR como idioma padrão inicial
    const [language, setLanguage] = useState<Language>(Language.PT_BR);
    const [translations, setTranslations] = useState<LoadedTranslations | null>(null);

    useEffect(() => {
        const detectedLanguage = navigator.language.split('-')[0];
        if (detectedLanguage === 'pt') {
            setLanguage(Language.PT_BR);
        } else {
            setLanguage(Language.EN);
        }

        // Fetch the translation files using the standard browser Fetch API.
        Promise.all([
            fetch('./locales/en.json').then(res => res.json()),
            fetch('./locales/pt-br.json').then(res => res.json())
        ])
        .then(([en, ptBr]) => {
            setTranslations({
                [Language.EN]: en,
                [Language.PT_BR]: ptBr,
            });
        })
        .catch(error => {
            console.error("Failed to load translation files:", error);
            setTranslations({
                [Language.EN]: {},
                [Language.PT_BR]: {},
            });
        });
    }, []);

    const t = useCallback((key: string, replacements?: { [key: string]: string | number }): string | Translations => {
        if (!translations) {
            return key;
        }

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

    if (!translations) {
        return null;
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
