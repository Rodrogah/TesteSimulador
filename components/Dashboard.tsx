import React, { useState, useCallback, useMemo } from 'react';
import { Player, Screen, Game, RosterPlayer, Position, EventChoice, NewsHeadline, LeagueStandings } from '../types';
import { TEAMS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';
import GameProgressChart from './GameProgressChart';
import Phone from './phone/Phone';

interface DashboardProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    leagueStandings: LeagueStandings | null;
    teamStrengths: { [key: string]: number } | null;
    onGamePlayed: (game: Omit<Game, 'id' | 'summary'>) => number;
    onSimulateGames: (numGames: number) => void;
    onNavigate: (screen: Screen) => void;
    onEventDecision: (choice: EventChoice) => void;
    isEventLoading: boolean;
    isNewsLoading: boolean;
    eventsEnabled: boolean;
    onToggleEvents: (enabled: boolean) => void;
    onOpenSettingsModal: () => void;
    onFinishSeason: () => void;
    generateGameStats: (currentPlayer: Player, currentMomentum: number, isClutchSituation: boolean) => { points: number; rebounds: number; assists: number };
    onBackToCareers: () => void;
}

const getPlayerTeamStrength = (player: Player, strengths: { [key: string]: number } | null): number => {
    if (!strengths || !strengths[player.team]) return player.overall;
    const baseTeamStrength = strengths[player.team];
    // A single player's impact is weighted; the team's core strength is more significant.
    return Math.round(player.overall * 0.15 + baseTeamStrength * 0.85);
};

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="bg-background/50 border border-white/10 p-3 rounded-lg text-center transition-transform transform hover:scale-105">
        <div className="text-sm text-secondary">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
    </div>
);

const ChemistryIndicator: React.FC<{ value: number }> = ({ value }) => {
    const { t } = useTranslations();
    
    const getChemistryStyle = (v: number) => {
        if (v >= 80) return { color: 'bg-green-500', label: t('chemistry.excellent') };
        if (v >= 60) return { color: 'bg-green-400', label: t('chemistry.high') };
        if (v >= 40) return { color: 'bg-yellow-400', label: t('chemistry.neutral') };
        if (v >= 20) return { color: 'bg-orange-500', label: t('chemistry.low') };
        return { color: 'bg-red-600', label: t('chemistry.veryLow') };
    };

    const { color, label } = getChemistryStyle(value);

    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-semibold text-secondary">{t('chemistry.title') as string}</span>
                <span className="text-sm font-bold">{label as string}</span>
            </div>
            <div className="w-full bg-background rounded-full h-4 overflow-hidden border border-white/10">
                <div className={`${color} h-4 rounded-full transition-all duration-500 flex items-center justify-center text-xs font-bold text-black/50`} style={{ width: `${value}%` }}>
                    {value}
                </div>
            </div>
        </div>
    );
};


