import React, { useState, useCallback } from 'react';
import { Player, PlayerStats } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { ATTRIBUTES } from '../constants';

interface OffSeasonTrainingProps {
    player: Player;
    onTrainingComplete: (improvements: Partial<PlayerStats>) => void;
}

const OffSeasonTraining: React.FC<OffSeasonTrainingProps> = ({ player, onTrainingComplete }) => {
    const { t } = useTranslations();
    const [isTraining, setIsTraining] = useState(false);
    const [results, setResults] = useState<Partial<PlayerStats> | null>(null);

    const handleTrain = useCallback(() => {
        setIsTraining(true);

        setTimeout(() => {
            const focusAreas = player.endOfSeasonReport?.trainingFocus || [];
            const improvements: Partial<PlayerStats> = {};

            ATTRIBUTES.forEach(attr => {
                const isFocus = focusAreas.includes(attr.id);
                const improvementChance = isFocus ? 0.65 : 0.15; // 65% for focus, 15% for others
                
                if (Math.random() < improvementChance) {
                    if (player.stats[attr.id] < 99) {
                         improvements[attr.id] = (improvements[attr.id] || 0) + 1;
                    }
                }
            });

            setResults(improvements);
            setIsTraining(false);
        }, 2000);

    }, [player]);

    if (!player.endOfSeasonReport) {
        return <div>Error: No coach report found.</div>;
    }

    return (
        <div className="max-w-3xl mx-auto animate-fade-in text-center">
            <h1 className="text-4xl font-extrabold mb-2">{t('offSeasonTraining.title') as string}</h1>
            <p className="text-secondary mb-8">{t('offSeasonTraining.subtitle') as string}</p>

            <div className="bg-surface p-6 md:p-8 rounded-xl shadow-2xl border border-white/10">
                {results === null ? (
                    <>
                        <div>
                            <h2 className="text-2xl font-bold mb-4">{t('offSeasonTraining.coachFocus') as string}</h2>
                            <div className="flex flex-wrap justify-center gap-3">
                                {player.endOfSeasonReport.trainingFocus.map(focus => (
                                    <div key={focus} className="bg-nba-blue/20 border border-nba-blue/50 text-nba-blue-300 font-semibold py-2 px-4 rounded-lg">
                                        {t(`attributesList.${focus}`) as string}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleTrain}
                            disabled={isTraining}
                            className="mt-8 bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 disabled:bg-nba-gray transition-all transform hover:scale-105 active:scale-100 disabled:transform-none"
                        >
                            {isTraining ? t('offSeasonTraining.trainingInProgress') as string : t('offSeasonTraining.trainButton') as string}
                        </button>
                    </>
                ) : (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold mb-4">{t('offSeasonTraining.resultsTitle') as string}</h2>
                        <div className="space-y-3">
                            {Object.keys(results).length > 0 ? (
                                Object.entries(results).map(([stat, points]) => (
                                    <div key={stat} className="bg-background p-3 rounded-lg text-lg font-semibold text-green-400">
                                        {t('offSeasonTraining.statImproved', { 
                                            attribute: t(`attributesList.${stat}`) as string,
                                            // FIX: Cast `points` to `number` to resolve TypeScript type error.
                                            points: points as number
                                        }) as string}
                                    </div>
                                ))
                            ) : (
                                <p className="text-secondary">{t('offSeasonTraining.noImprovement') as string}</p>
                            )}
                        </div>
                         <button
                            onClick={() => onTrainingComplete(results)}
                            className="mt-8 bg-nba-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-nba-red transition-all transform hover:scale-105 active:scale-100"
                        >
                            {t('offSeasonTraining.proceedButton') as string}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OffSeasonTraining;