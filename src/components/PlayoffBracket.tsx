import React, { useState } from 'react';
import { PlayoffBracket, PlayoffMatchup, PlayoffConferenceBracket } from '../types';
import { TEAMS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';

// A single team row within a matchup card
const TeamRow: React.FC<{ teamCode: string; seed: number; wins: number; isWinner: boolean | null; playerTeam: string }> = ({ teamCode, seed, wins, isWinner, playerTeam }) => {
    if (!teamCode) {
        return (
            <div className="flex items-center justify-between p-1 h-9">
                <span className="text-xs text-secondary">TBD</span>
            </div>
        );
    }
    const teamInfo = TEAMS[teamCode];
    const isPlayer = teamCode === playerTeam;
    
    return (
        <div className={`flex items-center justify-between p-1 rounded transition-all h-9 ${isWinner ? 'bg-nba-blue/20' : ''} ${isWinner === false ? 'opacity-50' : ''} ${isPlayer ? 'ring-2 ring-yellow-400' : ''}`}>
            <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-xs text-secondary font-bold w-4">{seed}</span>
                <img src={teamInfo.logo} alt={teamInfo.name} className="w-5 h-5 flex-shrink-0" />
                <span className="truncate text-xs font-semibold">{teamInfo.name}</span>
            </div>
            <span className="text-base font-black">{wins}</span>
        </div>
    );
};

// A card representing a single playoff series
const MatchupCard: React.FC<{ matchup: PlayoffMatchup; playerTeam: string; }> = ({ matchup, playerTeam }) => {
    const { team1, team2, team1Wins, team2Wins, winner } = matchup;

    return (
        <div className="bg-surface border border-white/10 rounded-lg w-full max-w-[200px] mx-auto">
            <div className="space-y-0.5 p-0.5">
                <TeamRow teamCode={team1.code} seed={team1.seed} wins={team1Wins} isWinner={winner ? winner === team1.code : null} playerTeam={playerTeam} />
                <TeamRow teamCode={team2.code} seed={team2.seed} wins={team2Wins} isWinner={winner ? winner === team2.code : null} playerTeam={playerTeam} />
            </div>
        </div>
    );
};

const roundKeyMap: { [key: string]: string } = {
    'First Round': 'playoffRounds.first',
    'Conference Semifinals': 'playoffRounds.semis',
    'Conference Finals': 'playoffRounds.finals',
    'NBA Finals': 'playoffRounds.nbaFinals'
};


const MobileConferenceBracket: React.FC<{
    conferenceBracket: PlayoffConferenceBracket;
    playerTeam: string;
}> = ({ conferenceBracket, playerTeam }) => {
    const { t } = useTranslations();

    const renderRound = (roundName: keyof Omit<PlayoffConferenceBracket, 'champion'>, matchups: PlayoffMatchup[]) => {
        if (!matchups || matchups.length === 0) return null;
        return (
            <div className="mb-6 last:mb-0">
                <h4 className="font-bold text-center mb-3 text-secondary">{t(roundKeyMap[roundName]) as string}</h4>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 items-center`}>
                    {matchups.map(m => m && <MatchupCard key={m.id} matchup={m} playerTeam={playerTeam} />)}
                </div>
            </div>
        );
    };

    const RoundConnector = () => (
        <div className="flex justify-center items-center my-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary opacity-50"/>
            </svg>
        </div>
    );

    return (
        <div className="animate-fade-in">
            {renderRound('First Round', conferenceBracket['First Round'])}
            <RoundConnector />
            {renderRound('Conference Semifinals', conferenceBracket['Conference Semifinals'])}
            <RoundConnector />
            {renderRound('Conference Finals', conferenceBracket['Conference Finals'])}
        </div>
    );
};


// The main component that renders a consistent horizontal bracket
const PlayoffBracketDisplay: React.FC<{ bracket: PlayoffBracket; playerTeam: string }> = ({ bracket, playerTeam }) => {
    const { t } = useTranslations();
    const [mobileView, setMobileView] = useState<'West' | 'East' | 'Finals'>(TEAMS[playerTeam].conference as 'West' | 'East');


    const finalsMatchup = bracket['NBA Finals'];

    const westSemis = [
        bracket.West['Conference Semifinals'].find(m => m.id.endsWith('SF1')) || null,
        bracket.West['Conference Semifinals'].find(m => m.id.endsWith('SF2')) || null,
    ];

    const westFinals = [ bracket.West['Conference Finals'].find(m => m.id.endsWith('CF')) || null ];

    const eastSemis = [
        bracket.East['Conference Semifinals'].find(m => m.id.endsWith('SF1')) || null,
        bracket.East['Conference Semifinals'].find(m => m.id.endsWith('SF2')) || null,
    ];

    const eastFinals = [ bracket.East['Conference Finals'].find(m => m.id.endsWith('CF')) || null ];
    
    const Column: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
        <div className="flex flex-col h-full relative py-8">
            <h3 className="text-sm font-bold text-secondary absolute top-0 left-1/2 -translate-x-1/2 whitespace-nowrap">{title}</h3>
            {children}
        </div>
    );

    const ChampionDisplay = () => (
        <div className="mt-8 md:mt-12 text-center animate-fade-in flex justify-center">
            <div className="relative bg-surface p-6 rounded-xl border-2 border-yellow-400 shadow-2xl shadow-yellow-400/10 w-80 flex flex-col items-center justify-center">
                <div className="absolute -top-8 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-surface">
                    <span className="text-4xl">🏆</span>
                </div>
                <h3 className="text-sm font-bold text-secondary uppercase mt-6">{t('playoffs.nbaChampion') as string}</h3>
                <div className="flex items-center justify-center mt-2">
                    <img src={TEAMS[bracket['NBA Champion']!].logo} alt="" className="w-10 h-10 mr-3" />
                    <p className="text-2xl font-black">{TEAMS[bracket['NBA Champion']!].name}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full font-sans">
            {/* Desktop Bracket */}
            <div className="hidden lg:block">
                <div className="flex justify-center items-stretch relative min-h-[550px] py-8">
                    {/* Connectors Layer */}
                    <div className="absolute inset-y-8 left-0 right-0 z-0 pointer-events-none">
                        {/* West Connectors */}
                        <div className="absolute left-[calc(100%/14*2)] top-[calc(100%/6)] h-[calc(100%/6)] w-[calc(100%/14)] border-t-2 border-r-2 border-b-2 border-white/10 rounded-r-lg" />
                        <div className="absolute left-[calc(100%/14*2)] top-[calc(100%/6*4)] h-[calc(100%/6)] w-[calc(100%/14)] border-t-2 border-r-2 border-b-2 border-white/10 rounded-r-lg" />
                        <div className="absolute left-[calc(100%/14*4)] top-[calc(100%/4)] h-[calc(100%/2)] w-[calc(100%/14)] border-t-2 border-r-2 border-b-2 border-white/10 rounded-r-lg" />
                        <div className="absolute left-[calc(100%/14*6)] top-1/2 h-0 w-[calc(100%/14)] border-t-2 border-white/10" />

                        {/* East Connectors */}
                        <div className="absolute right-[calc(100%/14*2)] top-[calc(100%/6)] h-[calc(100%/6)] w-[calc(100%/14)] border-t-2 border-l-2 border-b-2 border-white/10 rounded-l-lg" />
                        <div className="absolute right-[calc(100%/14*2)] top-[calc(100%/6*4)] h-[calc(100%/6)] w-[calc(100%/14)] border-t-2 border-l-2 border-b-2 border-white/10 rounded-l-lg" />
                        <div className="absolute right-[calc(100%/14*4)] top-[calc(100%/4)] h-[calc(100%/2)] w-[calc(100%/14)] border-t-2 border-l-2 border-b-2 border-white/10 rounded-l-lg" />
                        <div className="absolute right-[calc(100%/14*6)] top-1/2 h-0 w-[calc(100%/14)] border-t-2 border-white/10" />
                    </div>

                    {/* Matchups Layer */}
                    <div className="grid grid-cols-7 w-full min-w-[1280px] max-w-screen-2xl mx-auto z-10">
                        <Column title={t('playoffRounds.first') as string}>
                            <div className="flex-1 flex flex-col justify-evenly">
                                {bracket.West['First Round'].slice(0, 2).map(m => m ? <MatchupCard key={m.id} matchup={m} playerTeam={playerTeam} /> : null)}
                            </div>
                            <div className="flex-1 flex flex-col justify-evenly">
                                {bracket.West['First Round'].slice(2, 4).map(m => m ? <MatchupCard key={m.id} matchup={m} playerTeam={playerTeam} /> : null)}
                            </div>
                        </Column>
                         <Column title={t('playoffRounds.semis') as string}>
                            <div className="flex-1 flex items-center justify-center">{westSemis[0] && <MatchupCard matchup={westSemis[0]} playerTeam={playerTeam} />}</div>
                            <div className="flex-1 flex items-center justify-center">{westSemis[1] && <MatchupCard matchup={westSemis[1]} playerTeam={playerTeam} />}</div>
                        </Column>
                        <Column title={t('playoffRounds.finals') as string}>
                            <div className="flex-1 flex items-center justify-center">{westFinals[0] && <MatchupCard matchup={westFinals[0]} playerTeam={playerTeam} />}</div>
                        </Column>
                        
                        <Column title={t('playoffRounds.nbaFinals') as string}>
                            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                <div className="h-20"></div> 
                                {finalsMatchup && <MatchupCard matchup={finalsMatchup} playerTeam={playerTeam} />}
                            </div>
                        </Column>

                        <Column title={t('playoffRounds.finals') as string}>
                             <div className="flex-1 flex items-center justify-center">{eastFinals[0] && <MatchupCard matchup={eastFinals[0]} playerTeam={playerTeam} />}</div>
                        </Column>
                        <Column title={t('playoffRounds.semis') as string}>
                            <div className="flex-1 flex items-center justify-center">{eastSemis[1] && <MatchupCard matchup={eastSemis[1]} playerTeam={playerTeam} />}</div>
                            <div className="flex-1 flex items-center justify-center">{eastSemis[0] && <MatchupCard matchup={eastSemis[0]} playerTeam={playerTeam} />}</div>
                        </Column>
                        <Column title={t('playoffRounds.first') as string}>
                            <div className="flex-1 flex flex-col justify-evenly">
                                {bracket.East['First Round'].slice(2, 4).map(m => m ? <MatchupCard key={m.id} matchup={m} playerTeam={playerTeam} /> : null)}
                            </div>
                            <div className="flex-1 flex flex-col justify-evenly">
                                {bracket.East['First Round'].slice(0, 2).map(m => m ? <MatchupCard key={m.id} matchup={m} playerTeam={playerTeam} /> : null)}
                            </div>
                        </Column>
                    </div>
                </div>
                {bracket['NBA Champion'] && <ChampionDisplay />}
            </div>

            {/* Mobile / Tablet Bracket */}
            <div className="block lg:hidden">
                <div className="flex justify-center items-center p-1 rounded-full bg-surface mb-6 max-w-sm mx-auto">
                    <button onClick={() => setMobileView('West')} className={`px-4 py-2 text-sm font-bold rounded-full transition-colors w-full ${mobileView === 'West' ? 'bg-nba-blue text-white' : 'text-secondary hover:bg-nba-gray/20'}`}>
                        West
                    </button>
                    <button onClick={() => setMobileView('Finals')} className={`px-4 py-2 text-sm font-bold rounded-full transition-colors w-full ${mobileView === 'Finals' ? 'bg-yellow-500 text-black' : 'text-secondary hover:bg-nba-gray/20'}`}>
                        Finals
                    </button>
                    <button onClick={() => setMobileView('East')} className={`px-4 py-2 text-sm font-bold rounded-full transition-colors w-full ${mobileView === 'East' ? 'bg-nba-red text-white' : 'text-secondary hover:bg-nba-gray/20'}`}>
                        East
                    </button>
                </div>
                
                {mobileView === 'West' && <MobileConferenceBracket conferenceBracket={bracket.West} playerTeam={playerTeam} />}
                {mobileView === 'East' && <MobileConferenceBracket conferenceBracket={bracket.East} playerTeam={playerTeam} />}
                
                {mobileView === 'Finals' && (
                    <div className="animate-fade-in space-y-8">
                        {finalsMatchup ? (
                            <div>
                                <h4 className="font-bold text-center mb-3 text-secondary">{t(roundKeyMap['NBA Finals']) as string}</h4>
                                <div className="flex justify-center">
                                    <MatchupCard matchup={finalsMatchup} playerTeam={playerTeam} />
                                </div>
                            </div>
                        ) : (
                            <p className="text-secondary text-center py-8">{t('playoffs.waitingForOpponent') as string}</p>
                        )}

                        {bracket['NBA Champion'] && <ChampionDisplay />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayoffBracketDisplay;