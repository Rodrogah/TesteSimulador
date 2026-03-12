import React, { useState } from 'react';
import { Player, PhoneApp } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import HomeScreen from './HomeScreen';
import SocialApp from './SocialApp';
import NewsApp from './NewsApp';
import ContactsApp from './ContactsApp';
import DatingApp from './DatingApp';


interface PhoneProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    onClose: () => void;
}

const Phone: React.FC<PhoneProps> = ({ player, setPlayer, onClose }) => {
    const { t } = useTranslations();
    const [currentApp, setCurrentApp] = useState<PhoneApp>(PhoneApp.HOME);
    const [time, setTime] = useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const renderApp = () => {
        switch (currentApp) {
            case PhoneApp.SOCIAL:
                return <SocialApp player={player} setPlayer={setPlayer} />;
            case PhoneApp.NEWS:
                return <NewsApp player={player} />;
            case PhoneApp.CONTACTS:
                return <ContactsApp player={player} setPlayer={setPlayer} />;
            case PhoneApp.DATING:
                return <DatingApp player={player} setPlayer={setPlayer} />;
            case PhoneApp.HOME:
            default:
                return <HomeScreen setCurrentApp={setCurrentApp} />;
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40" onClick={onClose}>
            <div 
                className="
                    relative w-full h-full flex flex-col bg-black overflow-hidden
                    sm:w-auto sm:h-[90vh] sm:max-h-[700px] sm:max-w-[340px] sm:rounded-[40px] sm:border-[10px] sm:border-black sm:shadow-2xl sm:aspect-[9/19.5]
                    animate-fade-in sm:animate-slide-in
                "
                onClick={e => e.stopPropagation()}
            >
                {/* Notch */}
                <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20"></div>

                {/* Status Bar */}
                <div className="absolute top-0 left-0 right-0 h-12 sm:h-10 px-6 flex justify-between items-center text-white text-xs z-10">
                    <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className="flex items-center gap-2">
                        <span>📶 LTE</span>
                        <button onClick={onClose} className="text-white" aria-label="Close phone">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* App Screen */}
                <div className="flex-1 bg-background overflow-hidden pt-12 sm:pt-10">
                    {renderApp()}
                </div>

                {/* Home Button Bar */}
                <div className="flex h-8 bg-black items-center justify-center sm:h-10">
                    <button 
                        onClick={() => setCurrentApp(PhoneApp.HOME)}
                        className="w-32 h-1.5 bg-gray-500/50 rounded-full hover:bg-white/80 transition-colors"
                        aria-label={t('phone.home') as string}
                    ></button>
                </div>
            </div>
        </div>
    );
};

export default Phone;