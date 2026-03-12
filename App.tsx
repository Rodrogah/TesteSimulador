import React, { useState, useCallback, useEffect, useRef } from 'react';
// FIX: Aliased LeagueStandings type to LeagueStandingsType to resolve naming conflict with the component.
// FIX: Import 'PlayoffMatchup' to resolve 'Cannot find name' error.
import { Screen, Player, Position, PlayerStats, Game, PlayoffSeries, Notification, RosterPlayer, Translations, CareerSeason, CoachReport, EventChoice, EventHistoryItem, LeagueStandings as LeagueStandingsType, NewsHeadline, PlayoffBracket, PlayoffConferenceBracket, PlayoffMatchup, Tweet, Contact, DatingProfile, User } from './types';
import { TEAMS, ALL_TROPHIES, ATTRIBUTES, DATING_PROFILES, generateAvatar } from './constants';

import * as authService from './services/authService';
import * as careerService from './services/careerService';

import LoginScreen from './components/LoginScreen';
import UserDashboard from './components/UserDashboard';
import CreatePlayer from './components/CreatePlayer';
import DraftScreen from './components/DraftScreen';
import Dashboard from './components/Dashboard';
import Playoffs from './components/Playoffs';
import RetirementScreen from './components/RetirementScreen';
import TrophyGallery from './components/TrophyGallery';
import FreeAgencyScreen from './components/FreeAgencyScreen';
import NotificationPopup from './components/Notification';
import RetirementChoiceModal from './components/RetirementChoiceModal';
import EndSeasonReport from './components/EndSeasonReport';
import OffSeasonTraining from './components/OffSeasonTraining';
import PreDraftScreen from './components/PreDraftScreen';
import EventModal from './components/EventModal';
import EventLoadingIndicator from './components/EventLoadingIndicator';
import AwardsCeremony from './components/AwardsCeremony';
import LeagueStandings from './components/LeagueStandings';
import EventOutcomeModal from './components/EventOutcomeModal';
import SettingsModal from './components/ApiKeyModal';
import { generateGameSummary, generateCoachFeedback, generateGameEvent, generateNewsHeadlines, generateSocialMediaFeed, generateInitialSocialMediaFeed } from './services/geminiService';
import { generateSeasonSchedule } from './services/scheduleService';
import { useTranslations } from './hooks/useTranslations';
import socket, { sendPlayerUpdate } from './services/socketService';

const getPlayerTeamStrength = (player: Player, strengths: { [key: string]: number } | null): number => {
    if (!strengths || !strengths[player.team]) return player.overall;
    const baseTeamStrength = strengths[player.team];
    return Math.round(player.overall * 0.15 + baseTeamStrength * 0.85);
};

const calculateSeasonTeamStrengths = (prevStandings: LeagueStandingsType | null): { [key: string]: number } => {
    const strengths: { [key: string]: number } = {};
    const teamCodes = Object.keys(TEAMS);

    for (const code of teamCodes) {
        const team = TEAMS[code];
        const corePlayers = team.roster;
        const coreAvg = corePlayers.reduce((acc, p) => acc + p.overall, 0) / corePlayers.length;
        const fifthStarterOvr = Math.max(75, coreAvg - 4);
        const totalOvr = corePlayers.reduce((acc, p) => acc + p.overall, 0) + fifthStarterOvr;
        const baseStrength = totalOvr / (corePlayers.length + 1);

        let historicalModifier = 0;
        if (prevStandings && prevStandings[code]) {
            const { wins } = prevStandings[code];
            const winPct = wins / 82;
            // Modifier from -5 to +5 based on win percentage
            historicalModifier = (winPct - 0.5) * 10;
        } else {
            // Season 1: small random power ranking boost/nerf
            historicalModifier = (Math.random() - 0.5) * 6; // -3 to +3
        }

        // Off-season randomness
        const randomFluctuation = (Math.random() - 0.5) * 4; // -2 to +2

        strengths[code] = Math.round(baseStrength + historicalModifier + randomFluctuation);
    }
    return strengths;
};

