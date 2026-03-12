

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Player, PlayoffSeries, Position, PlayoffChoice, EventChoice, PlayerStats, StrategyEffects, PlayoffBracket, PlayoffMatchup, PlayoffConferenceBracket } from '../types';
import { TEAMS, PLAYOFF_STRATEGIES } from '../constants';
import { useTranslations } from '../hooks/useTranslations';
import PlayoffChoiceModal from './PlayoffChoiceModal';
import { generateGameEvent, generatePlayoffGameSummary } from '../services/puterService';
import EventModal from './EventModal';
import PlayoffGameResultModal from './StrategyResult';
import PlayoffBracketDisplay from './PlayoffBracket';

interface PlayoffsProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    onPlayoffsOver: () => void;
    addNotification: (title: string, description: string, type: 'achievement' | 'trophy' | 'event') => void;
    onEventDecision: (choice: EventChoice) => void;
    isEventLoading: boolean;
    setIsEventLoading: (isLoading: boolean) => void;
    teamStrengths: { [key: string]: number } | null;
}

interface PlayoffGameResult {
    didWin: boolean;
    playerStats: { points: number; assists: number; rebounds: number };
    finalScore: string;
    summary: string;
    strategyResult: NonNullable<PlayoffSeries['lastGameStrategyResult']>;
}

const getPlayerTeamStrength = (player: Player, strengths: { [key: string]: number } | null): number => {
    if (!strengths || !strengths[player.team]) return player.overall;
    const baseTeamStrength = strengths[player.team];
    // A single player's impact is weighted; the team's core strength is more significant.
    return Math.round(player.overall * 0.15 + baseTeamStrength * 0.85);
};

const getRandomInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const StatCard: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className }) => (
    <div className={`bg-background/50 border border-white/10 p-3 rounded-lg text-center ${className}`}>
        <div className="text-sm text-secondary">{label}</div>
        <div className="text-2xl font-bold" key={value}>{value}</div>
    </div>
);


