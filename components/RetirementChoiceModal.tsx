import React from 'react';
import { RetirementChoiceModalProps } from '../types';
import { useTranslations } from '../hooks/useTranslations';

const RetirementChoiceModal: React.FC<RetirementChoiceModalProps> = ({ season, onDecision }) => {
    const { t } = useTranslations();
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-surface border border-white/10 rounded-xl p-6 w-11/12 max-w-md text-center shadow-2xl">
                {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                <h2 className="text-3xl font-bold mb-2 text-primary">{t('retirementPrompt.title') as string}</h2>
                <p className="text-secondary mb-6">
                    {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                    {t('retirementPrompt.description', { season }) as string}
                </p>
                <div className="flex justify-around gap-4">
                    <button
                        onClick={() => onDecision(true)}
                        className="w-full bg-nba-red text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                        {t('retirementPrompt.retireButton') as string}
                    </button>
                    <button
                        onClick={() => onDecision(false)}
                        className="w-full bg-nba-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-800 transition-colors"
                    >
                        {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                        {t('retirementPrompt.continueButton') as string}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RetirementChoiceModal;
