import React from 'react';
import { Player } from '../types';
import { ALL_TROPHIES, TEAMS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';

interface TrophyGalleryProps {
    player: Player;
    onBack: () => void;
}

const TrophyGallery: React.FC<TrophyGalleryProps> = ({ player, onBack }) => {
    const { t } = useTranslations();
    const championships = player.careerStats.seasons.filter(s => s.championship);

    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold">{t('trophyGallery.title') as string}</h1>
                <button onClick={onBack} className="bg-nba-gray/20 hover:bg-nba-gray/40 font-semibold py-2 px-4 rounded-lg transition-colors">
                    &larr; {t('trophyGallery.backButton') as string}
                </button>
            </header>

            <section className="mb-12">
                <h2 className="text-3xl font-bold border-b-2 border-yellow-400 pb-2 mb-6">{t('trophyGallery.championships', { count: championships.length }) as string}</h2>
                {championships.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {championships.map(season => (
                            <div key={season.season} className="bg-surface p-4 rounded-xl text-center shadow-lg border border-yellow-400/50 transition-transform transform hover:scale-105">
                                <img src={TEAMS[season.team].logo} alt={TEAMS[season.team].name} className="w-24 h-24 mx-auto mb-2"/>
                                <p className="font-bold text-xl">🏆 {t('trophyGallery.season') as string} {season.season} 🏆</p>
                                <p className="text-secondary">{TEAMS[season.team].name}</p>
                                {season.fmvp && <p className="text-yellow-400 font-bold mt-2 text-sm">🏅 {t('trophyGallery.fmvpName') as string}</p>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-secondary">{t('trophyGallery.noChampionships') as string}</p>
                )}
            </section>

            <section>
                <h2 className="text-3xl font-bold border-b-2 border-nba-blue pb-2 mb-6">{t('trophyGallery.individualAwards') as string}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {ALL_TROPHIES.map(trophy => {
                        const trophyName = t(`trophies.${trophy.id}.name`) as string;
                        const trophyDesc = t(`trophies.${trophy.id}.description`) as string;
                        return (
                            <div key={trophy.id} className={`bg-surface p-4 rounded-xl text-center shadow-lg transition-all border border-white/10 ${player.trophyCounts[trophy.id] > 0 ? 'opacity-100 transform hover:scale-105 hover:border-yellow-400/50' : 'opacity-40'}`}>
                               <p className="text-5xl mb-2">{player.trophyCounts[trophy.id] > 0 ? '🏆' : '🔒'}</p>
                               <h3 className="font-bold text-lg">{trophyName}</h3>
                               <p className="text-xs text-secondary mb-2">{trophyDesc}</p>
                               {player.trophyCounts[trophy.id] > 0 && (
                                    <p className="text-2xl font-extrabold text-primary">{player.trophyCounts[trophy.id]}x</p>
                               )}
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default TrophyGallery;
