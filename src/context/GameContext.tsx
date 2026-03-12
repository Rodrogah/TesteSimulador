import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GameState, Player, League, ChatMessage } from '../types';
import { webSocketService } from '../services/WebSocketService';

interface GameContextType {
    gameState: GameState;
    clientId: string | null;
    error: string | null;
    isConnected: boolean;
    actions: {
        updatePlayer: (player: Partial<Player>) => void;
        createLeague: (leagueName: string) => void;
        joinLeague: (leagueId: string) => void;
        sendChatMessage: (message: string) => void;
    };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = (): GameContextType => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};

interface GameProviderProps {
    children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
    const [gameState, setGameState] = useState<GameState>({ players: {}, leagues: {} });
    const [clientId, setClientId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        webSocketService.connect();

        const handleGameStateUpdate = (newGameState: GameState) => {
            setGameState(newGameState);
        };

        const handleClientIdAssigned = (payload: { clientId: string }) => {
            setClientId(payload.clientId);
        };

        const handleError = (errorMessage: string) => {
            setError(errorMessage);
            setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
        };
        
        const checkConnectionStatus = () => {
            setIsConnected(webSocketService.isConnected());
        };

        webSocketService.on('GAME_STATE_UPDATE', handleGameStateUpdate);
        webSocketService.on('CLIENT_ID_ASSIGNED', handleClientIdAssigned);
        webSocketService.on('ERROR', handleError);
        const connectionInterval = setInterval(checkConnectionStatus, 1000);

        return () => {
            webSocketService.off('GAME_STATE_UPDATE', handleGameStateUpdate);
            webSocketService.off('CLIENT_ID_ASSIGNED', handleClientIdAssigned);
            webSocketService.off('ERROR', handleError);
            clearInterval(connectionInterval);
        };
    }, []);

    const actions = {
        updatePlayer: (playerData: Partial<Player>) => {
            if (!clientId) {
                setError('Cannot update player: client ID not assigned.');
                return;
            }
            const player: Player = { ...gameState.players[clientId], ...playerData, id: clientId };
            webSocketService.send('UPDATE_PLAYER_DATA', { player });
        },
        joinLeague: (leagueId: string) => {
            if (!clientId) {
                setError('Cannot join league: client ID not assigned.');
                return;
            }
            webSocketService.send('JOIN_LEAGUE', { leagueId, clientId });
        },
        createLeague: (leagueName: string) => {
            if (!clientId) {
                setError('Cannot create league: client ID not assigned.');
                return;
            }
            webSocketService.send('CREATE_LEAGUE', { leagueName, commissionerId: clientId });
        },
        sendChatMessage: (messageText: string) => {
             if (!clientId || !gameState.players[clientId]) {
                setError('Cannot send message: player not fully initialized.');
                return;
            }
            const message: ChatMessage = {
                id: new Date().toISOString(), // Temporary ID, server could generate a real one
                senderId: clientId,
                senderName: gameState.players[clientId].name || 'Anonymous',
                message: messageText,
                timestamp: Date.now(),
            };
            webSocketService.send('SEND_CHAT_MESSAGE', { message });
        },
    };

    const value = { gameState, clientId, error, isConnected, actions };

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
