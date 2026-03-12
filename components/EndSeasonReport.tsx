import React from 'react';
import { Player } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface EndSeasonReportProps {
    player: Player;
    onProceed: () => void;
}

const EndSeasonReport: React.FC<EndSeasonReportProps> = ({ player, onProceed }) => {
    const { t } = useTranslations();
    const isLoading = !player.endOfSeasonReport;

    return (
        <div className="max-w-3xl mx-auto animate-fade-in text-center">
            <h1 className="text-4xl font-extrabold mb-2">{t('coachReport.title') as string}</h1>
            <p className="text-secondary mb-8">{t('coachReport.subtitle') as string}</p>

            <div className="bg-surface p-6 md:p-8 rounded-xl shadow-2xl border border-white/10 min-h-[300px] flex flex-col justify-center">
                {isLoading ? (
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-nba-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-lg font-semibold animate-pulse">{t('coachReport.loading') as string}</p>
                    </div>
                ) : (
                    <div className="text-left animate-fade-in">
                        <p className="whitespace-pre-wrap font-mono text-primary leading-relaxed">
                           {player.endOfSeasonReport?.report}
                        </p>
                    </div>
                )}
            </div>
            
            <button 
                onClick={onProceed} 
                disabled={isLoading}
                className="mt-8 bg-nba-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-nba-red disabled:bg-nba-gray transition-all transform hover:scale-105 active:scale-100 disabled:transform-none"
            >
                {t('coachReport.proceedButton') as string}
            </button>
        </div>
    );
};

export default EndSeasonReport;