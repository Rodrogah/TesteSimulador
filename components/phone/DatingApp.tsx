import React, { useState } from 'react';
import { Player, DatingProfile, Contact } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { DATING_PROFILES, generateAvatar } from '../../constants';

interface DatingAppProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
}

const DatingApp: React.FC<DatingAppProps> = ({ player, setPlayer }) => {
    const { t } = useTranslations();
    const [profiles] = useState(() => 
        DATING_PROFILES.filter(p => !player.phone.datingMatches.includes(p.id))
    );
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMatch, setIsMatch] = useState<DatingProfile | null>(null);

    const currentProfile = profiles[currentIndex];

    const handleSwipe = (liked: boolean) => {
        if (!currentProfile) return;

        if (liked) {
            const matchChance = 0.4; // 40% chance to match
            if (Math.random() < matchChance) {
                setIsMatch(currentProfile);

                const newContact: Contact = {
                    id: currentProfile.id,
                    name: currentProfile.name,
                    type: 'Date',
                    avatar: currentProfile.avatar,
                    personality: currentProfile.personality,
                    conversation: []
                };

                setPlayer(p => {
                    if (!p) return null;
                    return {
                        ...p,
                        relationships: {
                            ...p.relationships,
                            [newContact.name]: 5 // Initialize relationship score at 5 (neutral-positive)
                        },
                        phone: {
                            ...p.phone,
                            datingMatches: [...p.phone.datingMatches, currentProfile.id],
                            contacts: [...p.phone.contacts, newContact]
                        }
                    }
                });
            }
        }
        
        if (currentIndex < profiles.length - 1) {
            setCurrentIndex(i => i + 1);
        } else {
            setCurrentIndex(profiles.length); // Indicate end of profiles
        }
    };

    if (isMatch) {
        return (
            <div className="h-full flex flex-col bg-pink-900/50 items-center justify-center p-4 animate-fade-in">
                <h2 className="text-4xl font-bold text-white">It's a Match!</h2>
                <p className="text-pink-300">You and {isMatch.name} matched.</p>
                <div className="flex my-8">
                    <img src={player.phone.socialProfile.avatarUrl} alt="player avatar" className="w-24 h-24 rounded-full border-4 border-white -mr-4 bg-gray-700" />
                    <img src={isMatch.avatar} alt={isMatch.name} className="w-24 h-24 rounded-full border-4 border-white" />
                </div>
                <button onClick={() => setIsMatch(null)} className="bg-white text-black font-bold py-2 px-6 rounded-full">Keep Swiping</button>
            </div>
        );
    }
    
    return (
        <div className="h-full flex flex-col bg-gray-900">
            <header className="bg-surface/80 backdrop-blur-sm px-3 pt-3 pb-3 text-center border-b border-pink-500/50">
                <h1 className="font-bold text-lg text-white">{t('phone.dating.title') as string}</h1>
            </header>
            <main className="flex-1 overflow-hidden p-4 flex flex-col items-center justify-center">
                {currentProfile ? (
                    <div className="relative w-full h-[80%]">
                        <div key={currentProfile.id} className="absolute inset-0 bg-surface rounded-2xl overflow-hidden shadow-lg animate-fade-in">
                            <img src={currentProfile.avatar} alt={currentProfile.name} className="w-full h-2/3 object-cover" />
                            <div className="p-4 text-white">
                                <h3 className="text-2xl font-bold">{currentProfile.name}</h3>
                                <p className="text-sm text-gray-300">{currentProfile.occupation}</p>
                                <p className="text-sm mt-2">{currentProfile.bio}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-400">No new profiles right now.</p>
                )}
                 {currentProfile && (
                    <div className="flex justify-center gap-8 mt-6">
                        <button onClick={() => handleSwipe(false)} className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 text-3xl flex items-center justify-center border-2 border-red-500">❌</button>
                        <button onClick={() => handleSwipe(true)} className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 text-3xl flex items-center justify-center border-2 border-green-500">❤️</button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DatingApp;