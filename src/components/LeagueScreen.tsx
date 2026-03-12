import React, { useState } from 'react';

interface LeagueScreenProps {
    onLeagueCreate: () => void;
    onLeagueJoin: (leagueId: string) => void;
}

const LeagueScreen: React.FC<LeagueScreenProps> = ({ onLeagueCreate, onLeagueJoin }) => {
    const [leagueId, setLeagueId] = useState('');

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Create or Join a League</h1>
                <div className="mb-4">
                    <button
                        onClick={onLeagueCreate}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        Create New League
                    </button>
                </div>
                <div className="flex items-center my-6">
                    <hr className="flex-grow border-t border-gray-300" />
                    <span className="mx-4 text-gray-500">OR</span>
                    <hr className="flex-grow border-t border-gray-300" />
                </div>
                <div className="mb-4">
                    <input
                        type="text"
                        value={leagueId}
                        onChange={(e) => setLeagueId(e.target.value.toUpperCase())}
                        placeholder="Enter League ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <button
                        onClick={() => onLeagueJoin(leagueId)}
                        disabled={!leagueId}
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-gray-400"
                    >
                        Join League
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeagueScreen;
