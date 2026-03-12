import React from 'react';
import { Player, NewsHeadline } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';

interface NewsAppProps {
    player: Player;
}

const NewsItem: React.FC<{ item: NewsHeadline }> = ({ item }) => (
    <div className="p-3 border-b border-gray-700/50">
        <span className="text-xs font-bold text-gray-400">{item.source}</span>
        <p className="text-white font-semibold mt-1">{item.headline}</p>
    </div>
);

const NewsApp: React.FC<NewsAppProps> = ({ player }) => {
    const { t } = useTranslations();
    const news = player.news;

    return (
        <div className="h-full flex flex-col bg-gray-900">
            <header className="bg-surface/80 backdrop-blur-sm px-3 pt-3 pb-3 text-center border-b border-gray-700/50">
                <h1 className="font-bold text-lg text-white">{t('phone.apps.news') as string}</h1>
            </header>
            <main className="flex-1 overflow-y-auto">
                {news.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">{t('noNews') as string}</div>
                ) : (
                    news.map((item, index) => <NewsItem key={index} item={item} />)
                )}
            </main>
        </div>
    );
};

export default NewsApp;