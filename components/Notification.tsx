

import React, { useEffect, useState } from 'react';
import { Notification } from '../types';

interface NotificationPopupProps {
    notification: Notification;
    onDismiss: () => void;
}

const NOTIFICATION_DURATION = 5000; // Total time on screen
const ANIMATION_DURATION = 500;   // Fade in/out duration

const NotificationPopup: React.FC<NotificationPopupProps> = ({ notification, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    const getNotificationStyle = () => {
        switch (notification.type) {
            case 'achievement':
                return { icon: '🏆', borderColor: 'border-yellow-400' };
            case 'trophy':
                return { icon: '🏅', borderColor: 'border-blue-400' };
            case 'event':
                 return { icon: '⚡', borderColor: 'border-purple-400' };
            default:
                return { icon: 'ℹ️', borderColor: 'border-gray-400' };
        }
    };

    const { icon, borderColor } = getNotificationStyle();

    // Set a timer to start the exit animation before the notification is dismissed
    useEffect(() => {
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, NOTIFICATION_DURATION - ANIMATION_DURATION);

        return () => clearTimeout(exitTimer);
    }, []);

    // Set a timer to call the onDismiss prop after the exit animation has finished
    useEffect(() => {
        if (isExiting) {
            const dismissTimer = setTimeout(onDismiss, ANIMATION_DURATION);
            return () => clearTimeout(dismissTimer);
        }
    }, [isExiting, onDismiss]);

    return (
        <div className={`
            w-80 bg-surface rounded-lg shadow-2xl flex items-center p-3 border-l-4 ${borderColor}
            pointer-events-auto
            ${isExiting ? 'animate-notification-exit' : 'animate-notification-enter'}
        `}>
            <div className="text-3xl mr-3">{icon}</div>
            <div>
                <h3 className="font-bold text-sm text-primary">{notification.title}</h3>
                <p className="text-xs text-secondary">{notification.description}</p>
            </div>
        </div>
    );
};

export default NotificationPopup;