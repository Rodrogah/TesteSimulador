


import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Player, CollegeGame, PreDraftInterview, Position } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { generatePreDraftInterview } from '../services/puterService';

interface PreDraftScreenProps {
    player: Player;
    onPreDraftComplete: (draftStock: number) => void;
}

const StatCard: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className }) => (
    <div className={`bg-background/50 border border-white/10 p-3 rounded-lg text-center ${className}`}>
        <div className="text-sm text-secondary">{label}</div>
        <div className="text-2xl font-bold" key={value}>{value}</div>
    </div>
);

const PreDraftScreen: React.FC<PreDraftScreenProps> = ({ player, onPreDraftComplete }) => {
    const { t, language } = useTranslations();
    
    const [activity, setActivity] = useState<'menu' | 'games' | 'interview'>('menu');
    const [gamesCompleted, setGamesCompleted] = useState(false);
    const [interviewCompleted, setInterviewCompleted] = useState(false);
    const [collegeGames, setCollegeGames] = useState<CollegeGame[]>([]);
    
    const [interviews, setInterviews] = useState<PreDraftInterview[]>([]);
    const [currentInterviewIndex, setCurrentInterviewIndex] = useState(0);
    const [isInterviewLoading, setIsInterviewLoading] = useState(false);
    
    const [draftScore, setDraftScore] = useState(10);
    const [lastScoreChange, setLastScoreChange] = useState(0);

    const [currentGameIndex, setCurrentGameIndex] = useState(0);
    const [isSimulatingGame, setIsSimulatingGame] = useState(false);
    const [liveGameData, setLiveGameData] = useState<{
        playerStats: { points: number; assists: number; rebounds: number };
        scores: { player: number; opponent: number };
        quarter: number;
    } | null>(null);

    const gameOpponents = useMemo(() => [
        t('preDraft.opponent1') as string,
        t('preDraft.opponent2') as string,
        t('preDraft.opponent3') as string,
    ], [t]);

    useEffect(() => {
        // When returning to the main menu, clear the score change indicator immediately.
        if (activity === 'menu') {
            setLastScoreChange(0);
        }
    }, [activity]);

    const getProjectedPick = (score: number): string => {
        if (score >= 25) return t('projectedPick.top5') as string;
        if (score >= 20) return t('projectedPick.lottery') as string;
        if (score >= 15) return t('projectedPick.firstRound') as string;
        if (score >= 10) return t('projectedPick.secondRound') as string;
        return t('projectedPick.undrafted') as string;
    };

    const handleStartGames = () => {
        setActivity('games');
        setCurrentGameIndex(0);
        setCollegeGames([]);
        setLiveGameData(null);
    };

    const handleSimulateCurrentGame = useCallback(() => {
        const generateShowcaseGameStats = (player: Player): { points: number, rebounds: number, assists: number } => {
            const { stats, position } = player;
    
            const scoringPotential = (stats.shooting * 0.4) + (stats.finishing * 0.3) + (stats.midrange * 0.15) + (stats.threepoint * 0.15);
            const reboundingPotential = (stats.rebounding * 0.7) + (stats.strength * 0.2) + (stats.athleticism * 0.1);
            const playmakingPotential = (stats.playmaking * 0.6) + (stats.ball_handle * 0.4);
    
            const posModifiers: { [key in 'points' | 'rebounds' | 'assists']: { [key in Position]: number } } = {
                points: { PG: 0.9, SG: 1.1, SF: 1.0, PF: 0.9, C: 0.8 },
                rebounds: { PG: 0.4, SG: 0.5, SF: 0.7, PF: 1.0, C: 1.2 },
                assists: { PG: 1.2, SG: 0.8, SF: 0.9, PF: 0.6, C: 0.5 },
            };
    
            const basePoints = 15 + (scoringPotential / 99) * 25;
            const baseRebounds = 3 + (reboundingPotential / 99) * 12;
            const baseAssists = 3 + (playmakingPotential / 99) * 12;
    
            let points = basePoints * posModifiers.points[position] + (Math.random() - 0.5) * 8;
            let rebounds = baseRebounds * posModifiers.rebounds[position] + (Math.random() - 0.5) * 4;
            let assists = baseAssists * posModifiers.assists[position] + (Math.random() - 0.5) * 4;
            
            return {
                points: Math.max(0, Math.round(points)),
                rebounds: Math.max(0, Math.round(rebounds)),
                assists: Math.max(0, Math.round(assists)),
            };
        };
        
        setIsSimulatingGame(true);
        setLiveGameData({
            playerStats: { points: 0, assists: 0, rebounds: 0 },
            scores: { player: 0, opponent: 0 },
            quarter: 1,
        });
    
        const finalPlayerStats = generateShowcaseGameStats(player);

        const playerTeamStrength = (player.stats.shooting + player.stats.finishing + player.stats.playmaking + player.stats.defense + player.stats.athleticism) / 5;
        const opponentStrength = 70 + (currentGameIndex * 4);
        const winChance = 0.5 + (playerTeamStrength - opponentStrength) * 0.015;
        const didWin = Math.random() < Math.max(0.1, Math.min(0.9, winChance));

        const scoreMargin = Math.floor(Math.random() * 12) + 3;
        const baseScore = 85 + Math.floor(Math.random() * 10);
        const playerTeamScore = didWin ? baseScore + scoreMargin : baseScore - scoreMargin;
        const opponentTeamScore = didWin ? baseScore - scoreMargin : baseScore + scoreMargin;
        
        let possessions = 0;
        const totalPossessions = 80;
    
        const gameInterval = setInterval(() => {
            if (possessions >= totalPossessions) {
                clearInterval(gameInterval);
                setLiveGameData({
                    quarter: 5,
                    playerStats: finalPlayerStats,
                    scores: { player: playerTeamScore, opponent: opponentTeamScore }
                });
    
                setTimeout(() => {
                    const finalGame: CollegeGame = { opponent: gameOpponents[currentGameIndex], ...finalPlayerStats };
                    setCollegeGames(currentGames => [...currentGames, finalGame]);
    
                    const { stats, position } = player;
                    const scoringPotential = (stats.shooting * 0.4) + (stats.finishing * 0.3) + (stats.midrange * 0.15) + (stats.threepoint * 0.15);
                    const reboundingPotential = (stats.rebounding * 0.7) + (stats.strength * 0.2) + (stats.athleticism * 0.1);
                    const playmakingPotential = (stats.playmaking * 0.6) + (stats.ball_handle * 0.4);

                    const posModifiers: { [key in 'points' | 'rebounds' | 'assists']: { [key in Position]: number } } = {
                        points: { PG: 0.9, SG: 1.1, SF: 1.0, PF: 0.9, C: 0.8 },
                        rebounds: { PG: 0.4, SG: 0.5, SF: 0.7, PF: 1.0, C: 1.2 },
                        assists: { PG: 1.2, SG: 0.8, SF: 0.9, PF: 0.6, C: 0.5 },
                    };

                    const expectedPoints = (10 + (scoringPotential / 99) * 15) * posModifiers.points[position];
                    const expectedRebounds = (2 + (reboundingPotential / 99) * 8) * posModifiers.rebounds[position];
                    const expectedAssists = (2 + (playmakingPotential / 99) * 8) * posModifiers.assists[position];

                    const pointDiff = finalGame.points - expectedPoints;
                    const reboundDiff = finalGame.rebounds - expectedRebounds;
                    const assistDiff = finalGame.assists - expectedAssists;

                    const statScoreChange = Math.round(pointDiff / 5 + reboundDiff / 2.5 + assistDiff / 2.5);
                    
                    let finalScoreChange = statScoreChange;
                    const isCloseGame = Math.abs(playerTeamScore - opponentTeamScore) <= 5;

                    if (didWin) {
                        finalScoreChange += 1; // Base for win
                        if (statScoreChange > 0) finalScoreChange += 1; // Good game in a win
                        if (isCloseGame && statScoreChange > 0) finalScoreChange += 1; // Clutch bonus
                    } else {
                        finalScoreChange -= 2; // Base for loss
                        if (statScoreChange > 0) finalScoreChange += 1; // Mitigate loss with good stats
                        if (isCloseGame && statScoreChange < 0) finalScoreChange -= 1; // Penalty for playing poorly in a close loss
                    }
    
                    setDraftScore(ds => ds + finalScoreChange);
                    setLastScoreChange(finalScoreChange);
    
                    setIsSimulatingGame(false);
                    if (currentGameIndex === 2) {
                        setGamesCompleted(true);
                    }
                }, 1000);
                return;
            }
    
            possessions++;
            const progress = possessions / totalPossessions;
    
            setLiveGameData({
                quarter: Math.min(4, Math.ceil(progress * 4)),
                scores: {
                    player: Math.round(playerTeamScore * progress),
                    opponent: Math.round(opponentTeamScore * progress)
                },
                playerStats: {
                    points: Math.round(finalPlayerStats.points * progress),
                    rebounds: Math.round(finalPlayerStats.rebounds * progress),
                    assists: Math.round(finalPlayerStats.assists * progress),
                }
            });
        }, 50);
    }, [player, currentGameIndex, gameOpponents]);

    const handleNextGame = () => {
        setLastScoreChange(0);
        setCurrentGameIndex(prev => prev + 1);
        setLiveGameData(null);
    };
    
    const handleStartInterview = async () => {
        setActivity('interview');
        setIsInterviewLoading(true);
        const questions = await generatePreDraftInterview(player, language);
        setInterviews(questions);
        setIsInterviewLoading(false);
    };
    
    const handleInterviewAnswer = (stockChange: number) => {
        setDraftScore(prev => Math.max(0, prev + stockChange));
        setLastScoreChange(stockChange);
        if (currentInterviewIndex < interviews.length - 1) {
            setCurrentInterviewIndex(prev => prev + 1);
        } else {
            setInterviewCompleted(true);
            setActivity('menu');
        }
    };

    const renderGameSimulation = () => {
        const opponentName = gameOpponents[currentGameIndex];
        const quarterText = liveGameData?.quarter === 5 
            ? t('preDraft.final') as string
            : liveGameData && liveGameData.quarter > 0
                ? t('preDraft.quarter', { num: liveGameData.quarter }) as string
                : '-';

        let button;
        if (isSimulatingGame) {
            button = <button disabled className="w-full bg-nba-gray/50 text-white font-bold py-3 px-6 rounded-lg animate-pulse">{t('preDraft.simulating') as string}</button>;
        } else if (liveGameData?.quarter === 5) {
            if (currentGameIndex < 2) {
                button = <button onClick={handleNextGame} className="w-full bg-nba-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-nba-red transition-colors">{t('preDraft.nextGame') as string}</button>;
            } else {
                button = <button onClick={() => setActivity('menu')} className="w-full bg-nba-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-nba-red transition-colors">{t('preDraft.returnToHub') as string}</button>;
            }
        } else {
            button = <button onClick={handleSimulateCurrentGame} className="w-full bg-nba-red text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors">{t('preDraft.simulateGame', { num: currentGameIndex + 1 }) as string}</button>;
        }

        return (
            <div className="bg-surface p-6 rounded-xl shadow-lg border border-white/10 animate-slide-in space-y-4">
                <h2 className="text-xl font-bold text-center">{t('preDraft.showcaseGame', {num: currentGameIndex + 1}) as string}</h2>
                <div className="bg-background p-4 rounded-lg">
                    <div className="flex justify-between items-center text-center mb-4">
                        <div className="flex-1">
                            <p className="font-bold text-lg">{t('preDraft.yourTeam') as string}</p>
                            <p className="text-4xl font-black text-primary transition-all duration-300" key={`p_score_${liveGameData?.scores?.player}`}>{liveGameData?.scores?.player ?? 0}</p>
                        </div>
                        <div className="w-24">
                            <p className="text-sm text-secondary"> {quarterText} </p>
                        </div>
                         <div className="flex-1">
                            <p className="font-bold text-lg">{opponentName}</p>
                            <p className="text-4xl font-black text-secondary transition-all duration-300" key={`o_score_${liveGameData?.scores?.opponent}`}>{liveGameData?.scores?.opponent ?? 0}</p>
                        </div>
                    </div>
                     <div className="grid grid-cols-3 gap-2">
                        <StatCard label={t('points') as string} value={liveGameData?.playerStats?.points ?? 0} />
                        <StatCard label={t('rebounds') as string} value={liveGameData?.playerStats?.rebounds ?? 0} />
                        <StatCard label={t('assists') as string} value={liveGameData?.playerStats?.assists ?? 0} />
                    </div>
                </div>
                {button}
            </div>
        );
    };

    const renderActivityContent = () => {
        switch (activity) {
            case 'games':
                return renderGameSimulation();
            case 'interview':
                if (isInterviewLoading) {
                    return <div className="text-center p-6 bg-surface rounded-xl"><p className="animate-pulse">{t('preDraft.generatingQuestions') as string}</p></div>
                }
                const currentInterview = interviews[currentInterviewIndex];
                if (!currentInterview) return null;
                return (
                     <div className="bg-surface p-6 rounded-xl shadow-lg border border-white/10 animate-slide-in">
                        <p className="text-sm text-secondary mb-2">{t('preDraft.question', {num: currentInterviewIndex + 1, total: interviews.length}) as string}</p>
                        <h2 className="text-xl font-semibold mb-4">{currentInterview.question}</h2>
                        <div className="space-y-3">
                            {currentInterview.choices.map((choice, i) => (
                                <button key={i} onClick={() => handleInterviewAnswer(choice.stockChange)} className="w-full text-left bg-background p-4 rounded-lg border-2 border-transparent hover:border-nba-blue transition-all">
                                    <p>{choice.text}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'menu':
            default:
                return (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                        <button onClick={handleStartGames} disabled={gamesCompleted} className="bg-surface p-6 rounded-xl shadow-lg border-2 border-white/10 hover:border-nba-blue disabled:opacity-50 disabled:hover:border-white/10 transition-all text-center">
                           <p className="text-5xl mb-2">🏀</p>
                           <h2 className="text-xl font-bold">{t('preDraft.gamesTitle') as string}</h2>
                           <p className="text-sm text-secondary">{gamesCompleted ? t('preDraft.completed') as string : t('preDraft.gamesDesc') as string}</p>
                        </button>
                         <button onClick={handleStartInterview} disabled={interviewCompleted} className="bg-surface p-6 rounded-xl shadow-lg border-2 border-white/10 hover:border-nba-blue disabled:opacity-50 disabled:hover:border-white/10 transition-all text-center">
                           <p className="text-5xl mb-2">🎤</p>
                           <h2 className="text-xl font-bold">{t('preDraft.interviewTitle') as string}</h2>
                           <p className="text-sm text-secondary">{interviewCompleted ? t('preDraft.completed') as string : t('preDraft.interviewDesc') as string}</p>
                        </button>
                    </div>
                );
        }
    };
    
    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <header className="text-center mb-6">
                <h1 className="text-4xl font-extrabold mb-1">{t('preDraft.title') as string}</h1>
                <p className="text-secondary">{t('preDraft.makeChoice') as string}</p>
            </header>

            <div className="bg-surface p-6 rounded-xl shadow-lg border border-white/10 mb-6">
                <div className="grid grid-cols-5 gap-6 items-center">
                    <div className="col-span-3 border-r border-white/10 pr-6">
                        <h3 className="text-2xl font-bold">{player.name}</h3>
                        <p className="text-sm text-secondary">{t(`positions.${player.position}`) as string}</p>
                    </div>

                    <div className="col-span-2 text-right">
                        <p className="text-xs font-semibold text-secondary">{t('preDraft.draftStock') as string}</p>
                        <div className="flex justify-end items-baseline gap-2">
                            {lastScoreChange !== 0 && activity !== 'menu' && (
                                <span key={Date.now()} className={`font-bold text-lg animate-stock-change ${lastScoreChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ({lastScoreChange > 0 ? '+' : ''}{lastScoreChange})
                                </span>
                            )}
                            <h4 className="text-2xl font-extrabold text-center">
                                {getProjectedPick(draftScore)}
                            </h4>
                        </div>
                    </div>
                </div>
            </div>
            
            {renderActivityContent()}

            {activity === 'menu' && !(gamesCompleted && interviewCompleted) && (
                <div className="text-center mt-6">
                    <button
                        onClick={() => onPreDraftComplete(15)}
                        className="bg-nba-gray/20 hover:bg-nba-gray/40 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                        {t('preDraft.skipToDraft') as string}
                    </button>
                </div>
            )}
            
            {activity === 'menu' && gamesCompleted && interviewCompleted && (
                 <div className="text-center mt-8">
                     <button 
                        onClick={() => onPreDraftComplete(draftScore)}
                        className="w-full md:w-3/4 bg-nba-red text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-all transform hover:scale-105 animate-pulse-strong"
                    >
                        {t('preDraft.goToDraftButton') as string}
                    </button>
                 </div>
            )}
        </div>
    );
};

export default PreDraftScreen;