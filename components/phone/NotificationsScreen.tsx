import React from 'react';
import { Player, SocialNotification, Tweet } from '../../types';

interface NotificationsScreenProps {
    player: Player;
    onTweetSelect: (tweet: Tweet) => void;
}

const NotificationItem: React.FC<{ notification: SocialNotification }> = ({ notification }) => {
    // This is a placeholder for now. Can be expanded later.
    return (
        <div className="p-3 border-b border-gray-700/50 flex space-x-3">
            <div className="text-2xl pt-2">
                {notification.type === 'like' && '❤️'}
                {notification.type === 'reply' && '💬'}
                {notification.type === 'mention' && '👤'}
            </div>
            <div>
                 <img src={notification.fromUser.avatar} alt="avatar" className="w-8 h-8 rounded-full mb-2" />
                 <p className="text-sm text-white">
                    <span className="font-bold">{notification.fromUser.author}</span>
                    {notification.type === 'reply' && ' replied to you:'}
                    {notification.type === 'like' && ' liked your tweet:'}
                    {notification.type === 'mention' && ' mentioned you:'}
                 </p>
                 <p className="text-sm text-gray-400 mt-1 italic">"{notification.textPreview}"</p>
            </div>
        </div>
    );
}


const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ player, onTweetSelect }) => {
    return (
         <div className="h-full flex flex-col bg-gray-900 overflow-y-auto">
             {player.phone.socialNotifications.length > 0 ? (
                player.phone.socialNotifications.map(n => <NotificationItem key={n.id} notification={n} />)
            ) : (
                <div className="p-4 text-center text-gray-400 mt-10">
                    <h2 className="text-2xl font-bold text-white">No Notifications Yet</h2>
                    <p className="text-gray-400">Likes, mentions, and replies will show up here.</p>
                </div>
            )}
         </div>
    );
};

export default NotificationsScreen;