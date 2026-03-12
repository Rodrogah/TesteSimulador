import React from 'react';
import { Player, Translations } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface RetirementScreenProps {
    player: Player;
    onRestart: () => void;
}

const StatBox: React.FC<{ label: string; value: string | number, highlight?: boolean }> = ({ label, value, highlight }) => (
    <div className={`p-4 rounded-lg text-center transition-transform transform hover:scale-105 ${highlight ? 'bg-yellow-500/10 border border-yellow-500/50' : 'bg-background/50 border border-white/10'}`}>
        <p className="text-sm text-secondary">{label}</p>
        <p className={`text-3xl font-bold ${highlight ? 'text-yellow-400' : 'text-primary'}`}>{value}</p>
    </div>
);

const RetirementScreen: React.FC<RetirementScreenProps> = ({ player, onRestart }) => {
    const { t } = useTranslations();
    const ppg = player.careerStats.totalGames > 0 ? (player.careerStats.totalPoints / player.careerStats.totalGames).toFixed(1) : "0.0";
    
    return (
        <div className="max-w-4xl mx-auto animate-fade-in text-center">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-white to-gray-400 mb-2">
                {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                {t('retirement.title') as string}
            </h1>
            <p className="text-2xl font-bold mb-2">{player.name}</p>
            {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
            <p className="text-secondary mb-8">{t('retirement.seasonsInNBA', { count: player.currentSeason }) as string}</p>
            
            <div className="bg-surface p-6 rounded-xl shadow-lg space-y-8 border border-white/10">
                <section>
                    {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                    <h2 className="text-2xl font-bold border-b-2 border-nba-red pb-2 mb-4 text-left">{t('retirement.careerTotals') as string}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatBox label={t('games') as string} value={player.careerStats.totalGames} />
                        <StatBox label={t('points') as string} value={player.careerStats.totalPoints} />
                        <StatBox label="PPG" value={ppg} />
                        <StatBox label={t('championships') as string} value={player.careerStats.championships} highlight />
                    </div>
                </section>

                <section>
                    {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                    <h2 className="text-2xl font-bold border-b-2 border-nba-blue pb-2 mb-4 text-left">{t('retirement.trophyCase') as string}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* FIX: Correctly cast the return of t('trophies') to Translations type instead of generic object to resolve type error. */}
                        {Object.keys(t('trophies', undefined) as Translations).map(trophyId => player.trophyCounts[trophyId] > 0 && (
                            <div key={trophyId} className="bg-background/50 border border-white/10 p-3 rounded-lg text-center">
                                {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                                <p className="font-bold text-lg">🏆 {t(`trophies.${trophyId}.name`) as string}</p>
                                <p className="text-2xl font-extrabold text-yellow-400">{player.trophyCounts[trophyId]}x</p>
                            </div>
                        ))}
                         {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                         {Object.values(player.trophyCounts).every(c => c === 0) && <p className="text-secondary col-span-full">{t('retirement.noAwards') as string}</p>}
                    </div>
                </section>
                
                <section>
                     {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                     <h2 className="text-2xl font-bold border-b-2 border-nba-gray pb-2 mb-4 text-left">{t('retirement.legacy') as string}</h2>
                     <div className="flex flex-wrap gap-4 justify-center">
                        {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                        {player.achievements.includes('hall-of-fame') && <div className="bg-yellow-500/10 text-yellow-300 font-bold p-3 rounded-lg border border-yellow-500/50">🏛️ {t('achievements.hall-of-fame.name') as string}</div>}
                        {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                        {player.achievements.includes('legend') && <div className="bg-purple-500/10 text-purple-300 font-bold p-3 rounded-lg border border-purple-500/50">🐐 {t('achievements.legend.name') as string}</div>}
                        {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                        {player.achievements.includes('jersey-retired') && <div className="bg-blue-500/10 text-blue-300 font-bold p-3 rounded-lg border border-blue-500/50">👕 {t('achievements.jersey-retired.name') as string}</div>}
                        {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                        {!player.achievements.includes('hall-of-fame') && !player.achievements.includes('legend') && <p className="text-secondary">{t('retirement.solidCareer') as string}</p>}
                     </div>
                </section>

            </div>
            
            <button onClick={onRestart} className="mt-8 bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 active:scale-100">
                {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                {t('retirement.newCareerButton') as string}
            </button>
        </div>
    );
};

export default RetirementScreen;