const calculateTeamChemistry = (
    player: Player,
    leagueStandings: LeagueStandingsType | null
): number => {
    // 1. Relationship Score
    const coach = TEAMS[player.team].coach;
    const coachRelationship = player.relationships[coach.name] || 0;
    
    let teammateRelationshipSum = 0;
    let teammateCount = 0;
    
    player.teammates.forEach(tm => {
        teammateRelationshipSum += player.relationships[tm.name] || 0;
        teammateCount++;
    });

    const avgTeammateRelationship = teammateCount > 0 ? teammateRelationshipSum / teammateCount : 0;
    
    // Normalize relationship scores around a base of 50. Range is roughly 0-100.
    const normalize = (score: number) => 50 + score * 5;

    const normalizedCoachScore = normalize(coachRelationship);
    const normalizedTeammateScore = normalize(avgTeammateRelationship);

    // Weighted average: 40% coach, 60% teammates
    const relationshipScore = Math.round(normalizedCoachScore * 0.4 + normalizedTeammateScore * 0.6);

    // 2. Momentum Modifier
    // Momentum is -5 to 5. This translates to a -10 to +10 chemistry impact.
    const momentumModifier = player.seasonStats.momentum * 2;

    // 3. Performance Modifier
    let performanceModifier = 0;
    if (leagueStandings && leagueStandings[player.team]) {
        const teamRecord = leagueStandings[player.team];
        const gamesPlayed = teamRecord.wins + teamRecord.losses;
        if (gamesPlayed > 0) {
            const winPct = teamRecord.wins / gamesPlayed;
            // A 0.500 record gives 0. A 1.000 record gives +15. A 0.000 record gives -15.
            performanceModifier = (winPct - 0.5) * 30;
        }
    }

    // 4. Random Fluctuation (to make it "move" even when stats are stable)
    const randomFluctuation = (Math.random() - 0.5) * 4;
    
    const finalChemistry = Math.round(relationshipScore + momentumModifier + performanceModifier + randomFluctuation);
    
    // Clamp the final value between 0 and 100
    return Math.max(0, Math.min(100, finalChemistry));
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [screen, setScreen] = useState<Screen>(Screen.LOGIN);
    const [notificationQueue, setNotificationQueue] = useState<Notification[]>([]);
    const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
    const [eventOutcome, setEventOutcome] = useState<{ title: string; description: string } | null>(null);
    const [showRetirementPrompt, setShowRetirementPrompt] = useState(false);
    const [isEventLoading, setIsEventLoading] = useState(false);
    const [isNewsLoading, setIsNewsLoading] = useState(false);
    const [eventsEnabled, setEventsEnabled] = useState(true);
    const [lastSeasonAwards, setLastSeasonAwards] = useState<string[] | null>(null);
    const [showAwardsModal, setShowAwardsModal] = useState(false);
    const [fullSchedule, setFullSchedule] = useState<{ [teamCode: string]: string[] } | null>(null);
    const [teamStrengths, setTeamStrengths] = useState<{ [key: string]: number } | null>(null);
    const [previousSeasonStandings, setPreviousSeasonStandings] = useState<LeagueStandingsType | null>(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [allPlayers, setAllPlayers] = useState<{ [key: string]: Player }>({});
        const [socketId, setSocketId] = useState<string | null>(null);
    const [leagueStandings, setLeagueStandings] = useState<LeagueStandingsType | null>(null);
    const { t, language } = useTranslations();
    const player = socketId ? allPlayers[socketId] : null;
    const prevChemistryRef = useRef<number | undefined>();
    const playerRef = useRef(player);
    playerRef.current = player;

    useEffect(() => {
        if (player) {
            sendPlayerUpdate(player);
        }
    }, [player]);

    useEffect(() => {
        socket.onopen = () => {
            console.log('Connected to WebSocket server');
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'game_state_update') {
                setAllPlayers(data.payload.players);
                setLeagueStandings(data.payload.leagueStandings);
            } else if (data.type === 'socket_id') {
                setSocketId(data.payload);
            }
        };
    }, []);
    
    useEffect(() => {
        const checkAuth = async () => {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                const existingPlayer = await careerService.loadCareer(currentUser.id);
                if (existingPlayer) {
                    updatePlayer(existingPlayer);
                    setScreen(Screen.DASHBOARD);
                } else {
                    setScreen(Screen.CREATE_PLAYER);
                }
            } else {
                setScreen(Screen.LOGIN);
            }
            setIsAuthLoading(false);
        };
        checkAuth();
    }, []);
    
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (user) {
                (Object.values(allPlayers) as Player[]).forEach(p => careerService.saveCareer(p));
            }
        }, 1000); // Debounce for 1 second

        return () => clearTimeout(timeoutId);
    }, [allPlayers, user]);

    const addNotification = useCallback((title: string, description: string, type: Notification['type']) => {
        const isAlreadyPresent = 
            activeNotifications.some(n => n.title === title) || 
            notificationQueue.some(n => n.title === title);

        if (isAlreadyPresent) {
            return;
        }

        const id = Date.now() + Math.random();
        setNotificationQueue(prev => [...prev, { id, title, description, type }]);
    }, [activeNotifications, notificationQueue]);

    const handleDismissNotification = useCallback((id: number) => {
        setActiveNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    useEffect(() => {
        if (notificationQueue.length > 0 && activeNotifications.length < 3) {
            const spaceAvailable = 3 - activeNotifications.length;
            const itemsToMove = notificationQueue.slice(0, spaceAvailable);
            const remainingInQueue = notificationQueue.slice(spaceAvailable);

            setActiveNotifications(prev => [...prev, ...itemsToMove]);
            setNotificationQueue(remainingInQueue);
        }
    }, [notificationQueue, activeNotifications]);

    useEffect(() => {
        if (player && prevChemistryRef.current !== undefined && player.teamChemistry !== prevChemistryRef.current) {
            const oldChemistry = prevChemistryRef.current;
            const newChemistry = player.teamChemistry;
            const chemistryChange = newChemistry - oldChemistry;

            if (Math.abs(chemistryChange) >= 10) { // Notify on significant changes
                const trend = chemistryChange > 0 ? 'improving' : 'worsening';
                addNotification(
                    t(`notifications.chemistry.${trend}.title`) as string,
                    t(`notifications.chemistry.${trend}.description`, { value: newChemistry }) as string,
                    'event'
                );
            }
        }
        prevChemistryRef.current = player?.teamChemistry;
    }, [player?.teamChemistry, addNotification, t, player]);

    // Effect for gradual tweet reactions
    useEffect(() => {
        if (player && player.phone.tweetReactionQueue.length > 0) {
            const timer = setTimeout(() => {
                if (!playerRef.current) return;
                const queueCopy = [...playerRef.current.phone.tweetReactionQueue];
                const nextTweet = queueCopy.shift();
                if (nextTweet) {
                    const newFeed = [nextTweet, ...playerRef.current.phone.socialFeed].slice(0, 50);
                    updatePlayer({
                        ...playerRef.current,
                        phone: {
                            ...playerRef.current.phone,
                            socialFeed: newFeed,
                            tweetReactionQueue: queueCopy,
                        }
                    });
                }
            }, Math.random() * 500 + 200); // 0.2-0.7 seconds delay

            return () => clearTimeout(timer);
        }
    }, [player?.phone.tweetReactionQueue]);


    const initialTrophyCounts = Object.keys(t('trophies', undefined) as Translations).reduce((acc, trophyId) => {
        acc[trophyId] = 0;
        return acc;
    }, {} as { [key: string]: number });


    const updatePlayer = (newPlayer: Player | null | ((prev: Player | null) => Player | null)) => {
        if (!socketId) return;
        
        setAllPlayers(prevAll => {
            const current = prevAll[socketId] || null;
            let updated: Player | null;
            if (typeof newPlayer === 'function') {
                updated = (newPlayer as (prev: Player | null) => Player | null)(current);
            } else {
                updated = newPlayer;
            }
            
            if (updated) {
                return { ...prevAll, [socketId]: updated };
            } else {
                const next = { ...prevAll };
                delete next[socketId];
                return next;
            }
        });
    };

    const generateGameStats = (currentPlayer: Player, currentMomentum: number, isClutchSituation: boolean) => {
        const basePoints = currentPlayer.stats.shooting * 0.3 + currentPlayer.stats.finishing * 0.2;
        const baseRebounds = currentPlayer.stats.rebounding * 0.4;
        const baseAssists = currentPlayer.stats.playmaking * 0.4;
        
        const modifier = 1 + (currentMomentum * 0.05) + (isClutchSituation ? 0.2 : 0);
        
        return {
            points: Math.round(basePoints * modifier + Math.random() * 10),
            rebounds: Math.round(baseRebounds * modifier + Math.random() * 5),
            assists: Math.round(baseAssists * modifier + Math.random() * 5),
        };
    };

    const handleNewCareer = () => {
        handleCreateNew();
    };

    const handleProceedToPostSeason = () => {
        setScreen(Screen.PLAYOFFS);
    };

    const handlePlayerCreate = (name: string, position: Position, stats: PlayerStats, bio: string, isClutch: boolean) => {
        const careerId = Date.now().toString(36) + Math.random().toString(36).substring(2);

        const agentContact: Contact = {
            id: 'agent_1',
            name: 'Leo Maxwell',
            type: 'Agent',
            avatar: generateAvatar('Leo Maxwell'),
            personality: "A slick, fast-talking agent who is always looking for the next big deal. Cares about his clients but cares about his commission more. Uses a lot of business jargon.",
            conversation: []
        };
        
        const playerName = name || t('rookieSensation') as string;
        
        const newPlayer: Player = {
            careerId,
            lastUpdated: Date.now(),
            name: playerName,
            position,
            stats,
            bio,
            isClutch,
            team: '',
            draftPick: 0,
            draftStock: 0,
            overall: 70,
            currentSeason: 1,
            seasonStats: {
                gamesPlayed: 0, points: 0, assists: 0, rebounds: 0, games: [],
                playoffGames: 0, playoffWins: 0, playoffLosses: 0, momentum: 0,
                eventsThisSeason: 0,
            },
            careerStats: { seasons: [], totalPoints: 0, totalGames: 0, championships: 0 },
            achievements: [],
            trophyCounts: { ...initialTrophyCounts },
            teammates: [],
            playoffSeries: [],
            currentPlayoffRound: 0,
            coachingHistory: {},
            relationships: {},
            teamChemistry: 70, // Starting chemistry
            currentEvent: null,
            eventHistory: [],
            news: [],
            lastNewsUpdateGame: 0,
            schedule: [],
            playoffBracket: null,
            phone: {
                socialFeed: [],
                contacts: [agentContact],
                datingProfiles: [...DATING_PROFILES],
                datingMatches: [],
                currentPartner: null,
                socialProfile: {
                    bio: `Rookie ${position} for the...`,
                    avatarUrl: generateAvatar(playerName),
                },
                socialNotifications: [],
                tweetReactionQueue: [],
                likedTweetIds: [],
                retweetedTweetIds: [],
                lastSocialUpdateGamesPlayed: 0,
            },
        };
        updatePlayer(newPlayer);
        setScreen(Screen.PRE_DRAFT);
    };

    const handlePreDraftComplete = (draftStock: number) => {
        if (!player) return;
        updatePlayer({ ...player, draftStock });
        setScreen(Screen.DRAFT);
    };

    const handleDraftComplete = (team: string, teammates: RosterPlayer[], draftPick: number) => {
        if (!player) return;

        const newAchievements = [...player.achievements];
        if (!newAchievements.includes('drafted')) {
            newAchievements.push('drafted');
            addNotification(t('achievements.drafted.name') as string, t('achievements.drafted.description') as string, 'achievement');
        }
        if (draftPick <= 14 && !newAchievements.includes('lottery-pick')) {
            newAchievements.push('lottery-pick');
            addNotification(t('achievements.lottery-pick.name') as string, t('achievements.lottery-pick.description') as string, 'achievement');
        }

        const schedule = generateSeasonSchedule();
        setFullSchedule(schedule);

        const initialStandings: LeagueStandingsType = {};
        Object.keys(TEAMS).forEach(code => {
            initialStandings[code] = { wins: 0, losses: 0 };
        });

        const strengths = calculateSeasonTeamStrengths(null);
        setTeamStrengths(strengths);

        const coach = TEAMS[team].coach;
        const coachContact: Contact = {
            id: `coach_${team}`,
            name: coach.name,
            type: 'Coach',
            avatar: coach.avatar,
            personality: coach.personality,
            conversation: [
                { id: `msg-welcome`, sender: coach.name, text: `Welcome to the team, kid. We've got a lot of work to do.`, timestamp: Date.now() }
            ]
        };

        const draftedPlayer: Player = {
            ...player,
            team,
            teammates,
            achievements: newAchievements,
            draftPick,
            schedule: schedule[team],
            relationships: {},
            teamChemistry: 70,
            phone: {
                ...player.phone,
                contacts: [...player.phone.contacts, coachContact],
                socialProfile: {
                    ...player.phone.socialProfile,
                    bio: `Rookie ${player.position} for the ${TEAMS[team].name}`
                }
            }
        };

        // Immediately set the player and navigate to the dashboard
        updatePlayer(draftedPlayer);
        setScreen(Screen.DASHBOARD);
        
        // Generate initial social media buzz in the background
        generateInitialSocialMediaFeed(draftedPlayer, language).then(initialTweets => {
            if (initialTweets) {
                updatePlayer(p => {
                    if (!p) return null; // Safety check
                    // Update the player's phone state with the new feed
                    return {
                        ...p,
                        phone: {
                            ...p.phone,
                            socialFeed: initialTweets
                        }
                    };
                });
            }
        });
    };
    
    const handleGamePlayed = useCallback((game: Omit<Game, 'id' | 'summary'>): number => {
        if (!player || !fullSchedule || !leagueStandings || !teamStrengths) return 0;
    
        const gameId = Date.now();
        const gameWithId = { ...game, id: gameId };
    
        // Create a mutable copy for this scope to calculate next state.
        let playerCopy = JSON.parse(JSON.stringify(player)) as Player;
        const standingsCopy = JSON.parse(JSON.stringify(leagueStandings));
    
        // --- 1. Update Player State ---
        const momentumChange = game.result === 'W' ? 1 : -1;
        playerCopy.seasonStats.momentum = Math.max(-5, Math.min(5, playerCopy.seasonStats.momentum + momentumChange));
        
        // Update relationships based on game result
        const relationshipChange = game.result === 'W' ? 0.2 : -0.1;
        const coachName = TEAMS[playerCopy.team].coach.name;
        playerCopy.relationships[coachName] = (playerCopy.relationships[coachName] || 0) + relationshipChange;
        playerCopy.teammates.forEach(tm => {
            playerCopy.relationships[tm.name] = (playerCopy.relationships[tm.name] || 0) + relationshipChange;
        });

        playerCopy.seasonStats.gamesPlayed++;
        playerCopy.seasonStats.points += game.points;
        playerCopy.seasonStats.assists += game.assists;
        playerCopy.seasonStats.rebounds += game.rebounds;
        playerCopy.seasonStats.games.unshift(gameWithId); // Add to start of array
    
        const prevAchievements = new Set(playerCopy.achievements);
        const checkAndAddAchievement = (id: string) => {
            if (!prevAchievements.has(id)) {
                playerCopy.achievements.push(id);
                addNotification(t(`achievements.${id}.name`) as string, t(`achievements.${id}.description`) as string, 'achievement');
            }
        };

        if (playerCopy.seasonStats.gamesPlayed === 1) checkAndAddAchievement("first-game");
        if (game.points > 0 && !prevAchievements.has("first-points")) checkAndAddAchievement("first-points");
        // FIX: Correctly access `assists` and `rebounds` from the `game` object.
        if ((game.points >= 10 && game.assists >= 10) || (game.points >= 10 && game.rebounds >= 10) || (game.assists >= 10 && game.rebounds >= 10)) checkAndAddAchievement("double-double");
        if (game.points >= 10 && game.assists >= 10 && game.rebounds >= 10) checkAndAddAchievement("triple-double");
        if (game.points >= 30) checkAndAddAchievement("30-points");
        if (game.points >= 50) checkAndAddAchievement("50-point-game");
    
        // --- 2. Update Standings State ---
        const gameIndex = playerCopy.seasonStats.gamesPlayed - 1;
        const opponentCode = playerCopy.schedule[gameIndex];
        
        if (game.result === 'W' && standingsCopy[playerCopy.team] && standingsCopy[opponentCode]) {
            standingsCopy[playerCopy.team].wins++;
            standingsCopy[opponentCode].losses++;
        } else if(standingsCopy[playerCopy.team] && standingsCopy[opponentCode]) {
            standingsCopy[playerCopy.team].losses++;
            standingsCopy[opponentCode].wins++;
        }
        
        // --- NEW SIMULATION LOGIC for other teams ---
        const teamsToPair = new Set(Object.keys(TEAMS).filter(code => code !== playerCopy.team && code !== opponentCode));
        const matchups: [string, string][] = [];

        // First pass: find ideal pairs from schedule
        for (const teamCode of Array.from(teamsToPair)) {
            if (!teamsToPair.has(teamCode)) continue; // Already paired
            
            const scheduledOpponent = fullSchedule![teamCode][gameIndex];
            
            if (teamsToPair.has(scheduledOpponent)) {
                matchups.push([teamCode, scheduledOpponent]);
                teamsToPair.delete(teamCode);
                teamsToPair.delete(scheduledOpponent);
            }
        }

        // Second pass: pair up remaining "orphans"
        const orphans = Array.from(teamsToPair);
        while (orphans.length > 0) {
            const team1 = orphans.shift()!;
            const team2 = orphans.shift()!;
            if (team1 && team2) {
                matchups.push([team1, team2]);
            }
        }

        // Simulate all the generated matchups
        for (const [team1Code, team2Code] of matchups) {
            const team1Strength = teamStrengths[team1Code];
            const team2Strength = teamStrengths[team2Code];
            const winChance = 0.5 + (team1Strength - team2Strength) * 0.025 + (Math.random() - 0.5) * 0.1;

            if (Math.random() < Math.max(0.05, Math.min(0.95, winChance))) {
                if (standingsCopy[team1Code]) standingsCopy[team1Code].wins++;
                if (standingsCopy[team2Code]) standingsCopy[team2Code].losses++;
            } else {
                if (standingsCopy[team1Code]) standingsCopy[team1Code].losses++;
                if (standingsCopy[team2Code]) standingsCopy[team2Code].wins++;
            }
        }

        // NEW: Update team chemistry after game
        playerCopy.teamChemistry = calculateTeamChemistry(playerCopy, standingsCopy);
    
        // --- 3. Commit State Changes ---
        updatePlayer(playerCopy);
    
        // --- 4. Handle Side Effects (Summaries & Events) ---
        generateGameSummary(gameWithId, playerCopy, language).then(summary => {
            const updatedPlayer = { ...playerCopy, seasonStats: { ...playerCopy.seasonStats, games: playerCopy.seasonStats.games.map(g => g.id === gameId ? { ...g, summary } : g) } };
            updatePlayer(updatedPlayer);
        });

        if (playerCopy.currentEvent) return gameId; // Don't trigger new event if one is active
        const eventMilestones = [20, 41, 62, 80];
        const currentMilestoneIndex = playerCopy.seasonStats.eventsThisSeason;
        
        if (eventsEnabled && currentMilestoneIndex < eventMilestones.length && playerCopy.seasonStats.gamesPlayed >= eventMilestones[currentMilestoneIndex]) {
            const context = `Just played game ${playerCopy.seasonStats.gamesPlayed} of the season against ${game.opponent}. The result was a ${game.result === 'W' ? 'win' : 'loss'}. The player had ${game.points} points.`;
            setIsEventLoading(true);
            generateGameEvent(playerCopy, context, language).then(event => {
                if (event) {
                    const updatedPlayer = { ...playerCopy, currentEvent: event, seasonStats: { ...playerCopy.seasonStats, eventsThisSeason: (playerCopy.seasonStats.eventsThisSeason || 0) + 1 } };
                    updatePlayer(updatedPlayer);
                }
            }).finally(() => {
                setIsEventLoading(false);
            });
        }
    
        return gameId;
    }, [player, addNotification, t, language, eventsEnabled, fullSchedule, leagueStandings, teamStrengths]);
    
    const handleEventDecision = useCallback((choice: EventChoice) => {
        if (!player || !leagueStandings) return;

        const { momentum, overall, stats, relationships, isClutch } = choice.outcome.effects;

        updatePlayer(p => {
            if (!p || !p.currentEvent) return null;

            const newStats = { ...p.stats };
            if(stats) {
                for (const statKey in stats) {
                    newStats[statKey as keyof PlayerStats] = Math.min(99, newStats[statKey as keyof PlayerStats] + (stats[statKey as keyof PlayerStats] || 0));
                }
            }

            const newRelationships = { ...p.relationships };
            if (relationships) {
                relationships.forEach(rel => {
                    newRelationships[rel.person] = (newRelationships[rel.person] || 0) + rel.change;
                });
            }

            const newHistoryEntry: EventHistoryItem = {
                title: p.currentEvent.title,
                choice: choice.text,
                outcome: choice.outcome.description
            };

            const playerForChemCalc = { ...p, relationships: newRelationships };
            const newChemistry = calculateTeamChemistry(playerForChemCalc, leagueStandings);
            
            const newIsClutch = typeof isClutch === 'boolean' ? isClutch : p.isClutch;
            if (typeof isClutch === 'boolean' && isClutch === true && !p.isClutch) {
                // FIX: Cast nested `t` call result to string to satisfy replacement type requirements.
                addNotification(t('notifications.traitGained.title') as string, t('notifications.traitGained.description', { traitName: t('clutchTrait') as string }) as string, 'event');
            }

            const updatedPlayer = {
                ...p,
                stats: newStats,
                overall: Math.min(99, p.overall + (overall || 0)),
                seasonStats: {
                    ...p.seasonStats,
                    momentum: Math.max(-5, Math.min(5, p.seasonStats.momentum + (momentum || 0))),
                },
                relationships: newRelationships,
                teamChemistry: newChemistry,
                isClutch: newIsClutch,
                currentEvent: null, // Clear the event
                eventHistory: [...p.eventHistory, newHistoryEntry],
            };

            updatePlayer(updatedPlayer);
            return updatedPlayer;
        });

        setEventOutcome({
            title: t('eventModal.decisionMade') as string,
            description: choice.outcome.description
        });

    }, [player, t, addNotification, leagueStandings]);

    const handleSimulateGames = useCallback((numGames: number) => {
        if (!player || !socketId) return;
        socket.send(JSON.stringify({ type: 'simulate_games', payload: { numGames, playerId: socketId } }));
    }, [player, socketId]);

    const handleStartOffSeason = useCallback(() => {
        if (!player) return;

        const finalSeasonIndex = player.careerStats.seasons.findIndex(s => s.season === player.currentSeason);
        if (finalSeasonIndex !== -1) {
            const seasons = [...player.careerStats.seasons];
            const lastSeasonRecord = seasons[finalSeasonIndex]; // This is the regular season snapshot
            const isChampion = (player.playoffSeries[3]?.team1Wins === 4);

            const previousFmvps = seasons.slice(0, finalSeasonIndex).filter(s => s.fmvp).length;
            const isFmvp = isChampion && (player.trophyCounts.fmvp > previousFmvps);

            // Calculate playoff-only stats by finding the difference from the regular season record
            const playoffPoints = player.seasonStats.points - lastSeasonRecord.points;
            const playoffRebounds = player.seasonStats.rebounds - lastSeasonRecord.rebounds;
            const playoffAssists = player.seasonStats.assists - lastSeasonRecord.assists;
            const playoffGames = player.seasonStats.playoffGames;

            // Update the historical season record to include playoff stats
            seasons[finalSeasonIndex] = {
                ...lastSeasonRecord,
                gamesPlayed: lastSeasonRecord.gamesPlayed + playoffGames,
                points: lastSeasonRecord.points + playoffPoints,
                assists: lastSeasonRecord.assists + playoffAssists,
                rebounds: lastSeasonRecord.rebounds + playoffRebounds,
                championship: isChampion,
                fmvp: isFmvp,
            };

            const updatedPlayer = {
                ...player,
                careerStats: {
                    ...player.careerStats,
                    seasons,
                    championships: player.careerStats.championships + (isChampion ? 1 : 0),
                    // Add the playoff-only stats to the career totals
                    totalPoints: player.careerStats.totalPoints + playoffPoints,
                    totalGames: player.careerStats.totalGames + playoffGames,
                },
                endOfSeasonReport: undefined,
            };

            updatePlayer(updatedPlayer);

            const coach = TEAMS[updatedPlayer.team].coach;
            const previousReport = updatedPlayer.coachingHistory[updatedPlayer.team];
            const finalSeasonForReport = seasons[finalSeasonIndex]; // Use the fully updated season record
            
            // Navigate immediately to show loading state
            setScreen(Screen.END_SEASON_REPORT);

            generateCoachFeedback(updatedPlayer, finalSeasonForReport, language, coach, previousReport).then(feedback => {
            updatePlayer(p => p ? { ...p, endOfSeasonReport: feedback, coachingHistory: {...p.coachingHistory, [p.team]: feedback } } : null);
            });
        } else {
             setScreen(Screen.END_SEASON_REPORT);
        }

    }, [player, language]);



    const handleEndRegularSeason = useCallback(() => {
        if (!player || !socketId) return;
        socket.send(JSON.stringify({ type: 'end_regular_season', payload: { playerId: socketId } }));
    }, [player, socketId]);

    const handleRetirementDecision = (retire: boolean) => {
        setShowRetirementPrompt(false);
        if (retire) {
            setScreen(Screen.RETIREMENT);
        } else {
            setScreen(Screen.FREE_AGENCY);
        }
    };

    const handleOffSeasonTrainingComplete = (improvements: Partial<PlayerStats>) => {
        if (!player) return;
        
        const newStats = { ...player.stats };
        let overallGain = 0;
        for (const stat in improvements) {
            const key = stat as keyof PlayerStats;
            const improvement = improvements[key] || 0;
            if (newStats[key] < 99) {
                newStats[key] = Math.min(99, newStats[key] + improvement);
                overallGain += improvement * 0.1;
            }
        }

        updatePlayer({
            ...player,
            stats: newStats,
            overall: Math.min(99, Math.round(player.overall + overallGain)),
        });

        if (player.currentSeason >= 10 && Math.random() < 0.3) {
            setShowRetirementPrompt(true);
        } else {
            setScreen(Screen.FREE_AGENCY);
        }
    };
    
    const handleTeamSelect = (teamCode: string) => {
        if (!player) return;

        const isSameTeam = teamCode === player.team;
        const oldChemistry = player.teamChemistry;

        // Carry over 50% of chemistry if re-signing, regress towards 65. Reset to 70 for a new team.
        const startingChemistry = isSameTeam
            ? Math.round(oldChemistry * 0.5 + 65 * 0.5)
            : 70;

        const newTeammates = TEAMS[teamCode].roster.filter(p => p.position !== player.position).slice(0, 4);

        const schedule = generateSeasonSchedule();
        setFullSchedule(schedule);

        const initialStandings: LeagueStandingsType = {};
        Object.keys(TEAMS).forEach(code => {
            initialStandings[code] = { wins: 0, losses: 0 };
        });
        setLeagueStandings(initialStandings);

        const strengths = calculateSeasonTeamStrengths(previousSeasonStandings);
        setTeamStrengths(strengths);

        updatePlayer(p => p ? ({
            ...p,
            team: teamCode,
            teammates: newTeammates,
            currentSeason: p.currentSeason + 1,
            seasonStats: {
                gamesPlayed: 0, points: 0, assists: 0, rebounds: 0, games: [],
                playoffGames: 0, playoffWins: 0, playoffLosses: 0, momentum: 0,
                eventsThisSeason: 0
            },
            playoffSeries: [],
            currentPlayoffRound: 0,
            schedule: schedule[teamCode],
            playoffBracket: null,
            // Keep relationships if on the same team, otherwise reset.
            relationships: isSameTeam ? p.relationships : {},
            teamChemistry: startingChemistry,
            // Reset narrative and news for the new season to avoid continuity errors.
            eventHistory: [],
            news: [],
            lastNewsUpdateGame: 0,
        }) : null);
        setScreen(Screen.DASHBOARD);
    };

    const fetchNews = useCallback(async () => {
        if (!player || player.seasonStats.gamesPlayed === 0 || player.seasonStats.gamesPlayed === player.lastNewsUpdateGame) return;
        setIsNewsLoading(true);
        const headlines = await generateNewsHeadlines(player, language);
        if (headlines) {
            updatePlayer(p => p ? { ...p, news: headlines, lastNewsUpdateGame: p.seasonStats.gamesPlayed } : null);
        }
        setIsNewsLoading(false);
    }, [player, language]);

    useEffect(() => {
        if (player && player.seasonStats.gamesPlayed > 0 && player.seasonStats.gamesPlayed % 5 === 0) {
            fetchNews();
        }
    }, [player?.seasonStats.gamesPlayed, fetchNews]);

    const handleLoginSuccess = (loggedInUser: User) => {
        setUser(loggedInUser);
        setScreen(Screen.USER_DASHBOARD);
    };

    const handleLogout = async () => {
        await authService.logout();
        setUser(null);
        updatePlayer(null);
        setScreen(Screen.LOGIN);
    };

    const handleLoadCareer = (careerToLoad: Player) => {
        updatePlayer(careerToLoad);
        setScreen(Screen.DASHBOARD);
    };

    const handleCreateNew = () => {
        updatePlayer(null);
        setScreen(Screen.CREATE_PLAYER);
    };
    
    const handleBackToDashboard = () => {
        updatePlayer(null);
        setScreen(Screen.USER_DASHBOARD);
    };

    const renderScreen = () => {
        if (isAuthLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-nba-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
            );
        }

        if (!user) {
            return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
        }

        if (screen === Screen.USER_DASHBOARD || (!player && screen !== Screen.CREATE_PLAYER)) {
            return <UserDashboard user={user} onLoadCareer={handleLoadCareer} onCreateNew={handleCreateNew} onLogout={handleLogout} />;
        }
        
        switch (screen) {
            case Screen.CREATE_PLAYER:
                return <CreatePlayer onPlayerCreate={handlePlayerCreate} onOpenSettingsModal={() => setShowSettingsModal(true)} onBack={() => setScreen(Screen.USER_DASHBOARD)} />;
            case Screen.PRE_DRAFT:
                return <PreDraftScreen player={player!} onPreDraftComplete={handlePreDraftComplete} />;
            case Screen.DRAFT:
                return <DraftScreen player={player!} onDraftComplete={handleDraftComplete} />;
            case Screen.DASHBOARD:
                return <Dashboard 
                    player={player!}
                    updatePlayer={updatePlayer}
                    leagueStandings={leagueStandings}
                    teamStrengths={teamStrengths}
                    onGamePlayed={handleGamePlayed}
                    onSimulateGames={handleSimulateGames}
                    onNavigate={setScreen}
                    onEventDecision={handleEventDecision}
                    isEventLoading={isEventLoading}
                    isNewsLoading={isNewsLoading}
                    eventsEnabled={eventsEnabled}
                    onToggleEvents={setEventsEnabled}

                    generateGameStats={generateGameStats}
                    onFinishSeason={() => {
                        const allGamesPlayed = player!.seasonStats.gamesPlayed >= 82;
                        if (allGamesPlayed) {
                            handleEndRegularSeason();
                        } else {
                            alert("You must finish the regular season first.");
                        }
                    }}
                    onBackToCareers={handleBackToDashboard}
                 />;
            case Screen.PLAYOFFS:
                return <Playoffs 
                            player={player!} 
                            updatePlayer={updatePlayer} 
                            onPlayoffsOver={handleStartOffSeason}
                            addNotification={addNotification}
                            onEventDecision={handleEventDecision}
                            isEventLoading={isEventLoading}
                            setIsEventLoading={setIsEventLoading}
                            teamStrengths={teamStrengths}
                        />;
            case Screen.END_SEASON_REPORT:
                return <EndSeasonReport player={player!} onProceed={() => setScreen(Screen.OFF_SEASON_TRAINING)} />;
            case Screen.OFF_SEASON_TRAINING:
                return <OffSeasonTraining player={player!} onTrainingComplete={handleOffSeasonTrainingComplete} />;
            case Screen.RETIREMENT:
                return <RetirementScreen player={player!} onRestart={handleNewCareer} />;
            case Screen.FREE_AGENCY:
                return <FreeAgencyScreen player={player!} onTeamSelect={handleTeamSelect} />;
            case Screen.TROPHY_GALLERY:
                return <TrophyGallery player={player!} onBack={() => setScreen(Screen.DASHBOARD)} />;
            case Screen.LEAGUE_STANDINGS:
                 return <LeagueStandings standings={leagueStandings} teams={TEAMS} playerTeamCode={player!.team} onNavigate={setScreen} />;
            default:
                return <UserDashboard user={user} onLoadCareer={handleLoadCareer} onCreateNew={handleCreateNew} onLogout={handleLogout} />;
        }
    };

    return (
        <main className="container mx-auto p-4 font-sans text-primary bg-background min-h-screen relative">
            {renderScreen()}

            <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse items-end space-y-2 space-y-reverse pointer-events-none">
                {activeNotifications.map(notification => (
                    <NotificationPopup
                        key={notification.id}
                        notification={notification}
                        onDismiss={() => handleDismissNotification(notification.id)}
                    />
                ))}
            </div>
            
            {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
            {showRetirementPrompt && player && <RetirementChoiceModal season={player.currentSeason} onDecision={handleRetirementDecision} />}
            {isEventLoading && <EventLoadingIndicator />}
            {player?.currentEvent && <EventModal event={player.currentEvent} onDecision={handleEventDecision} />}
            {eventOutcome && (
                <EventOutcomeModal
                    title={eventOutcome.title}
                    description={eventOutcome.description}
                    onClose={() => setEventOutcome(null)}
                />
            )}
            {showAwardsModal && lastSeasonAwards && player && (
                <AwardsCeremony 
                    player={player} 
                    awardsWon={lastSeasonAwards}
                    onContinue={() => {
                        setShowAwardsModal(false);
                        handleProceedToPostSeason();
                    }}
                />
            )}
        </main>
    );
};

export default App;