import React from 'react';
import { useGame } from '../context/GameContext';

export const StatusBar: React.FC = () => {
    const { isConnected, clientId } = useGame();

    return (
        <div className="flex items-center gap-4 text-sm">
            <div className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            {clientId && (
                <div className="text-slate-400">
                    <span className="font-mono bg-slate-700/50 px-2 py-1 rounded-md text-xs">{clientId}</span>
                </div>
            )}
        </div>
    );
};
