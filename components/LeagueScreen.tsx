import React, { useState } from 'react';

interface LeagueScreenProps {
  onCreateLeague: (leagueName: string) => void;
  onJoinLeague: (leagueId: string) => void;
}

const LeagueScreen: React.FC<LeagueScreenProps> = ({ onCreateLeague, onJoinLeague }) => {
  const [newLeagueName, setNewLeagueName] = useState('');
  const [joinLeagueId, setJoinLeagueId] = useState('');

  const handleCreate = () => {
    if (newLeagueName.trim()) {
      onCreateLeague(newLeagueName.trim());
    }
  };

  const handleJoin = () => {
    if (joinLeagueId.trim()) {
      onJoinLeague(joinLeagueId.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <div className="p-8 bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Leagues</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Create a New League</h2>
          <div className="flex">
            <input
              type="text"
              value={newLeagueName}
              onChange={(e) => setNewLeagueName(e.target.value)}
              placeholder="Enter league name"
              className="flex-grow p-2 rounded-l-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md"
            >
              Create
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Join an Existing League</h2>
          <div className="flex">
            <input
              type="text"
              value={joinLeagueId}
              onChange={(e) => setJoinLeagueId(e.target.value)}
              placeholder="Enter league ID"
              className="flex-grow p-2 rounded-l-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleJoin}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-r-md"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueScreen;
