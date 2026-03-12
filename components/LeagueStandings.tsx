import React from 'react';
import { AllTeams, LeagueStandings as LeagueStandingsType, Screen } from '../types';
// FIX: Imported TEAMS constant to be used in StandingsTable prop types.
import { TEAMS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';

interface LeagueStandingsProps {
    standings: LeagueStandingsType | null;
    teams: AllTeams;
    playerTeamCode: string;
    onNavigate: (screen: Screen) => void;
}

const StandingsTable: React.FC<{
    conferenceName: string;
    teams: (typeof TEAMS[string] & { code: string; wins: number; losses: number; winPct: string; })[];
    playerTeamCode: string;
}> = ({ conferenceName, teams, playerTeamCode }) => {
    const { t } = useTranslations();
    return (
        <div className="bg-surface p-4 rounded-xl shadow-lg border border-white/10">
            <h2 className="text-2xl font-bold mb-4">{conferenceName}</h2>
            <table className="w-full text-sm text-left">
                <thead className="border-b-2 border-white/10 text-secondary">
                    <tr>
                        <th className="p-2 w-8">#</th>
                        <th className="p-2">{t('standings.team') as string}</th>
                        <th className="p-2 text-center">{t('standings.wins') as string}</th>
                        <th className="p-2 text-center">{t('standings.losses') as string}</th>
                        <th className="p-2 text-center">{t('standings.winPct') as string}</th>
                    </tr>
                </thead>
                <tbody>
                    {teams.map((team, index) => (
                        <tr key={team.code} className={`border-b border-white/5 ${team.code === playerTeamCode ? 'bg-nba-blue/20' : ''}`}>
                            <td className="p-2 font-bold">{index + 1}</td>
                            <td className="p-2 flex items-center">
                                <img src={team.logo} alt={team.name} className="w-6 h-6 mr-3" />
                                <span className="font-semibold">{team.name}</span>
                            </td>
                            <td className="p-2 text-center">{team.wins}</td>
                            <td className="p-2 text-center">{team.losses}</td>
                            <td className="p-2 text-center font-mono">{team.winPct}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


const LeagueStandings: React.FC<LeagueStandingsProps> = ({ standings, teams, playerTeamCode, onNavigate }) => {
    const { t } = useTranslations();

    const getConferenceStandings = (conference: 'East' | 'West') => {
        if (!standings) return [];
        return Object.keys(standings)
            .filter(code => teams[code].conference === conference)
            .map(code => {
                const gamesPlayed = standings[code].wins + standings[code].losses;
                return {
                    code,
                    ...teams[code],
                    ...standings[code],
                    winPct: gamesPlayed > 0 ? (standings[code].wins / gamesPlayed).toFixed(3) : '.000',
                };
            })
            .sort((a, b) => parseFloat(b.winPct) - parseFloat(a.winPct));
    };

    const eastStandings = getConferenceStandings('East');
    const westStandings = getConferenceStandings('West');

    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold">{t('standings.title') as string}</h1>
                <button onClick={() => onNavigate(Screen.DASHBOARD)} className="bg-nba-gray/20 hover:bg-nba-gray/40 font-semibold py-2 px-4 rounded-lg transition-colors">
                    &larr; {t('trophyGallery.backButton') as string}
                </button>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <StandingsTable conferenceName={t('standings.east') as string} teams={eastStandings} playerTeamCode={playerTeamCode} />
                <StandingsTable conferenceName={t('standings.west') as string} teams={westStandings} playerTeamCode={playerTeamCode} />
            </div>
        </div>
    );
};

export default LeagueStandings;