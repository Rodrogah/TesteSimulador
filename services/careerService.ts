import { Player, User } from '../types';
import { getCurrentUser } from './authService';

const getCareersKey = (userId: string) => `nba_careers_${userId}`;

export const getCareersForUser = (userId: string): Player[] => {
    try {
        const careersJson = localStorage.getItem(getCareersKey(userId));
        return careersJson ? JSON.parse(careersJson) : [];
    } catch (error) {
        console.error("Failed to parse careers from localStorage", error);
        return [];
    }
};

export const saveCareer = async (player: Player): Promise<void> => {
    const user = await getCurrentUser();
    if (!user) {
        console.error("Cannot save career: no user logged in.");
        return;
    }

    if (!player.careerId) {
        console.error("Cannot save a career without a careerId.");
        return;
    }
    
    const careers = getCareersForUser(user.id);
    const existingIndex = careers.findIndex(c => c.careerId === player.careerId);

    const playerWithTimestamp = { ...player, lastUpdated: Date.now() };

    if (existingIndex > -1) {
        careers[existingIndex] = playerWithTimestamp;
    } else {
        careers.push(playerWithTimestamp);
    }
    localStorage.setItem(getCareersKey(user.id), JSON.stringify(careers));
};

export const deleteCareer = (userId: string, careerId: string): void => {
    const careers = getCareersForUser(userId);
    const updatedCareers = careers.filter(c => c.careerId !== careerId);
    localStorage.setItem(getCareersKey(userId), JSON.stringify(updatedCareers));
};

export const loadCareer = async (userId: string): Promise<Player | null> => {
    const careers = getCareersForUser(userId);
    if (careers.length === 0) return null;
    return careers.sort((a, b) => b.lastUpdated - a.lastUpdated)[0];
};