const AchievementItem: React.FC<{ id: string }> = ({ id }) => {
    const { t } = useTranslations();
    return (
        <div className="bg-background p-3 rounded-lg text-left text-sm border border-white/5 transition-transform transform hover:scale-105">
            {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
            <p className="font-bold text-primary">🏆 {t(`achievements.${id}.name`) as string}</p>
            {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
            <p className="text-secondary text-xs">{t(`achievements.${id}.description`) as string}</p>
        </div>
    );
};

const GameLogItem: React.FC<{ game: Game }> = ({ game }) => {
    const { t } = useTranslations();
    return (
        <div className="bg-background border border-white/5 p-3 rounded-lg flex justify-between items-center transition-transform transform hover:scale-105">
            <div className="text-sm">
                {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                {t('vs') as string} {game.opponent}
                <span className={`ml-2 font-bold ${game.result === 'W' ? 'text-green-500' : 'text-red-500'}`}>{game.result}</span>
            </div>
            <div className="text-xs text-secondary">{`${game.points}P/${game.rebounds}R/${game.assists}A`}</div>
        </div>
    );
};

const GameResultModal: React.FC<{ game: Game; onClose: () => void }> = ({ game, onClose }) => {
    const { t } = useTranslations();
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-surface border border-white/10 rounded-xl p-6 w-11/12 max-w-md text-center shadow-2xl animate-pop-in">
                <h2 className={`text-3xl font-bold mb-2 ${game.result === 'W' ? 'text-green-400' : 'text-red-400'}`}>
                    {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                    {game.result === 'W' ? t('victory') as string : t('defeat') as string}
                </h2>
                {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                <p className="text-sm text-secondary mb-4">{t('vs') as string} {game.opponent}</p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                    <StatCard label={t('points') as string} value={game.points} />
                    {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                    <StatCard label={t('rebounds') as string} value={game.rebounds} />
                    {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                    <StatCard label={t('assists') as string} value={game.assists} />
                </div>
                <div className="bg-background border border-white/5 p-4 rounded-lg mb-6 min-h-[80px]">
                    {game.summary ? (
                        <p className="text-sm italic text-primary">{game.summary}</p>
                    ) : (
                        <p className="text-sm italic text-primary animate-pulse">{t('loadingSummary') as string}</p>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="w-full bg-nba-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-nba-red transition-all transform hover:scale-105 active:scale-100"
                >
                    {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                    {t('continue') as string}
                </button>
            </div>
        </div>
    );
};

const NewsFeed: React.FC<{ news: NewsHeadline[], isLoading: boolean }> = ({ news, isLoading }) => {
    const { t } = useTranslations();

    return (
        <div className="bg-surface p-4 rounded-xl shadow-lg border border-white/10">
            <h3 className="font-bold mb-3">{t('mediaBuzz') as string}</h3>
            <div className="space-y-3 min-h-[120px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-6 h-6 border-2 border-nba-blue border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : news.length > 0 ? (
                    news.map((item, index) => (
                        <div key={index} className="text-sm animate-fade-in" style={{ animationDelay: `${index * 100}ms`}}>
                            <span className="font-bold text-secondary mr-2">[{item.source}]</span>
                            <span className="text-primary">{item.headline}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-sm text-secondary pt-8">{t('noNews') as string}</p>
                )}
            </div>
        </div>
    );
};

const ScheduleWidget: React.FC<{ player: Player }> = ({ player }) => {
    const { t } = useTranslations();
    const gamesPlayed = player.seasonStats.gamesPlayed;
    const schedule = player.schedule;

    const upcomingGames = useMemo(() => {
        if (gamesPlayed >= 82) return [];
        return schedule.slice(gamesPlayed, gamesPlayed + 5);
    }, [gamesPlayed, schedule]);

    return (
        <div className="bg-surface p-4 rounded-xl shadow-lg border border-white/10">
            <h3 className="font-bold mb-3">{t('dashboard.upcomingGames') as string}</h3>
            {upcomingGames.length > 0 ? (
                 <div className="space-y-2">
                    {upcomingGames.map((opponentCode, index) => {
                        const opponent = TEAMS[opponentCode];
                        if (!opponent) return null;
                        return (
                             <div key={index} className="flex items-center bg-background p-2 rounded-lg border border-white/5">
                                <img src={opponent.logo} alt={opponent.name} className="w-6 h-6 mr-3" />
                                <span className="text-sm font-semibold">{opponent.name}</span>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p className="text-sm text-secondary text-center">{t('dashboard.seasonOver') as string}</p>
            )}
        </div>
    );
};

const StandingsWidget: React.FC<{
    standings: LeagueStandings | null;
    playerTeamCode: string;
}> = ({ standings, playerTeamCode }) => {
    const { t } = useTranslations();
    const playerConference = TEAMS[playerTeamCode]?.conference;

    const conferenceStandings = useMemo(() => {
        if (!standings || !playerConference) return [];
        return Object.keys(standings)
            .filter(code => TEAMS[code].conference === playerConference)
            .map(code => ({
                code,
                name: TEAMS[code].name,
                logo: TEAMS[code].logo,
                wins: standings[code].wins,
                losses: standings[code].losses,
            }))
            .sort((a, b) => b.wins - a.wins);
    }, [standings, playerConference]);

    if (conferenceStandings.length === 0) return null;

    return (
        <div className="bg-surface p-4 rounded-xl shadow-lg border border-white/10">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">{t('dashboard.conferenceStandings') as string}</h3>
                {/* FIX: Cast results of `t` function to string to resolve TypeScript type error. */}
                <span className="text-xs text-secondary font-semibold">{playerConference === 'East' ? t('standings.east') as string : t('standings.west') as string}</span>
            </div>
            <div className="space-y-1 text-sm">
                <div className="grid grid-cols-12 gap-2 text-secondary font-bold px-2">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-7">{t('standings.team') as string}</div>
                    <div className="col-span-2 text-center">{t('standings.wins') as string}</div>
                    <div className="col-span-2 text-center">{t('standings.losses') as string}</div>
                </div>
                {conferenceStandings.map((team, index) => (
                    <div key={team.code} className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg ${team.code === playerTeamCode ? 'bg-nba-blue/30' : ''}`}>
                        <div className="col-span-1 text-center font-semibold">{index + 1}</div>
                        <div className="col-span-7 flex items-center gap-2 truncate">
                            <img src={team.logo} alt={team.name} className="w-5 h-5 flex-shrink-0" />
                            <span className="truncate">{team.name}</span>
                        </div>
                        <div className="col-span-2 text-center font-bold text-primary">{team.wins}</div>
                        <div className="col-span-2 text-center text-secondary">{team.losses}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ player, setPlayer, leagueStandings, teamStrengths, onGamePlayed, onSimulateGames, onNavigate, onEventDecision, isEventLoading, isNewsLoading, eventsEnabled, onToggleEvents, onOpenSettingsModal, onFinishSeason, generateGameStats, onBackToCareers }) => {
    const { t } = useTranslations();
    const [latestGameId, setLatestGameId] = useState<number | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isPhoneOpen, setIsPhoneOpen] = useState(false);

    const team = TEAMS[player.team];
    const { seasonStats } = player;

    const ppg = seasonStats.gamesPlayed > 0 ? (seasonStats.points / seasonStats.gamesPlayed).toFixed(1) : "0.0";
    const rpg = seasonStats.gamesPlayed > 0 ? (seasonStats.rebounds / seasonStats.gamesPlayed).toFixed(1) : "0.0";
    const apg = seasonStats.gamesPlayed > 0 ? (seasonStats.assists / seasonStats.gamesPlayed).toFixed(1) : "0.0";

    const handlePlayGame = useCallback(() => {
        if (seasonStats.gamesPlayed >= 82 || player.currentEvent || !teamStrengths) return;

        const opponentCode = player.schedule[seasonStats.gamesPlayed];
        const opponentName = TEAMS[opponentCode].name;

        const playerTeamStrength = getPlayerTeamStrength(player, teamStrengths);
        const opponentTeamStrength = teamStrengths[opponentCode];

        const isClutchSituation = player.seasonStats.gamesPlayed >= 72 || opponentTeamStrength > playerTeamStrength + 5;
        
        const chemistryModifier = (player.teamChemistry - 50) / 250; // -0.2 to +0.2 impact
        const winChance = 0.5 + ((playerTeamStrength - opponentTeamStrength) / 40) + (seasonStats.momentum * 0.01) + chemistryModifier + (Math.random() - 0.5) * 0.1;
        const result: "W" | "L" = Math.random() < Math.max(0.05, Math.min(0.95, winChance)) ? 'W' : 'L';
        const gameStats = generateGameStats(player, seasonStats.momentum, isClutchSituation);

        const gameResult = {
            ...gameStats,
            opponent: opponentName,
            result: result
        };

        const gameId = onGamePlayed(gameResult);
        setLatestGameId(gameId);
    }, [seasonStats, player, onGamePlayed, generateGameStats, teamStrengths]);
    
    const handleSkipGames = async (num: number) => {
        if (seasonStats.gamesPlayed >= 82 || isSimulating || player.currentEvent) return;
        setIsSimulating(true);
        await onSimulateGames(num);
        setIsSimulating(false);
    };

    const gameForModal = useMemo(() => {
        return player.seasonStats.games.find(g => g.id === latestGameId);
    }, [player.seasonStats.games, latestGameId]);

    const disableActions = isSimulating || !!player.currentEvent || isEventLoading;

    return (
        <div className="animate-fade-in">
            {isPhoneOpen && <Phone player={player} setPlayer={setPlayer} onClose={() => setIsPhoneOpen(false)} />}
            {gameForModal && <GameResultModal game={gameForModal} onClose={() => setLatestGameId(null)} />}
            
            <header className="grid grid-cols-3 items-center mb-8 gap-2">
                <div className="flex justify-start">
                    <button onClick={onBackToCareers} title="Back to Careers" className="bg-surface p-2 rounded-lg transition-colors flex items-center justify-center h-16 w-16 border border-white/10 hover:bg-nba-gray/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>
                
                <div className="text-center">
                    <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{t('season') as string}</h1>
                    <p className="text-3xl sm:text-4xl font-bold leading-tight">{player.currentSeason}</p>
                </div>

                <div className="flex items-center justify-end gap-2">
                    <div className="text-right hidden md:block">
                        <p className="font-bold text-lg truncate">{player.name}</p>
                        <p className="text-sm text-secondary">{t(`positions.${player.position}`) as string}</p>
                    </div>
                    <button onClick={onOpenSettingsModal} title="Settings" className="text-gray-400 hover:text-white transition-colors bg-surface p-2 rounded-lg border border-white/10 h-16 w-16 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN: Player & Actions */}
                <div className="space-y-6">
                    <div className="bg-surface p-4 rounded-xl text-center shadow-lg border border-white/10 relative">
                         {player.isClutch && (
                            <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full shadow-md" title={t('clutchBadge') as string}>
                                ⚡️ {t('clutchBadge') as string}
                            </div>
                        )}
                        <img src={team.logo} alt={team.name} className="w-24 h-24 mx-auto mb-2" />
                        <h2 className="text-xl font-bold">{team.name}</h2>
                        <div className="mt-4 grid grid-cols-2 gap-4 items-center">
                             <StatCard label={t('overall') as string} value={player.overall} />
                            <div className="text-center">
                                <span className="text-4xl">{seasonStats.momentum > 0 ? '🔥' : seasonStats.momentum < 0 ? '❄️' : '😐'}</span>
                                <p className="text-xs text-secondary">{t('momentum') as string}</p>
                            </div>
                        </div>
                        <div className="mt-4 text-left">
                           <ChemistryIndicator value={player.teamChemistry} />
                        </div>
                    </div>
                     <div className="bg-surface p-4 rounded-xl shadow-lg border border-white/10">
                        <h3 className="font-bold mb-3">{t('seasonAverages') as string}</h3>
                        <div className="grid grid-cols-3 gap-2">
                           <StatCard label="PPG" value={ppg} />
                           <StatCard label="RPG" value={rpg} />
                           <StatCard label="APG" value={apg} />
                        </div>
                    </div>
                     <div className="bg-surface p-4 rounded-xl shadow-lg border border-white/10">
                        <h3 className="font-bold mb-3">{t('teammates') as string}</h3>
                        <div className="space-y-2">
                           {player.teammates.map((mate: RosterPlayer) => (
                               <div key={mate.name} className="bg-background border border-white/5 p-2 rounded-md flex justify-between items-center text-sm">
                                   <span>{mate.name} <span className="text-xs text-secondary">{mate.position}</span></span>
                                   <span className="font-bold">{mate.overall}</span>
                               </div>
                           ))}
                        </div>
                    </div>
                    <div className="bg-surface p-4 rounded-xl shadow-lg border border-white/10">
                        <h3 className="font-bold mb-3">{t('seasonProgress') as string}</h3>
                        <div className="flex justify-between text-sm mb-1">
                            <span>{t('gamesPlayed') as string}</span>
                            <span>{seasonStats.gamesPlayed} / 82</span>
                        </div>
                        <div className="w-full bg-background rounded-full h-4 overflow-hidden">
                            <div className={`bg-gradient-to-r from-nba-blue to-nba-red h-4 rounded-full transition-all duration-500 ${isSimulating || seasonStats.gamesPlayed >= 82 ? 'animate-pulse' : ''}`} style={{ width: `${(seasonStats.gamesPlayed / 82) * 100}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-surface p-4 rounded-xl shadow-lg border border-white/10">
                        <h3 className="font-bold mb-3">{t('actions') as string}</h3>
                        <div className="space-y-3">
                           {seasonStats.gamesPlayed < 82 ? (
                                <>
                                    <button onClick={handlePlayGame} disabled={disableActions} className="w-full bg-nba-blue text-white font-bold py-3 rounded-lg hover:bg-nba-red disabled:bg-gray-600 transition-all transform hover:scale-105 active:scale-100 disabled:transform-none">{t('playNextGame') as string}</button>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <button onClick={() => handleSkipGames(5)} disabled={disableActions} className="bg-nba-gray/20 hover:bg-nba-gray/40 disabled:bg-gray-600 font-semibold py-2 rounded-lg transition-transform transform hover:scale-105 active:scale-100">{t('skip5') as string}</button>
                                        <button onClick={() => handleSkipGames(10)} disabled={disableActions} className="bg-nba-gray/20 hover:bg-nba-gray/40 disabled:bg-gray-600 font-semibold py-2 rounded-lg transition-transform transform hover:scale-105 active:scale-100">{t('skip10') as string}</button>
                                        <button onClick={() => handleSkipGames(82)} disabled={disableActions} className="bg-nba-gray/20 hover:bg-nba-gray/40 disabled:bg-gray-600 font-semibold py-2 rounded-lg transition-transform transform hover:scale-105 active:scale-100">{t('toPlayoffs') as string}</button>
                                    </div>
                                </>
                           ) : (
                                <button onClick={onFinishSeason} disabled={disableActions} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-all transform hover:scale-105 active:scale-100 disabled:transform-none animate-pulse-strong">{t('finishSeason') as string}</button>
                           )}
                           <div className="pt-3 border-t border-white/10 space-y-3">
                                <div className="flex justify-between items-center">
                                    <label htmlFor="events-toggle" className="text-sm font-semibold text-secondary">{t('toggleEvents') as string}</label>
                                    <button
                                        id="events-toggle"
                                        aria-pressed={eventsEnabled}
                                        onClick={() => onToggleEvents(!eventsEnabled)}
                                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-nba-blue ${
                                            eventsEnabled ? 'bg-nba-blue' : 'bg-nba-gray'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
                                                eventsEnabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                                <button onClick={() => setIsPhoneOpen(true)} disabled={disableActions} className="w-full bg-gray-700/50 text-white font-bold py-2 rounded-lg hover:bg-gray-700/80 disabled:bg-gray-600 transition-all transform hover:scale-105 active:scale-100">📱 {t('phone.title') as string}</button>
                                <button onClick={() => onNavigate(Screen.TROPHY_GALLERY)} disabled={disableActions} className="w-full bg-yellow-600/50 text-white font-bold py-2 rounded-lg hover:bg-yellow-600/80 disabled:bg-gray-600 transition-all transform hover:scale-105 active:scale-100">{t('trophyGallery.title') as string}</button>
                                 <button onClick={() => onNavigate(Screen.LEAGUE_STANDINGS)} disabled={disableActions} className="w-full bg-nba-gray/50 text-white font-bold py-2 rounded-lg hover:bg-nba-gray/80 disabled:bg-gray-600 transition-all transform hover:scale-105 active:scale-100">{t('standings.title') as string}</button>
                           </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: World & Stats */}
                <div className="space-y-6">
                    <StandingsWidget standings={leagueStandings} playerTeamCode={player.team} />
                    <ScheduleWidget player={player} />
                     <div className="bg-surface p-4 rounded-xl shadow-lg border border-white/10">
                        <h3 className="font-bold mb-3">{t('recentGames') as string}</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                           {seasonStats.games.slice(0, 10).map((game, i) => <GameLogItem key={game.id || i} game={game} />)}
                           {seasonStats.games.length === 0 && <p className="text-sm text-secondary text-center">{t('noGamesPlayed') as string}</p>}
                        </div>
                    </div>
                     <div className="bg-surface p-4 rounded-xl shadow-lg border border-white/10">
                        <h3 className="font-bold mb-3">{t('achievements.title') as string}</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {player.achievements.map(id => <AchievementItem key={id} id={id} />)}
                             {player.achievements.length === 0 && <p className="text-sm text-secondary text-center">{t('noAchievements') as string}</p>}
                        </div>
                    </div>
                     <NewsFeed news={player.news} isLoading={isNewsLoading} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;