import React from 'react';
import { PlayoffSeries } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface PlayoffGameResult {
    didWin: boolean;
    playerStats: { points: number; assists: number; rebounds: number };
    finalScore: string;
    summary: string;
    strategyResult: NonNullable<PlayoffSeries['lastGameStrategyResult']>;
}

interface PlayoffGameResultModalProps {
    result: PlayoffGameResult;
    onClose: () => void;
}

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="bg-background/50 border border-white/10 p-3 rounded-lg text-center">
        <div className="text-sm text-secondary">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
    </div>
);


const StrategyResult: React.FC<PlayoffGameResultModalProps> = ({ result, onClose }) => {
    const { t } = useTranslations();
    const { didWin, playerStats, finalScore, summary, strategyResult } = result;
    const { choiceId, outcome } = strategyResult;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
            <div className="bg-surface border border-white/10 rounded-xl p-6 w-full max-w-md text-center shadow-2xl animate-pop-in" onClick={e => e.stopPropagation()}>
                <h2 className={`text-3xl font-bold mb-2 ${didWin ? 'text-green-400' : 'text-red-400'}`}>
                    {didWin ? t('victory') as string : t('defeat') as string}
                </h2>
                <p className="text-lg font-semibold text-secondary mb-4">{finalScore}</p>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <StatCard label={t('points') as string} value={playerStats.points} />
                    <StatCard label={t('rebounds') as string} value={playerStats.rebounds} />
                    <StatCard label={t('assists') as string} value={playerStats.assists} />
                </div>

                <div className="bg-background border border-white/10 p-4 rounded-lg text-left mb-6 min-h-[120px]">
                     <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                        <div>
                            <p className="text-xs text-secondary font-semibold">{t('playoffs.strategyResult.strategy') as string}</p>
                            <p className="font-bold text-primary">{t(`playoffStrategies.${choiceId}.name`) as string}</p>
                        </div>
                         <p className={`text-lg font-black ${outcome === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {outcome === 'success' ? t('playoffs.strategyResult.success') as string : t('playoffs.strategyResult.failure') as string}
                        </p>
                    </div>

                    <p className="text-sm italic text-primary">{summary || (t('loadingSummary') as string)}</p>
                </div>

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

export default StrategyResult;