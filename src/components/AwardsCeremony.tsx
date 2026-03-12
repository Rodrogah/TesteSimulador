
import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface AwardsCeremonyProps {
    player: Player;
    awardsWon: string[];
    onContinue: () => void;
}

const AwardCard: React.FC<{ awardId: string, isVisible: boolean }> = ({ awardId, isVisible }) => {
    const { t } = useTranslations();
    const awardInfo = t(`trophies.${awardId}`) as { name: string, description: string };

    return (
        <div className={`
            bg-surface border-2 border-yellow-400/50 rounded-xl p-6 text-center shadow-2xl 
            transition-all duration-700 ease-out transform
            ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-5'}
        `}>
            <p className="text-6xl mb-3">🏆</p>
            <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">{awardInfo.name}</h3>
            <p className="text-sm text-secondary mt-1">{awardInfo.description}</p>
        </div>
    );
};

const AwardsCeremony: React.FC<AwardsCeremonyProps> = ({ player, awardsWon, onContinue }) => {
    const { t } = useTranslations();
    const [visibleAwardIndex, setVisibleAwardIndex] = useState(-1);

    const hasAwards = awardsWon.length > 0;

    useEffect(() => {
        if (!hasAwards) return;

        // Reveal the first award immediately
        setVisibleAwardIndex(0);

        const timer = setInterval(() => {
            setVisibleAwardIndex(prevIndex => {
                if (prevIndex < awardsWon.length - 1) {
                    return prevIndex + 1;
                }
                clearInterval(timer);
                return prevIndex;
            });
        }, 1500); // Reveal a new award every 1.5 seconds

        return () => clearInterval(timer);
    }, [awardsWon.length, hasAwards]);

    const allAwardsVisible = visibleAwardIndex >= awardsWon.length - 1 || !hasAwards;

    return (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fade-in p-4">
            <div className="text-center mb-10">
                <h1 className="text-5xl font-extrabold mb-2">{t(hasAwards ? 'awardsCeremony.title' : 'awardsCeremony.noAwardsTitle') as string}</h1>
                <p className="text-lg text-secondary">{t(hasAwards ? 'awardsCeremony.subtitle' : 'awardsCeremony.noAwardsSubtitle') as string}</p>
            </div>

            <div className="w-full max-w-md space-y-6">
                 {hasAwards ? (
                    awardsWon.map((awardId, index) => (
                        <AwardCard key={awardId} awardId={awardId} isVisible={index <= visibleAwardIndex} />
                    ))
                 ) : (
                    <div className="bg-surface p-8 rounded-xl text-center animate-fade-in">
                        <p className="text-lg text-secondary">{t('awardsCeremony.noAwardsBody') as string}</p>
                    </div>
                 )}
            </div>

            {allAwardsVisible && (
                <button
                    onClick={onContinue}
                    className="mt-12 bg-nba-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-nba-red transition-all transform hover:scale-105 active:scale-100 animate-fade-in"
                    style={{ animationDelay: hasAwards ? '500ms' : '0ms' }}
                >
                    {t('awardsCeremony.continueButton') as string}
                </button>
            )}
        </div>
    );
};

export default AwardsCeremony;