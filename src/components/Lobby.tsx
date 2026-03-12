import React from 'react';
import { useGame } from '../context/GameContext';
import { StatusBar } from './StatusBar';

const PlayerSetup: React.FC = () => {
    const { clientId, gameState, actions } = useGame();
    const player = clientId ? gameState.players[clientId] : null;
    const [name, setName] = React.useState('');

    React.useEffect(() => {
        if (player?.name) {
            setName(player.name);
        }
    }, [player?.name]);

    const handleUpdateName = () => {
        if (name.trim()) {
            actions.updatePlayer({ name });
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-white">Player Setup</h2>
            <div className="flex items-center gap-4">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-slate-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-grow"
                />
                <button
                    onClick={handleUpdateName}
                    disabled={!name.trim() || name === player?.name}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    Set Name
                </button>
            </div>
            {player?.name && <p className="mt-3 text-sm text-slate-400">Current Name: <span className='font-bold'>{player.name}</span></p>}
        </div>
    );
};

const LeagueCreation: React.FC = () => {
    const { actions } = useGame();
    const [leagueName, setLeagueName] = React.useState('');

    const handleCreateLeague = () => {
        if (leagueName.trim()) {
            actions.createLeague(leagueName);
            setLeagueName('');
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-md mx-auto mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">Create a League</h2>
            <div className="flex items-center gap-4">
                <input
                    type="text"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    placeholder="Enter league name"
                    className="bg-slate-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-grow"
                />
                <button
                    onClick={handleCreateLeague}
                    disabled={!leagueName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    Create
                </button>
            </div>
        </div>
    );
};

const LeagueList: React.FC = () => {
    const { gameState } = useGame();
    const leagues = Object.values(gameState.leagues);

    if (leagues.length === 0) {
        return (
            <div className="text-center text-slate-500 mt-8">
                <p>No leagues available. Why not create one?</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-white">Available Leagues</h2>
            <ul className="space-y-3">
                {leagues.map(league => (
                    <li key={league.id} className="bg-slate-700 p-4 rounded-md flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">{league.name}</h3>
                            <p className="text-sm text-slate-400">Commissioner: {gameState.players[league.commissionerId]?.name || 'Unknown'}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold">{league.players.length} / 12</p>
                            <p className="text-xs text-slate-400">Players</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export const Lobby: React.FC = () => {
    const { error } = useGame();

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans">
            <header className="bg-slate-800/50 backdrop-blur-sm p-4 sticky top-0 border-b border-slate-700 z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-tight text-white">Fantasy MMORPG Manager</h1>
                    <StatusBar />
                </div>
            </header>
            <main className="p-4 md:p-8 max-w-7xl mx-auto">
                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                <PlayerSetup />

                <div className="mt-8">
                    <LeagueCreation />
                    <LeagueList />
                </div>
            </main>
        </div>
    );
};
