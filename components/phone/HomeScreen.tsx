import React from 'react';
import { PhoneApp } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';

interface HomeScreenProps {
    setCurrentApp: (app: PhoneApp) => void;
}

const AppIcon: React.FC<{ icon: string; name: string; onClick: () => void; bgColor: string }> = ({ icon, name, onClick, bgColor }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center space-y-1 group">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md transition-transform transform group-hover:scale-110 group-active:scale-95 ${bgColor}`}>
            {icon}
        </div>
        <span className="text-white text-[0.65rem] font-medium">{name}</span>
    </button>
);


const HomeScreen: React.FC<HomeScreenProps> = ({ setCurrentApp }) => {
    const { t } = useTranslations();

    return (
        <div 
            className="w-full h-full p-4 flex flex-col animate-background-pan"
            style={{
                backgroundImage: 'url(https://source.unsplash.com/random/360x780/?dark,abstract)',
                backgroundSize: '150%',
                backgroundPosition: 'center'
            }}
        >
            <div className="flex-1 grid grid-cols-4 gap-y-4 content-start pt-6 sm:pt-3">
                 <AppIcon 
                    icon="💬" 
                    name={t('phone.apps.social') as string} 
                    onClick={() => setCurrentApp(PhoneApp.SOCIAL)}
                    bgColor="bg-blue-500"
                />
                 <AppIcon 
                    icon="📰" 
                    name={t('phone.apps.news') as string} 
                    onClick={() => setCurrentApp(PhoneApp.NEWS)}
                    bgColor="bg-gray-200"
                />
                <AppIcon 
                    icon="👥" 
                    name={t('phone.apps.contacts') as string} 
                    onClick={() => setCurrentApp(PhoneApp.CONTACTS)}
                    bgColor="bg-green-500"
                />
                <AppIcon 
                    icon="❤️" 
                    name={t('phone.apps.dating') as string} 
                    onClick={() => setCurrentApp(PhoneApp.DATING)}
                    bgColor="bg-pink-500"
                />
            </div>
        </div>
    );
};

export default HomeScreen;