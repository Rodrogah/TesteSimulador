import React from 'react';
import { PlayoffChoice, PlayerStats, StrategyEffects } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface PlayoffChoiceModalProps {
    isOpen: boolean;
    choices: PlayoffChoice[];
    onChoice: (choice: PlayoffChoice) => void;
    opponentArchetype?: string;
    opponentStarOverall?: number;
    playerStats: PlayerStats;
}

const formatEffects = (effects: StrategyEffects | undefined, t: (key: string) => string): { text: string; color: string; }[] => {
    if (!effects) return [];
    const strings: { text: string; color: string; }[] = [];
    const addEffect = (key: string, value: number) => {
        if (value > 0) {
            strings.push({ text: `${t(`strategyEffects.${key}`)} ▲`, color: 'text-green-400' });
        } else if (value < 0) {
            strings.push({ text: `${t(`strategyEffects.${key}`)} ▼`, color: 'text-red-400' });
        }
    };

    if (effects.playerPerformanceBoost?.points) addEffect('playerPoints', effects.playerPerformanceBoost.points);
    if (effects.playerPerformanceBoost?.rebounds) addEffect('playerRebounds', effects.playerPerformanceBoost.rebounds);
    if (effects.playerPerformanceBoost?.assists) addEffect('playerAssists', effects.playerPerformanceBoost.assists);
    if (effects.teamOffenseBoost) addEffect('teamOffense', effects.teamOffenseBoost);
    if (effects.teamDefenseBoost) addEffect('teamDefense', effects.teamDefenseBoost);
    if (effects.opponentOffenseNerf) addEffect('opponentOffense', -effects.opponentOffenseNerf); // Inverted logic for display
    if (effects.opponentDefenseNerf) addEffect('opponentDefense', -effects.opponentDefenseNerf); // Inverted logic for display
    
    if (strings.length === 0) {
        strings.push({ text: t('strategyEffects.none'), color: 'text-secondary' });
    }

    return strings;
};

const PlayoffChoiceModal: React.FC<PlayoffChoiceModalProps> = ({ isOpen, choices, onChoice, opponentArchetype, opponentStarOverall, playerStats }) => {
    const { t } = useTranslations();
    if (!isOpen) return null;

    const riskColor = (risk: 'low' | 'medium' | 'high') => {
        if (risk === 'low') return 'border-green-500 bg-green-500/10 text-green-400';
        if (risk === 'medium') return 'border-yellow-500 bg-yellow-500/10 text-yellow-400';
        return 'border-red-500 bg-red-500/10 text-red-400';
    };
    
    const categoryColor = (category: 'offensive' | 'defensive' | 'team') => {
        if (category === 'offensive') return 'text-nba-red';
        if (category === 'defensive') return 'text-nba-blue';
        return 'text-purple-400';
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-surface border border-white/10 rounded-xl p-6 w-full max-w-4xl text-center shadow-2xl animate-slide-in">
                <h2 className="text-3xl font-bold mb-2 text-primary">{t('playoffChoice.title') as string}</h2>
                <p className="text-secondary mb-6">{t('playoffChoice.subtitle') as string}</p>

                {opponentArchetype && (
                    <div className="bg-background border border-white/10 p-4 rounded-lg mb-6 text-left">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-secondary">{t('playoffs.scouting.title') as string}</h3>
                            <span className="text-lg font-bold">OVR {opponentStarOverall}</span>
                        </div>
                        <p className="text-primary italic mt-1">{t(`playoffs.scouting.${opponentArchetype}`) as string}</p>
                    </div>
                )}


                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {choices.map(choice => {
                         const primaryStatName = t(`attributesList.${choice.primaryStat}`) as string;
                         const secondaryStatName = t(`attributesList.${choice.secondaryStat}`) as string;
                         const successStrings = formatEffects(choice.successEffects, (key: string) => t(key) as string);
                         const failureStrings = formatEffects(choice.failureEffects, (key: string) => t(key) as string);

                        return(
                        <button
                            key={choice.id}
                            onClick={() => onChoice(choice)}
                            className="w-full bg-background border border-white/10 p-4 rounded-lg text-left hover:bg-nba-gray/20 hover:border-nba-blue transition-all duration-200"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${categoryColor(choice.category)} bg-opacity-10 bg-current`}>
                                            {t(`playoffStrategies.categories.${choice.category}`) as string}
                                        </span>
                                        <h3 className="font-bold text-lg text-primary">{t(`playoffStrategies.${choice.id}.name`) as string}</h3>
                                    </div>
                                    <p className="text-sm text-secondary mb-3">{t(`playoffStrategies.${choice.id}.description`) as string}</p>
                                     <div className="text-xs text-secondary flex items-center gap-4">
                                        <span>{t('playoffChoice.keyStats') as string}:</span>
                                        <span className="font-semibold text-primary">{primaryStatName} ({playerStats[choice.primaryStat]})</span>
                                        <span className="font-semibold text-primary">{secondaryStatName} ({playerStats[choice.secondaryStat]})</span>
                                    </div>
                                </div>
                                <div className={`text-xs font-bold uppercase px-2 py-1 rounded-full border self-center ${riskColor(choice.risk)}`}>
                                   {t(`playoffChoice.risk.${choice.risk}`) as string}
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-white/10 text-xs grid grid-cols-2 gap-4">
                                <div className="text-left">
                                    <span className="font-bold text-green-400">{t('playoffs.strategyResult.onSuccess') as string}:</span>
                                    <ul className="pl-1 space-y-0.5 mt-1">
                                        {successStrings.map((s, i) => <li key={i} className={s.color}>{s.text}</li>)}
                                    </ul>
                                </div>
                                <div className="text-left">
                                    <span className="font-bold text-red-400">{t('playoffs.strategyResult.onFailure') as string}:</span>
                                    <ul className="pl-1 space-y-0.5 mt-1">
                                        {failureStrings.map((s, i) => <li key={i} className={s.color}>{s.text}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </button>
                    )})}
                </div>
            </div>
        </div>
    );
};

export default PlayoffChoiceModal;