const Playoffs: React.FC<PlayoffsProps> = ({ player, setPlayer, onPlayoffsOver, addNotification, onEventDecision, isEventLoading, setIsEventLoading, teamStrengths }) => {
    const { t, language } = useTranslations();
    const [currentSeries, setCurrentSeries] = useState<PlayoffSeries | null>(player.playoffSeries[player.currentPlayoffRound]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isChampion, setIsChampion] = useState(false);
    const [liveGameData, setLiveGameData] = useState<{
        playerStats: { points: number; assists: number; rebounds: number };
        scores: { player: number; opponent: number };
        quarter: number;
        opponentAtStart: string;
    } | null>(null);
    const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
    const [lastGameResult, setLastGameResult] = useState<PlayoffGameResult | null>(null);
    const [overtimeCount, setOvertimeCount] = useState(0);
    const [liveScoreEnabled, setLiveScoreEnabled] = useState(true);
    const [playoffEventsEnabled, setPlayoffEventsEnabled] = useState(true);
    const [showBracket, setShowBracket] = useState(true);
    const [simulationSpeed, setSimulationSpeed] = useState(2); // 1x, 2x, 4x
    const possessionsCounter = useRef(0);
    const simulationSpeedRef = useRef(simulationSpeed);
    const gameLoopTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        simulationSpeedRef.current = simulationSpeed;
    }, [simulationSpeed]);

    useEffect(() => {
        // Cleanup timeout on component unmount
        return () => {
            if (gameLoopTimeoutRef.current) {
                clearTimeout(gameLoopTimeoutRef.current);
            }
        };
    }, []);
    
     const getChoicesForGame = useCallback((playerStats: PlayerStats): PlayoffChoice[] => {
        const compatibleStrategies = PLAYOFF_STRATEGIES.filter(s => {
            if (!s.minStats) return true;
            return Object.entries(s.minStats).every(([stat, value]) => {
                return playerStats[stat as keyof PlayerStats] >= (value ?? 0);
            });
        });

        const shuffle = (array: PlayoffChoice[]) => array.sort(() => 0.5 - Math.random());
        
        const offensive = shuffle(compatibleStrategies.filter(s => s.category === 'offensive')).slice(0, 2);
        const defensive = shuffle(compatibleStrategies.filter(s => s.category === 'defensive')).slice(0, 2);
        const team = shuffle(compatibleStrategies.filter(s => s.category === 'team')).slice(0, 1);

        return shuffle([...offensive, ...defensive, ...team]);
    }, []);

    const [choices, setChoices] = useState<PlayoffChoice[]>(getChoicesForGame(player.stats));

    useEffect(() => {
        const series = player.playoffSeries[player.currentPlayoffRound];
        if (series) {
            setCurrentSeries(series);
            setChoices(getChoicesForGame(player.stats));
        }
    }, [player.currentPlayoffRound, player.playoffSeries, player.stats, getChoicesForGame]);

    useEffect(() => {
        // If the current series has no opponent, it means we need to simulate the feeder series.
        if (currentSeries && !currentSeries.opponent && player.currentPlayoffRound < 4 && teamStrengths) {
            const simulationInterval = setInterval(() => {
                setPlayer(currentPlayer => {
                    if (!currentPlayer || !currentPlayer.playoffBracket || !teamStrengths) {
                        return currentPlayer;
                    }

                    const playerTeam = currentPlayer.team;
                    const playerConference = TEAMS[playerTeam].conference as 'East' | 'West';
                    const roundNames = ['First Round', 'Conference Semifinals', 'Conference Finals'] as const;

                    let feederMatchup: PlayoffMatchup | undefined | null = null;
                    
                    if (currentPlayer.currentPlayoffRound === 3) { // Waiting for NBA Finals opponent
                        const otherConference = playerConference === 'East' ? 'West' : 'East';
                        feederMatchup = currentPlayer.playoffBracket[otherConference]['Conference Finals'][0];
                    } else if (currentPlayer.currentPlayoffRound > 0) { // Waiting for conference opponent
                        const prevRoundName = roundNames[currentPlayer.currentPlayoffRound - 1];
                        const playerPrevMatchup = currentPlayer.playoffBracket[playerConference][prevRoundName]?.find(m => m.team1.code === playerTeam || m.team2.code === playerTeam);
                        if (playerPrevMatchup && playerPrevMatchup.nextMatchupId) {
                            const nextId = playerPrevMatchup.nextMatchupId;
                            feederMatchup = currentPlayer.playoffBracket[playerConference][prevRoundName]?.find(m => m.nextMatchupId === nextId && m.id !== playerPrevMatchup.id);
                        }
                    }

                    if (!feederMatchup || feederMatchup.winner || !feederMatchup.team1.code || !feederMatchup.team2.code) {
                        return currentPlayer; // Opponent is ready, or something is wrong. Interval will be cleared.
                    }

                    const newBracket = JSON.parse(JSON.stringify(currentPlayer.playoffBracket)) as PlayoffBracket;
                    
                    let mutableMatchup: PlayoffMatchup | undefined;
                    for (const conf of ['East', 'West']) {
                        for (const round of roundNames) {
                            const matchup = newBracket[conf as 'East' | 'West'][round]?.find((m: PlayoffMatchup) => m.id === feederMatchup!.id);
                            if (matchup) { mutableMatchup = matchup; break; }
                        }
                        if(mutableMatchup) break;
                    }
                    
                    if (!mutableMatchup) return currentPlayer;

                    // Simulate one game
                    const team1Strength = teamStrengths[mutableMatchup.team1.code];
                    const team2Strength = teamStrengths[mutableMatchup.team2.code];
                    const winChance = 0.5 + (team1Strength - team2Strength) * 0.025;
                    if (Math.random() < winChance) {
                        mutableMatchup.team1Wins++;
                    } else {
                        mutableMatchup.team2Wins++;
                    }

                    let winnerCode: string | null = null;
                    if (mutableMatchup.team1Wins === 4) {
                        winnerCode = mutableMatchup.team1.code;
                    } else if (mutableMatchup.team2Wins === 4) {
                        winnerCode = mutableMatchup.team2.code;
                    }
                    mutableMatchup.winner = winnerCode;

                    let newPlayoffSeries = [...currentPlayer.playoffSeries];

                    if (winnerCode) {
                        const opponentArchetypes = ['offensive_juggernaut', 'defensive_lockdown', 'pace_and_space', 'dominant_big'] as const;
                        const seriesToUpdate = newPlayoffSeries[currentPlayer.currentPlayoffRound];
                        
                        seriesToUpdate.opponent = winnerCode;
                        seriesToUpdate.opponentArchetype = opponentArchetypes[Math.floor(Math.random() * opponentArchetypes.length)];
                        seriesToUpdate.opponentStarOverall = 88 + currentPlayer.currentPlayoffRound * 2 + Math.floor(Math.random() * 3);
                    }
                    
                    return { ...currentPlayer, playoffBracket: newBracket, playoffSeries: newPlayoffSeries };
                });
            }, 3000);

            return () => clearInterval(simulationInterval);
        }
    }, [currentSeries, player.currentPlayoffRound, player.team, setPlayer, teamStrengths]);

    const handleAdvanceRound = () => {
        if (!player.playoffBracket) return;

        if (player.currentPlayoffRound >= 3) {
            onPlayoffsOver();
            return;
        }

        const nextRound = player.currentPlayoffRound + 1;
        const playerConference = TEAMS[player.team].conference as 'East' | 'West';
        let nextMatchup: PlayoffMatchup | undefined;
        let nextRoundName: keyof PlayoffConferenceBracket | 'NBA Finals' = 'Conference Semifinals';

        if(nextRound === 1) nextRoundName = 'Conference Semifinals';
        if(nextRound === 2) nextRoundName = 'Conference Finals';
        
        if (nextRound === 3) {
            nextMatchup = player.playoffBracket['NBA Finals']!;
        } else {
            nextMatchup = player.playoffBracket[playerConference][nextRoundName].find(m => m.isPlayerMatchup);
        }
        
        const updatedPlayerSeries = [...player.playoffSeries];

        // FIX: Add `as const` to the array to ensure TypeScript infers the correct literal union type for `opponentArchetype`, preventing a potential type error.
        const opponentArchetypes = ['offensive_juggernaut', 'defensive_lockdown', 'pace_and_space', 'dominant_big'] as const;
        const opponentCode = nextMatchup?.team1.code === player.team ? nextMatchup?.team2.code : nextMatchup?.team1.code;

        if (opponentCode) {
             updatedPlayerSeries[nextRound] = {
                 ...updatedPlayerSeries[nextRound],
                 opponent: opponentCode,
                 opponentArchetype: opponentArchetypes[Math.floor(Math.random() * opponentArchetypes.length)],
                 opponentStarOverall: 88 + nextRound * 2 + Math.floor(Math.random() * 3),
                 team1Wins: 0,
                 team2Wins: 0,
                 games: Array(7).fill(null),
                 completed: false
            };
        } else {
             updatedPlayerSeries[nextRound] = { ...updatedPlayerSeries[nextRound], opponent: null };
        }
        setPlayer(p => p ? { ...p, currentPlayoffRound: nextRound, playoffSeries: updatedPlayerSeries } : null);
    };
    
    const simulateBracketAndAdvance = useCallback((bracket: PlayoffBracket, playerTeamCode: string): PlayoffBracket => {
        if (!teamStrengths) return bracket;
        const newBracket = JSON.parse(JSON.stringify(bracket)) as PlayoffBracket;
    
        const simulateRound = (matchups: PlayoffMatchup[]) => {
            if (!Array.isArray(matchups)) return;
            for (const matchup of matchups) {
                // If winner is already decided, or it's the player's current matchup, or matchup is incomplete, skip.
                if (matchup.winner || !matchup.team1.code || !matchup.team2.code) {
                    continue;
                }
                // The player's matchup result is handled by game simulation, not here.
                if(matchup.isPlayerMatchup) continue;
    
                const team1Strength = teamStrengths[matchup.team1.code];
                const team2Strength = teamStrengths[matchup.team2.code];
                
                const winChance = 0.5 + (team1Strength - team2Strength) * 0.025; // per game win probability for team 1

                if (Math.random() < winChance) {
                    matchup.team1Wins++;
                } else {
                    matchup.team2Wins++;
                }

                if (matchup.team1Wins === 4) {
                    matchup.winner = matchup.team1.code;
                } else if (matchup.team2Wins === 4) {
                    matchup.winner = matchup.team2.code;
                }
            }
        };
        
        // Creates the matchups for the next round based on the winners of the current round
        const createNextRoundMatchups = (conference: 'East' | 'West', currentRound: keyof PlayoffConferenceBracket, nextRound: keyof PlayoffConferenceBracket) => {
            const roundMatchups = newBracket[conference][currentRound];
            if (!Array.isArray(roundMatchups) || roundMatchups.length === 0) return;
    
            const nextRoundFeederGroups: { [key: string]: PlayoffMatchup[] } = {};
            for (const matchup of roundMatchups) {
                if (matchup.nextMatchupId) {
                    if (!nextRoundFeederGroups[matchup.nextMatchupId]) {
                        nextRoundFeederGroups[matchup.nextMatchupId] = [];
                    }
                    nextRoundFeederGroups[matchup.nextMatchupId].push(matchup);
                }
            }
    
            for (const nextMatchupId in nextRoundFeederGroups) {
                const feederMatchups = nextRoundFeederGroups[nextMatchupId];
    
                // If the next round matchup already exists, skip creating it.
                const nextRoundArray = newBracket[conference][nextRound] as PlayoffMatchup[];
                if (nextRoundArray.some(m => m.id === nextMatchupId)) {
                    continue;
                }
    
                if (feederMatchups.length === 2 && feederMatchups.every(m => m.winner)) {
                    const [feeder1, feeder2] = feederMatchups;
                    const newTeam1 = { code: feeder1.winner!, seed: feeder1.team1.code === feeder1.winner ? feeder1.team1.seed : feeder1.team2.seed };
                    const newTeam2 = { code: feeder2.winner!, seed: feeder2.team1.code === feeder2.winner ? feeder2.team1.seed : feeder2.team2.seed };
    
                    const newMatchup: PlayoffMatchup = {
                        id: nextMatchupId,
                        team1: newTeam1,
                        team2: newTeam2,
                        team1Wins: 0, team2Wins: 0, winner: null,
                        isPlayerMatchup: newTeam1.code === playerTeamCode || newTeam2.code === playerTeamCode,
                        nextMatchupId: nextRound === 'Conference Semifinals' ? `${conference[0]}-CF` : null,
                    };
                    nextRoundArray.push(newMatchup);
                }
            }
        };
    
        const conferences: ('East' | 'West')[] = ['East', 'West'];
    
        for (const conf of conferences) {
            simulateRound(newBracket[conf]['First Round']);
            createNextRoundMatchups(conf, 'First Round', 'Conference Semifinals');
            
            simulateRound(newBracket[conf]['Conference Semifinals']);
            createNextRoundMatchups(conf, 'Conference Semifinals', 'Conference Finals');
            
            simulateRound(newBracket[conf]['Conference Finals']);
            const confFinal = (newBracket[conf]['Conference Finals'] as PlayoffMatchup[])[0];
            if (confFinal && confFinal.winner) {
                newBracket[conf].champion = confFinal.winner;
            }
        }
    
        if (newBracket.East.champion && newBracket.West.champion && !newBracket['NBA Finals']) {
            const eastChampData = (newBracket.East['Conference Finals'] as PlayoffMatchup[])[0];
            const westChampData = (newBracket.West['Conference Finals'] as PlayoffMatchup[])[0];
    
            const eastChampCode = newBracket.East.champion;
            const westChampCode = newBracket.West.champion;
    
            const eastSeed = eastChampData.team1.code === eastChampCode ? eastChampData.team1.seed : eastChampData.team2.seed;
            const westSeed = westChampData.team1.code === westChampCode ? westChampData.team1.seed : westChampData.team2.seed;
            
            newBracket['NBA Finals'] = {
                id: 'NBA-Finals',
                team1: { code: eastChampCode, seed: eastSeed },
                team2: { code: westChampCode, seed: westSeed },
                team1Wins: 0, team2Wins: 0, winner: null,
                isPlayerMatchup: eastChampCode === playerTeamCode || westChampCode === playerTeamCode,
                nextMatchupId: null
            };
        }
        
        if (newBracket['NBA Finals']) {
            simulateRound([newBracket['NBA Finals']]);
            if (newBracket['NBA Finals'].winner) {
                newBracket['NBA Champion'] = newBracket['NBA Finals'].winner;
            }
        }
        
        return newBracket;
    }, [teamStrengths]);

    const handlePostGameUpdate = useCallback(async (
        gameResultData: {
            didWin: boolean;
            playerStats: { points: number; assists: number; rebounds: number };
            finalScore: string;
        },
        updatedSeries: PlayoffSeries,
        strategyResult: NonNullable<PlayoffSeries['lastGameStrategyResult']>
    ) => {
        const gameIndex = updatedSeries.games.indexOf(null);
        let playerAfterGame: Player | null = null;

        const seriesWithResult = { ...updatedSeries, lastGameStrategyResult: strategyResult };
        
        setPlayer(p => {
            if (!p || !p.playoffBracket) return null;
            let newAchievements = [...p.achievements];
            let newTrophyCounts = {...p.trophyCounts};
            let newOverall = p.overall;
            
            if (seriesWithResult.completed && seriesWithResult.team1Wins === 4) {
                 const checkAndAdd = (id: string) => { 
                     if(!newAchievements.includes(id)) {
                         newAchievements.push(id);
                         addNotification(t(`achievements.${id}.name`) as string, t(`achievements.${id}.description`) as string, 'achievement');
                     }
                };
                 checkAndAdd('series-win');
                 if(p.currentPlayoffRound === 1) checkAndAdd('conference-finals');
                 if(p.currentPlayoffRound === 2) checkAndAdd('nba-finals');
                 newOverall = Math.min(99, newOverall + 1);

                 if (p.currentPlayoffRound === 3) {
                     setIsChampion(true);
                     checkAndAdd('champion');
                     if(Math.random() < 0.7) { 
                        newTrophyCounts['fmvp']++;
                        addNotification(t('trophies.fmvp.name') as string, t('trophies.fmvp.description') as string, 'trophy');
                     }
                 }
            }

            const { didWin, playerStats } = gameResultData;
            const newSeasonStats = {
                ...p.seasonStats,
                points: p.seasonStats.points + playerStats.points,
                rebounds: p.seasonStats.rebounds + playerStats.rebounds,
                assists: p.seasonStats.assists + playerStats.assists,
                playoffGames: p.seasonStats.playoffGames + 1,
                playoffWins: p.seasonStats.playoffWins + (didWin ? 1 : 0),
                playoffLosses: p.seasonStats.playoffLosses + (didWin ? 0 : 1),
            };

            const bracketCopy = JSON.parse(JSON.stringify(p.playoffBracket));
            const playerConf = TEAMS[p.team].conference as 'East' | 'West';
            const roundNames = ['First Round', 'Conference Semifinals', 'Conference Finals'] as const;
            
            let playerMatchup: PlayoffMatchup | undefined | null = null;
            if (p.currentPlayoffRound < 3) {
                const roundName = roundNames[p.currentPlayoffRound];
                playerMatchup = bracketCopy[playerConf][roundName]?.find((m: PlayoffMatchup) => m.isPlayerMatchup);
            } else {
                playerMatchup = bracketCopy['NBA Finals'];
            }
                
            if(playerMatchup) {
                if (playerMatchup.team1.code === p.team) {
                    playerMatchup.team1Wins = seriesWithResult.team1Wins;
                    playerMatchup.team2Wins = seriesWithResult.team2Wins;
                } else {
                    playerMatchup.team1Wins = seriesWithResult.team2Wins;
                    playerMatchup.team2Wins = seriesWithResult.team1Wins;
                }
                
                if (seriesWithResult.completed) {
                    if (seriesWithResult.team1Wins === 4) {
                        playerMatchup.winner = p.team;
                    } else if (seriesWithResult.team2Wins === 4) {
                        playerMatchup.winner = seriesWithResult.opponent;
                    }
                }
            }

            const updatedBracket = simulateBracketAndAdvance(bracketCopy, p.team);

            playerAfterGame = { 
                ...p, 
                seasonStats: newSeasonStats,
                playoffSeries: [...p.playoffSeries.slice(0, p.currentPlayoffRound), seriesWithResult, ...p.playoffSeries.slice(p.currentPlayoffRound + 1)], 
                achievements: newAchievements, 
                trophyCounts: newTrophyCounts, 
                overall: newOverall,
                playoffBracket: updatedBracket,
            };
            return playerAfterGame;
        });

        setCurrentSeries(seriesWithResult);
        setIsSimulating(false);

        const strategyName = t(`playoffStrategies.${strategyResult.choiceId}.name`) as string;
        const summary = await generatePlayoffGameSummary(player, gameResultData, { ...strategyResult, strategyName }, TEAMS[seriesWithResult.opponent!].name, language);
        setLastGameResult({ ...gameResultData, summary, strategyResult });
    
        if (playerAfterGame && playoffEventsEnabled) {
            const eventChance = 0.30;
            if (Math.random() < eventChance) {
                 const context = `Just finished Game ${gameIndex+1} of the ${seriesWithResult.name}. We ${gameResultData.didWin ? 'won' : 'lost'}. The series is now ${seriesWithResult.team1Wins}-${seriesWithResult.team2Wins}.`;
                 setIsEventLoading(true);
                 generateGameEvent(playerAfterGame, context, language).then(event => {
                     if(event) {
                         setPlayer(p => p ? {...p, currentEvent: event} : null);
                     }
                 }).finally(() => {
                    setIsEventLoading(false);
                 });
            }
        }
    }, [addNotification, language, setPlayer, setIsEventLoading, t, playoffEventsEnabled, player, simulateBracketAndAdvance]);

     const calculateStrategyOutcome = useCallback((choice: PlayoffChoice) => {
        const personalityKeywords = {
            confident: ["confident", "arrogant", "leader", "takeover"],
            hardworking: ["work ethic", "hard work", "gym rat", "first in", "last out"],
            maverick: ["unpredictable", "maverick", "creative", "instinct"],
            team_player: ["team-first", "unselfish", "teammates better", "leader by example"],
            aggressive: ["physical", "aggressive", "enforcer", "never back down"]
        };

        let personalityBonus = 0;
        if (choice.personalityTrait) {
            const keywords = personalityKeywords[choice.personalityTrait];
            if (keywords.some(k => player.bio.toLowerCase().includes(k))) {
                personalityBonus = 3; // Reduced bonus to fit new scale
            }
        }

        const primaryStatValue = player.stats[choice.primaryStat];
        const secondaryStatValue = player.stats[choice.secondaryStat];
        
        // Re-calibrated formula to include overall and have a wider, more sensitive range.
        const strategyPower = (primaryStatValue * 0.6) + (secondaryStatValue * 0.25) + (player.overall * 0.15) + personalityBonus;

        // Adjusted thresholds to match the new strategyPower calculation.
        let successThreshold = 26; // Medium risk as baseline
        if (choice.risk === 'low') successThreshold = 22;
        if (choice.risk === 'high') successThreshold = 30;

        // The multiplier is slightly increased to make stat differences more impactful.
        const successRate = Math.round(Math.min(95, Math.max(5, 50 + (strategyPower - successThreshold) * 3)));
        const isSuccess = (Math.random() * 100) < successRate;

        return { successRate, isSuccess };
    }, [player.stats, player.bio, player.overall]);

    const generatePlayoffGameStats = useCallback((
        player: Player,
        boosts?: StrategyEffects['playerPerformanceBoost']
    ): { points: number, rebounds: number, assists: number } => {
        const { seasonStats, overall } = player;
        
        const ppg = seasonStats.gamesPlayed > 0 ? (seasonStats.points / seasonStats.gamesPlayed) : 15;
        const rpg = seasonStats.gamesPlayed > 0 ? (seasonStats.rebounds / seasonStats.gamesPlayed) : 5;
        const apg = seasonStats.gamesPlayed > 0 ? (seasonStats.assists / seasonStats.gamesPlayed) : 5;
    
        const intensity = 1.05 + ((overall - 75) / 100) * 0.1;
        const consistency = (overall - 60) / 40;
        
        const pointsVariance = 12 - (consistency * 6);
        const ancillaryVariance = 6 - (consistency * 3);
        
        const clutchModifier = player.isClutch ? 1.15 : 1.0; // 15% boost in playoffs
    
        let points = ppg * intensity + (Math.random() - 0.5) * pointsVariance;
        let rebounds = rpg * intensity + (Math.random() - 0.5) * ancillaryVariance;
        let assists = apg * intensity + (Math.random() - 0.5) * ancillaryVariance;

        if (boosts) {
            if (boosts.points) points *= (1 + boosts.points / 100);
            if (boosts.rebounds) rebounds *= (1 + boosts.rebounds / 100);
            if (boosts.assists) assists *= (1 + boosts.assists / 100);
        }
    
        return {
            points: Math.max(0, Math.round(points * clutchModifier)),
            rebounds: Math.max(0, Math.round(rebounds)),
            assists: Math.max(0, Math.round(assists * clutchModifier)),
        };
    }, []);

    const startLiveGame = useCallback((choice: PlayoffChoice) => {
        if (!currentSeries || currentSeries.completed || !currentSeries.opponent) return;
    
        const { successRate, isSuccess } = calculateStrategyOutcome(choice);
        const effects = isSuccess ? choice.successEffects : choice.failureEffects;
        const strategyResult = { choiceId: choice.id, successRate, outcome: isSuccess ? 'success' : 'failure' as const };
    
        setIsSimulating(true);
        possessionsCounter.current = 0;
        setOvertimeCount(0);
        setLiveGameData({
            playerStats: { points: 0, assists: 0, rebounds: 0 },
            scores: { player: 0, opponent: 0 },
            quarter: 1,
            opponentAtStart: currentSeries.opponent,
        });
    
        let totalPossessions = 190;
        const baseDelay = 240;
    
        const gameLoop = () => {
            setLiveGameData(prev => {
                if (!prev) {
                    // Game has ended, loop is stopped.
                    return null;
                }
    
                if (possessionsCounter.current >= totalPossessions) {
                    if (prev.scores.player === prev.scores.opponent) {
                        totalPossessions += 20;
                        setOvertimeCount(oc => oc + 1);
                        // Continue to next tick for OT
                    } else {
                        // Game over, handle updates and return null to stop the loop.
                        const didWin = prev.scores.player > prev.scores.opponent;
                        const finalScore = `${prev.scores.player} - ${prev.scores.opponent}`;
                        const updatedSeries = { ...currentSeries };
                        const gameIndex = updatedSeries.games.indexOf(null);
    
                        if (didWin) { updatedSeries.team1Wins++; updatedSeries.games[gameIndex] = 'W'; }
                        else { updatedSeries.team2Wins++; updatedSeries.games[gameIndex] = 'L'; }
    
                        if (updatedSeries.team1Wins === 4 || updatedSeries.team2Wins === 4) updatedSeries.completed = true;
    
                        handlePostGameUpdate({ didWin, playerStats: prev.playerStats, finalScore }, updatedSeries, strategyResult);
                        return null;
                    }
                }
    
                possessionsCounter.current++;
    
                // --- Start of game tick logic (copied and adapted) ---
                if (!teamStrengths) return prev; // Should not happen if game is running
                
                const { stats, position, overall, seasonStats } = player;
                let ppg = seasonStats.gamesPlayed > 0 ? (seasonStats.points / seasonStats.gamesPlayed) : 15;
    
                const scoringPotential = (stats.shooting * 0.35) + (stats.finishing * 0.25) + (stats.midrange * 0.15) + (stats.threepoint * 0.25);
                const reboundingPotential = (stats.rebounding * 0.7) + (stats.strength * 0.2) + (stats.athleticism * 0.1);
                const playmakingPotential = (stats.playmaking * 0.6) + (stats.ball_handle * 0.4);
    
                const opponentStrength = teamStrengths[prev.opponentAtStart];
                let playerTeamStrength = getPlayerTeamStrength(player, teamStrengths);
                if (player.isClutch) playerTeamStrength += 5;
    
                if (effects.playerPerformanceBoost?.points) ppg *= (1 + effects.playerPerformanceBoost.points / 100);
                const ppgInfluence = (ppg - 20) / 40;
    
                let playerTeamOffensiveRating = 90 + (playerTeamStrength / 180) * 30 + (seasonStats.momentum * 0.5);
                let opponentOffensiveRating = (95 + (opponentStrength / 99) * 25);
    
                if (effects.teamOffenseBoost) playerTeamOffensiveRating += effects.teamOffenseBoost;
                if (effects.teamDefenseBoost) opponentOffensiveRating -= effects.teamDefenseBoost;
                if (effects.opponentOffenseNerf) opponentOffensiveRating -= effects.opponentOffenseNerf;
                if (effects.opponentDefenseNerf) playerTeamOffensiveRating += effects.opponentDefenseNerf;
    
                let newPlayerStats = { ...prev.playerStats };
                let newScores = { ...prev.scores };
    
                const possessionTeam = Math.random() < 0.5 ? 'player' : 'opponent';
    
                if (possessionTeam === 'player') {
                    if (Math.random() < playerTeamOffensiveRating / 210) {
                        const baseInvolvement = 0.35 + (playmakingPotential / 99) * 0.2 + ppgInfluence;
                        const playerInvolvementChance = Math.max(0.1, Math.min(0.9, baseInvolvement));
    
                        if (Math.random() < playerInvolvementChance) {
                            const skillModifier = (scoringPotential / 99) * 0.2 - (playmakingPotential / 99) * 0.15;
                            const baseShootsChance = 0.5 + skillModifier;
                            const shootsChance = Math.max(0.1, Math.min(0.9, baseShootsChance));
    
                            if (Math.random() < shootsChance) {
                                const points = Math.random() < (stats.threepoint / 99) * 0.4 ? 3 : 2;
                                newPlayerStats.points += points;
                                newScores.player += points;
                            } else {
                                newPlayerStats.assists += 1;
                                newScores.player += Math.random() < 0.3 ? 3 : 2;
                            }
                        } else {
                            newScores.player += Math.random() < 0.3 ? 3 : 2;
                        }
                    } else {
                        if (Math.random() < ((0.25 + (reboundingPotential / 99) * 0.5) / 2.5)) newPlayerStats.rebounds += 1;
                    }
                } else {
                    if (Math.random() < opponentOffensiveRating / 210) {
                        newScores.opponent += Math.random() < 0.33 ? 3 : 2;
                    } else {
                        if (Math.random() < (0.25 + (reboundingPotential / 99) * 0.5)) newPlayerStats.rebounds += 1;
                    }
                }
    
                const quarter = Math.min(4, Math.ceil((possessionsCounter.current / totalPossessions) * 4));
                // --- End of game tick logic ---
    
                // Schedule the next loop iteration
                gameLoopTimeoutRef.current = window.setTimeout(gameLoop, baseDelay / simulationSpeedRef.current);
    
                return { ...prev, quarter, scores: newScores, playerStats: newPlayerStats };
            });
        };
    
        gameLoop(); // Start the loop
    }, [player, currentSeries, handlePostGameUpdate, calculateStrategyOutcome, teamStrengths]);

    const simulateInstantGame = useCallback((choice: PlayoffChoice) => {
        if (!currentSeries || !currentSeries.opponent || !teamStrengths) return;
        setIsSimulating(true);
        
        let playerTeamStrength = getPlayerTeamStrength(player, teamStrengths) + player.seasonStats.momentum;
        if (player.isClutch) playerTeamStrength += 5; // Clutch boost
        let opponentTeamStrength = teamStrengths[currentSeries.opponent];

        const { successRate, isSuccess } = calculateStrategyOutcome(choice);
        const strategyResult = { choiceId: choice.id, successRate, outcome: isSuccess ? 'success' : 'failure' as 'success' | 'failure' };
        
        const effects = isSuccess ? choice.successEffects : choice.failureEffects;

        if (effects.teamOffenseBoost) playerTeamStrength += effects.teamOffenseBoost;
        if (effects.teamDefenseBoost) playerTeamStrength += effects.teamDefenseBoost;
        if (effects.opponentOffenseNerf) opponentTeamStrength -= effects.opponentOffenseNerf;
        if (effects.opponentDefenseNerf) opponentTeamStrength -= effects.opponentDefenseNerf;
        
        const chemistryModifier = (player.teamChemistry - 50) / 250; // -0.2 to +0.2 impact
        const winChanceRaw = 0.5 + (playerTeamStrength - opponentTeamStrength) * 0.02 + chemistryModifier;
        const didWin = Math.random() < Math.max(0.15, Math.min(0.85, winChanceRaw));

        const playerStats = generatePlayoffGameStats(player, effects.playerPerformanceBoost);
        const baseScore = 105 + player.currentPlayoffRound * 3;
        const scoreMargin = getRandomInRange(3, 15);
        const finalScore = didWin 
            ? `${baseScore + scoreMargin} - ${baseScore}`
            : `${baseScore} - ${baseScore + scoreMargin}`;

        const updatedSeries = { ...currentSeries };
        const gameIndex = updatedSeries.games.indexOf(null);
        if (gameIndex === -1) return;

        if (didWin) {
            updatedSeries.team1Wins++;
            updatedSeries.games[gameIndex] = 'W';
        } else {
            updatedSeries.team2Wins++;
            updatedSeries.games[gameIndex] = 'L';
        }

        if (updatedSeries.team1Wins === 4 || updatedSeries.team2Wins === 4) {
            updatedSeries.completed = true;
        }

        setTimeout(() => {
            handlePostGameUpdate({ didWin, playerStats, finalScore }, updatedSeries, strategyResult);
        }, 300);

    }, [player, currentSeries, handlePostGameUpdate, calculateStrategyOutcome, generatePlayoffGameStats, teamStrengths]);

    const handlePlayGame = () => {
        if (!currentSeries || currentSeries.completed || isSimulating || player.currentEvent) return;
        setLiveGameData(null);
        setChoices(getChoicesForGame(player.stats));
        setIsChoiceModalOpen(true);
    };

    const handleChoiceMade = (choice: PlayoffChoice) => {
        setIsChoiceModalOpen(false);
        if (liveScoreEnabled) {
            startLiveGame(choice);
        } else {
            simulateInstantGame(choice);
        }
    };

    const opponentFeederMatchup = useMemo(() => {
        if (!player.playoffBracket || (currentSeries && currentSeries.opponent)) {
            return null;
        }
    
        const playerTeam = player.team;
        const playerConference = TEAMS[playerTeam].conference as 'East' | 'West';
        const roundNames = ['First Round', 'Conference Semifinals', 'Conference Finals'] as const;

        if (player.currentPlayoffRound === 3) { // Waiting for NBA Finals opponent
            const otherConference = playerConference === 'East' ? 'West' : 'East';
            const matchup = player.playoffBracket[otherConference]['Conference Finals'][0];
            return matchup.winner ? null : matchup;
        } else if (player.currentPlayoffRound > 0) { // Waiting for conference opponent
            const prevRoundName = roundNames[player.currentPlayoffRound - 1];
            const playerPrevMatchup = player.playoffBracket[playerConference][prevRoundName]?.find(m => m.team1.code === playerTeam || m.team2.code === playerTeam);
            
            if (playerPrevMatchup && playerPrevMatchup.nextMatchupId) {
                const nextId = playerPrevMatchup.nextMatchupId;
                const otherMatchup = player.playoffBracket[playerConference][prevRoundName]?.find(m => m.nextMatchupId === nextId && m.id !== playerPrevMatchup.id);
                return (otherMatchup && !otherMatchup.winner) ? otherMatchup : null;
            }
        }

        return null;
    }, [player.playoffBracket, player.currentPlayoffRound, player.team, currentSeries]);

    if (!currentSeries) {
        return <div className="text-center">{t('playoffs.loadingOpponent') as string}</div>;
    }
    
    const seriesOver = currentSeries.team1Wins === 4 || currentSeries.team2Wins === 4;
    const opponentTeam = currentSeries.opponent ? TEAMS[currentSeries.opponent] : null;
    const playerTeam = TEAMS[player.team];
    const disableActions = isSimulating || !!player.currentEvent || isEventLoading;

    const renderLiveGame = () => {
        if (!liveGameData) return null;
        let quarterText;
        if (liveGameData.quarter === 5) {
            quarterText = t('preDraft.final') as string;
        } else if (overtimeCount > 0) {
            quarterText = overtimeCount > 1 ? `${overtimeCount}OT` : "OT";
        } else {
            quarterText = t('preDraft.quarter', { num: liveGameData.quarter }) as string;
        }
        
        const liveOpponent = TEAMS[liveGameData.opponentAtStart];

        return (
            <div className="bg-surface p-6 rounded-xl shadow-lg border border-white/10 animate-slide-in space-y-4">
                 <h2 className="text-xl font-bold text-center">{currentSeries.name} - {t('playoffs.playGame', { gameNum: currentSeries.games.indexOf(null) + 1 }) as string}</h2>
                 <div className="bg-background p-4 rounded-lg">
                    <div className="flex justify-between items-center text-center mb-4">
                        <div className="flex-1">
                            <img src={playerTeam.logo} alt={playerTeam.name} className="w-16 h-16 mx-auto mb-2" />
                            <p className="font-bold text-lg">{playerTeam.name}</p>
                            <p className="text-4xl font-black text-primary transition-all duration-300" key={`p_score_${liveGameData.scores.player}`}>{liveGameData.scores.player}</p>
                        </div>
                        <div className="w-24">
                            <p className="text-sm text-secondary"> {quarterText} </p>
                            <div className="mt-2 flex justify-center items-center bg-background/50 rounded-full border border-white/10 p-0.5 text-xs" title={t('playoffs.simulationSpeed') as string}>
                                {[1, 2, 4].map(speed => (
                                    <button
                                        key={speed}
                                        onClick={() => setSimulationSpeed(speed)}
                                        className={`px-2 py-0.5 rounded-full transition-colors ${simulationSpeed === speed ? 'bg-nba-blue text-white' : 'text-secondary'}`}
                                        aria-pressed={simulationSpeed === speed}
                                    >
                                        {speed}x
                                    </button>
                                ))}
                            </div>
                        </div>
                         <div className="flex-1">
                            <img src={liveOpponent.logo} alt={liveOpponent.name} className="w-16 h-16 mx-auto mb-2" />
                            <p className="font-bold text-lg">{liveOpponent.name}</p>
                            <p className="text-4xl font-black text-secondary transition-all duration-300" key={`o_score_${liveGameData.scores.opponent}`}>{liveGameData.scores.opponent}</p>
                        </div>
                    </div>
                     <div className="grid grid-cols-3 gap-2">
                        <StatCard label={t('points') as string} value={liveGameData.playerStats.points} />
                        <StatCard label={t('rebounds') as string} value={liveGameData.playerStats.rebounds} />
                        <StatCard label={t('assists') as string} value={liveGameData.playerStats.assists} />
                    </div>
                </div>
            </div>
        );
    }
    
    const renderSeriesView = () => {
       if (!opponentTeam) {
            return (
                <div className="bg-surface p-6 rounded-xl shadow-lg border border-white/10 text-center">
                    <h2 className="text-2xl font-bold">{t('playoffs.waitingForOpponent') as string}</h2>
                    <p className="text-secondary mt-2">{t('playoffs.seriesComplete') as string}</p>
                    {opponentFeederMatchup && opponentFeederMatchup.team1.code && opponentFeederMatchup.team2.code && (
                        <div className="mt-4 border-t border-white/10 pt-4 animate-fade-in">
                            <p className="text-sm font-semibold text-secondary mb-2">Simulating their series:</p>
                            <div className="flex justify-between items-center max-w-sm mx-auto text-center">
                                <div className="flex-1">
                                    <img src={TEAMS[opponentFeederMatchup.team1.code].logo} alt="" className="w-12 h-12 mx-auto"/>
                                    <p className="text-xs font-semibold mt-1">{TEAMS[opponentFeederMatchup.team1.code].name}</p>
                                </div>
                                <div className="text-3xl font-black px-4">{opponentFeederMatchup.team1Wins} - {opponentFeederMatchup.team2Wins}</div>
                                <div className="flex-1">
                                    <img src={TEAMS[opponentFeederMatchup.team2.code].logo} alt="" className="w-12 h-12 mx-auto"/>
                                    <p className="text-xs font-semibold mt-1">{TEAMS[opponentFeederMatchup.team2.code].name}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return (
            <div className="bg-surface/50 backdrop-blur-sm p-4 md:p-6 rounded-xl shadow-lg border border-white/10 relative">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <div className="flex-1 text-center">
                        <img src={playerTeam.logo} alt={playerTeam.name} className="w-20 h-20 mx-auto" />
                        <h3 className="font-bold mt-2">{playerTeam.name}</h3>
                    </div>
                    <div className="text-5xl font-black px-4 my-4 sm:my-0">{currentSeries.team1Wins} - {currentSeries.team2Wins}</div>
                    <div className="flex-1 text-center">
                        <img src={opponentTeam.logo} alt={opponentTeam.name} className="w-20 h-20 mx-auto" />
                        <h3 className="font-bold mt-2">{opponentTeam.name}</h3>
                    </div>
                </div>

                <div className="flex justify-center gap-1 sm:gap-2 mb-8">
                    {currentSeries.games.map((result, index) => (
                        <div key={index} className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                            result === 'W' ? 'bg-green-500 text-white' : 
                            result === 'L' ? 'bg-red-500 text-white' : 
                            'bg-background'
                        }`}>
                            {result || index + 1}
                        </div>
                    ))}
                </div>
                
                {!seriesOver && (
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mb-6">
                        <div className="flex items-center gap-2">
                            <label htmlFor="live-score-toggle" className="text-sm font-semibold text-secondary">{t('playoffs.liveScoreToggle') as string}</label>
                            <button
                                id="live-score-toggle"
                                aria-pressed={liveScoreEnabled}
                                onClick={() => setLiveScoreEnabled(!liveScoreEnabled)}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-nba-blue ${
                                    liveScoreEnabled ? 'bg-nba-blue' : 'bg-nba-gray'
                                }`}
                            >
                                <span
                                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
                                        liveScoreEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                         <div className="flex items-center gap-2">
                            <label htmlFor="events-toggle" className="text-sm font-semibold text-secondary">{t('playoffs.eventsToggle') as string}</label>
                            <button
                                id="events-toggle"
                                aria-pressed={playoffEventsEnabled}
                                onClick={() => setPlayoffEventsEnabled(!playoffEventsEnabled)}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-nba-blue ${
                                    playoffEventsEnabled ? 'bg-nba-blue' : 'bg-nba-gray'
                                }`}
                            >
                                <span
                                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
                                        playoffEventsEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                )}


                <div className="mt-6 text-center">
                    {seriesOver ? (
                         <div>
                            <p className={`text-xl font-bold mb-4 ${currentSeries.team1Wins === 4 ? 'text-green-400' : 'text-red-400'}`}>
                                {currentSeries.team1Wins === 4 ? (isChampion ? t('playoffs.wonChampionship') as string : t('playoffs.seriesWon') as string) : t('playoffs.eliminated') as string}
                            </p>
                            <button 
                                disabled={disableActions} 
                                onClick={isChampion || currentSeries.team2Wins === 4 ? onPlayoffsOver : handleAdvanceRound} 
                                className="bg-nba-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-800 disabled:bg-gray-600 transition-transform transform hover:scale-105 active:scale-100"
                            >
                                {isChampion || currentSeries.team2Wins === 4 ? t('playoffs.enterOffSeason') as string : t('playoffs.nextRound') as string}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-secondary mb-3">{t('playoffs.challenge', { teamName: opponentTeam.name}) as string}</p>
                            <button 
                                onClick={handlePlayGame} 
                                disabled={disableActions} 
                                className={`bg-nba-red text-white font-bold py-3 px-8 rounded-lg hover:bg-red-700 disabled:bg-gray-600 transition-transform ${isSimulating ? 'animate-pulse' : 'transform hover:scale-105 active:scale-100'}`}
                            >
                            {isSimulating ? t('playoffs.simulating') as string : t('playoffs.playGame', { gameNum: currentSeries.games.indexOf(null) + 1 }) as string}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-full mx-auto animate-fade-in text-center">
             {player.currentEvent && <EventModal event={player.currentEvent} onDecision={onEventDecision} />}
             {lastGameResult && (
                <PlayoffGameResultModal 
                    result={lastGameResult}
                    onClose={() => setLastGameResult(null)}
                />
            )}
            <PlayoffChoiceModal 
                isOpen={isChoiceModalOpen}
                choices={choices}
                onChoice={handleChoiceMade}
                opponentArchetype={currentSeries.opponentArchetype}
                opponentStarOverall={currentSeries.opponentStarOverall}
                playerStats={player.stats}
            />
            <h1 className="text-4xl font-extrabold mb-2">{t('playoffs.title') as string}</h1>
            <div className="flex justify-center items-center gap-4 mb-4 md:mb-8">
                 <p className="text-secondary">{t('season') as string} {player.currentSeason} - {currentSeries.name}</p>
                 {/* FIX: Cast results of `t` function to string to resolve TypeScript type error. */}
                 <button onClick={() => setShowBracket(!showBracket)} className="text-xs bg-nba-gray/20 hover:bg-nba-gray/40 font-semibold py-1 px-3 rounded-lg transition-colors">
                    {showBracket ? t('playoffs.hideBracket') as string : t('playoffs.showBracket') as string}
                </button>
            </div>
            
            {player.playoffBracket && showBracket && (
                <div className="mb-8">
                    <PlayoffBracketDisplay bracket={player.playoffBracket} playerTeam={player.team}/>
                </div>
            )}
            
            <div className="max-w-3xl mx-auto">
                {liveGameData ? renderLiveGame() : renderSeriesView()}
            </div>
        </div>
    );
};

export default Playoffs;