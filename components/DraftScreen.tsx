import React, { useState, useEffect } from 'react';
import { Player, RosterPlayer } from '../types';
import { TEAMS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';

interface DraftScreenProps {
    player: Player;
    onDraftComplete: (team: string, teammates: RosterPlayer[], draftPick: number) => void;
}

const getRandomInRange = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const DraftScreen: React.FC<DraftScreenProps> = ({ player, onDraftComplete }) => {
    const { t, language } = useTranslations();
    const [draftPhase, setDraftPhase] = useState<'announcing' | 'drafting' | 'revealed'>('announcing');
    const [displayedLogo, setDisplayedLogo] = useState<string>('');
    const [finalTeamCode, setFinalTeamCode] = useState<string | null>(null);
    const [calculatedPick, setCalculatedPick] = useState<number | null>(null);

    useEffect(() => {
        const preDraftScore = player.draftStock;
        let draftPosition;

        if (preDraftScore >= 25) { // Top 5
            draftPosition = getRandomInRange(1, 5);
        } else if (preDraftScore >= 20) { // Lottery
            draftPosition = getRandomInRange(5, 14);
        } else if (preDraftScore >= 15) { // Late 1st
            draftPosition = getRandomInRange(15, 30);
        } else if (preDraftScore >= 10) { // 2nd Round
            draftPosition = getRandomInRange(31, 50);
        } else { // Late 2nd / Undrafted
            draftPosition = getRandomInRange(51, 60);
        }
        
        setTimeout(() => setCalculatedPick(draftPosition), 1000);
    }, [player.draftStock]);

    useEffect(() => {
        if (calculatedPick === null) return;
        
        const teamCodes = Object.keys(TEAMS);
        if (teamCodes.length === 0) return;

        setDraftPhase('drafting');
        
        const finalDraftTeam = teamCodes[Math.floor(Math.random() * teamCodes.length)];
        
        let speed = 30;
        let totalSteps = 50;
        let currentStep = 0;
        let lotteryTimeout: number;

        const runLottery = () => {
            currentStep++;

            if (currentStep > totalSteps) {
                return; 
            }

            if (currentStep === totalSteps) {
                setDisplayedLogo(finalDraftTeam);
                setTimeout(() => {
                    setFinalTeamCode(finalDraftTeam);
                    setDraftPhase('revealed');
                }, 750);
                return;
            }

            setDisplayedLogo(teamCodes[Math.floor(Math.random() * teamCodes.length)]);
            
            if (currentStep > 45) speed += 40;
            else if (currentStep > 40) speed += 20;
            else if (currentStep > 25) speed += 10;
            
            lotteryTimeout = window.setTimeout(runLottery, speed);
        };

        lotteryTimeout = window.setTimeout(runLottery, speed);

        return () => {
            if(lotteryTimeout) clearTimeout(lotteryTimeout);
        };
    }, [calculatedPick]);

    const introText = (() => {
        if (!finalTeamCode || !calculatedPick) return '';
        const teamName = TEAMS[finalTeamCode].name;
        const baseText = t('draft.selectedBy', { teamName }) as string;
        const pickOrdinal = language === 'pt-br' ? `${calculatedPick}ª` : getOrdinal(calculatedPick);

        if (language === 'pt-br') {
            return baseText.replace('seguinte escolha', `${pickOrdinal} escolha`);
        }
        return baseText.replace('following selection', `number ${calculatedPick} pick`);

    })();
    
    const finalTeam = finalTeamCode ? TEAMS[finalTeamCode] : null;

    return (
        <div className="max-w-4xl mx-auto text-center animate-fade-in flex flex-col items-center justify-center min-h-[80vh]">
            <header className="mb-8">
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-nba-blue via-white to-nba-red">
                    {t('draft.title') as string}
                </h1>
                {/* FIX: Cast results of `t` function to string to resolve TypeScript type error. */}
                <p className="text-lg text-secondary">{draftPhase === 'revealed' ? t('draft.newChapter') as string : t('draft.deciding') as string}</p>
            </header>

            <div className="relative w-full h-48 flex items-center justify-center mb-8">
                <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none"
                    style={{ backgroundImage: `radial-gradient(circle at center, ${finalTeam?.primaryColor || 'rgba(200, 16, 46, 0.0)'}25 0%, transparent 60%)` }}
                ></div>

                {(draftPhase === 'drafting' || (draftPhase === 'revealed' && displayedLogo === finalTeamCode)) && displayedLogo && (
                    <img 
                        key={displayedLogo}
                        src={TEAMS[displayedLogo].logo} 
                        alt="Team Logo" 
                        className={`w-32 h-32 object-contain ${draftPhase === 'revealed' ? 'animate-pulse-strong' : 'animate-fade-in'}`}
                        style={draftPhase === 'revealed' ? { filter: 'drop-shadow(0 0 1rem #f0f0f0)'} : {}}
                    />
                )}

                {draftPhase === 'revealed' && finalTeamCode && displayedLogo !== finalTeamCode && (
                     <img 
                        src={TEAMS[finalTeamCode].logo} 
                        alt="Selected Team Logo" 
                        className="w-36 h-36 object-contain animate-pulse-strong"
                        style={{ filter: 'drop-shadow(0 0 1rem #f0f0f0)'}}
                    />
                )}
            </div>

            {draftPhase === 'revealed' && finalTeamCode && calculatedPick !== null && (
                <div 
                    className="w-full max-w-lg bg-surface/80 backdrop-blur-sm p-6 rounded-xl shadow-2xl border-2 animate-slide-in"
                    style={{ borderColor: finalTeam?.primaryColor || '#6c757d' }}
                >
                    <p className="text-lg text-secondary mb-3">{introText}</p>
                    <h2 
                        className="text-5xl sm:text-6xl font-black my-2 text-transparent bg-clip-text bg-gradient-to-r animate-fade-in" 
                        style={{
                            backgroundImage: `linear-gradient(to right, ${finalTeam?.primaryColor || '#f0f0f0'}, ${finalTeam?.secondaryColor || '#6c757d'})`,
                            animationDelay: '200ms'
                        }}
                    >
                        {player.name || t('rookieSensation') as string}!
                    </h2>
                    <p className="text-xl text-primary font-semibold mb-6 animate-fade-in" style={{ animationDelay: '400ms'}}>
                        {t(`positions.${player.position}`) as string}
                    </p>
                    
                    <div className="flex justify-center gap-4 my-6 animate-fade-in" style={{ animationDelay: '600ms'}}>
                        <div className="text-center p-3 bg-background rounded-lg border border-white/10 w-28">
                            <p className="text-sm text-secondary">{t('draft.round') as string}</p>
                            <p className="text-3xl font-bold">{calculatedPick <= 30 ? 1 : 2}</p>
                        </div>
                        <div className="text-center p-3 bg-background rounded-lg border border-white/10 w-28">
                            <p className="text-sm text-secondary">{t('draft.pick') as string}</p>
                            <p className="text-3xl font-bold">{calculatedPick <= 30 ? calculatedPick : calculatedPick - 30}</p>
                        </div>
                         <div className="text-center p-3 bg-background rounded-lg border border-white/10 w-28">
                            <p className="text-sm text-secondary">{t('draft.overallPick') as string}</p>
                            <p className="text-3xl font-bold">{calculatedPick}</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            const team = TEAMS[finalTeamCode];
                            const teammates = team.roster.filter(p => p.position !== player.position).slice(0, 4);
                            onDraftComplete(finalTeamCode, teammates, calculatedPick)
                        }}
                        className="mt-4 text-white font-bold py-3 px-8 rounded-lg transition-colors transform hover:scale-105 animate-fade-in"
                        style={{ 
                            backgroundColor: finalTeam?.primaryColor || '#c8102e',
                            animationDelay: '800ms'
                        }}
                    >
                        {t('draft.startCareerButton') as string}
                    </button>
                </div>
            )}
        </div>
    );
};

export default DraftScreen;