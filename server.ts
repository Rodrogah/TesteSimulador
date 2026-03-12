import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { GameState, Player, League, ChatMessage } from './src/multiplayerTypes';
import { createServer as createViteServer } from 'vite';

interface WebSocketWithId extends WebSocket {
    id: string;
}

const clients: { [id: string]: WebSocketWithId } = {};

const gameState: GameState = {
    players: {},
    leagues: {},
};

// --- Handler Functions ---

function handleConnection(ws: WebSocketWithId) {
    ws.id = uuidv4();
    clients[ws.id] = ws;
    console.log(`Client ${ws.id} connected`);

    // Send the new client their ID
    ws.send(JSON.stringify({ type: 'CLIENT_ID_ASSIGNED', payload: { clientId: ws.id } }));

    // Inform the new client of the current game state
    ws.send(JSON.stringify({ type: 'GAME_STATE_UPDATE', payload: gameState }));
}

function handlePlayerUpdate(ws: WebSocketWithId, player: Player) {
    // Basic validation
    if (!player.name) {
        ws.send(JSON.stringify({ type: 'ERROR', payload: 'Player name cannot be empty.' }));
        return;
    }
    gameState.players[player.id] = { ...gameState.players[player.id], ...player };
    broadcast({ type: 'GAME_STATE_UPDATE', payload: gameState });
}

function handleCreateLeague(ws: WebSocketWithId, data: { leagueName: string, commissionerId: string }) {
    const leagueId = uuidv4();
    const newLeague: League = {
        id: leagueId,
        name: data.leagueName,
        commissionerId: data.commissionerId,
        players: [data.commissionerId], // Add the commissioner as the first player
        teams: [],
        schedule: [],
        standings: {},
    };
    gameState.leagues[leagueId] = newLeague;
    broadcast({ type: 'GAME_STATE_UPDATE', payload: gameState });
}

function handleChatMessage(ws: WebSocketWithId, message: ChatMessage) {
    // For now, broadcast chat messages to everyone. 
    // Later, this could be scoped to leagues or teams.
    broadcast({ type: 'NEW_CHAT_MESSAGE', payload: message });
}

function handleDisconnect(ws: WebSocketWithId) {
    console.log(`Client ${ws.id} disconnected`);
    delete clients[ws.id];
    // We might not want to delete the player from the game state immediately.
    // They might just be reconnecting.
    // For now, we'll leave them in gameState.players
}

function handleMessage(ws: WebSocketWithId, message: string) {
    try {
        const data = JSON.parse(message);
        console.log(`Received message from ${ws.id}:`, data.type);

        switch (data.type) {
            case 'UPDATE_PLAYER_DATA':
                handlePlayerUpdate(ws, data.payload.player);
                break;
            case 'CREATE_LEAGUE':
                handleCreateLeague(ws, data.payload);
                break;
            case 'SEND_CHAT_MESSAGE':
                handleChatMessage(ws, data.payload.message);
                break;
            default:
                console.warn(`Unknown message type: ${data.type}`);
                ws.send(JSON.stringify({ type: 'ERROR', payload: `Unknown message type: ${data.type}` }));
        }
    } catch (error) {
        console.error(`Failed to parse message from ${ws.id}:`, message, error);
        ws.send(JSON.stringify({ type: 'ERROR', payload: 'Invalid message format.' }));
    }
}

// --- Broadcast Function ---

function broadcast(data: any) {
    const message = JSON.stringify(data);
    for (const id in clients) {
        const client = clients[id];
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

// --- Server Setup ---

async function startServer() {
    const app = express();
    const server = createServer(app);
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocket) => {
        const wsWithId = ws as WebSocketWithId;
        handleConnection(wsWithId);
        ws.on('message', (message: string) => handleMessage(wsWithId, message));
        ws.on('close', () => handleDisconnect(wsWithId));
        ws.on('error', (error) => console.error(`WebSocket error for client ${wsWithId.id}:`, error));
    });

    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        const path = await import('path');
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    const PORT = 3000;
    server.listen(PORT, () => {
        console.log(`Server is listening on http://localhost:${PORT}`);
    });
}

startServer();
