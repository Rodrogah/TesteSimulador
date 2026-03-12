import React, { useState, useEffect } from 'react';
import { User, Player } from '../types';
import * as careerService from '../services/careerService';
import { TEAMS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';

interface UserDashboardProps {
    user: User;
    onLoadCareer: (player: Player) => void;
    onCreateNew: () => void;
    onLogout: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onLoadCareer, onCreateNew, onLogout }) => {
    const { t } = useTranslations();
    const [careers, setCareers] = useState<Player[]>([]);

    useEffect(() => {
        setCareers(careerService.getCareersForUser(user.id));
    }, [user.id]);
    
    const handleDelete = (e: React.MouseEvent, careerId: string) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this career? This action cannot be undone.")) {
            careerService.deleteCareer(user.id, careerId);
            setCareers(careers.filter(c => c.careerId !== careerId));
        }
    };

    const sortedCareers = [...careers].sort((a, b) => b.lastUpdated - a.lastUpdated);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold">My Careers</h1>
                    <p className="text-secondary">Welcome back, {user.email}</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={onLogout} className="bg-nba-red/80 hover:bg-nba-red font-semibold py-2 px-4 rounded-lg transition-colors">
                        Log Out
                    </button>
                </div>
            </header>
            
            <div className="space-y-4">
                <button 
                    onClick={onCreateNew}
                    className="w-full bg-surface p-6 rounded-xl shadow-lg border-2 border-dashed border-white/20 hover:border-nba-blue hover:bg-nba-blue/10 transition-all text-center group"
                >
                    <span className="text-5xl group-hover:scale-110 transition-transform inline-block">🏀</span>
                    <h2 className="text-2xl font-bold mt-2 text-primary">Create New Career</h2>
                    <p className="text-secondary">Start a new journey to NBA stardom.</p>
                </button>
                {sortedCareers.map(career => {
                    const team = TEAMS[career.team];
                    return (
                        <div key={career.careerId} onClick={() => onLoadCareer(career)} className="bg-surface p-4 rounded-xl shadow-lg border border-white/10 hover:border-nba-blue hover:bg-surface/80 transition-all cursor-pointer flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {team && <img src={team.logo} alt={team.name} className="w-16 h-16" />}
                                <div>
                                    <h3 className="text-xl font-bold">{career.name}</h3>
                                    <p className="text-secondary text-sm">
                                        {career.position} | OVR: {career.overall} | Season: {career.currentSeason}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Last Played: {new Date(career.lastUpdated).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                             <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => handleDelete(e, career.careerId)}
                                    className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white font-bold p-2 rounded-full transition-colors w-10 h-10 flex items-center justify-center"
                                    aria-label="Delete career"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                                <button className="bg-nba-blue text-white font-bold py-2 px-6 rounded-lg">
                                    Load
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UserDashboard;
