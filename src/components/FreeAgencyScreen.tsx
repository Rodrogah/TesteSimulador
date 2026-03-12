import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { TEAMS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';

interface FreeAgencyScreenProps {
    player: Player;
    onTeamSelect: (teamCode: string) => void;
}

const FreeAgencyScreen: React.FC<FreeAgencyScreenProps> = ({ player, onTeamSelect }) => {
    const { t } = useTranslations();
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

    const offers = useMemo(() => {
        const currentTeamOffer = { code: player.team, ...TEAMS[player.team] };
        const otherTeams = Object.keys(TEAMS).filter(code => code !== player.team);
        
        const offer1Code = otherTeams.splice(Math.floor(Math.random() * otherTeams.length), 1)[0];
        const offer2Code = otherTeams.splice(Math.floor(Math.random() * otherTeams.length), 1)[0];

        return [
            currentTeamOffer,
            { code: offer1Code, ...TEAMS[offer1Code] },
            { code: offer2Code, ...TEAMS[offer2Code] }
        ].sort(() => Math.random() - 0.5);
    }, [player.team]);

    const handleSelect = (teamCode: string) => {
        if (selectedTeam) return;
        setSelectedTeam(teamCode);
        setTimeout(() => onTeamSelect(teamCode), 1000);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in text-center">
            {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
            <h1 className="text-4xl font-extrabold mb-2">{t('freeAgency.title') as string}</h1>
            {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
            <p className="text-secondary mb-8">{t('freeAgency.subtitle', { season: player.currentSeason + 1 }) as string}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {offers.map(offer => (
                    <div 
                        key={offer.code}
                        onClick={() => handleSelect(offer.code)}
                        className={`bg-surface p-6 rounded-xl shadow-lg border-2 transition-all duration-300 cursor-pointer transform hover:scale-105
                            ${selectedTeam === offer.code ? 'border-green-500 scale-105' : 'border-white/10 hover:border-nba-blue'}
                        `}
                    >
                        <img src={offer.logo} alt={offer.name} className="w-28 h-28 mx-auto mb-4"/>
                        <h2 className="text-2xl font-bold">{offer.name}</h2>
                        {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                        <p className="text-sm text-secondary">{offer.code === player.team ? t('freeAgency.currentTeam') as string : t('freeAgency.newOffer') as string}</p>
                    </div>
                ))}
            </div>

            {selectedTeam && (
                <div className="mt-8 text-lg font-semibold animate-fade-in">
                    {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                    {t('freeAgency.signing', { teamName: TEAMS[selectedTeam].name }) as string}
                </div>
            )}
        </div>
    );
};

export default FreeAgencyScreen;