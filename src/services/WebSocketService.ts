import { GameState } from '../multiplayerTypes';

type MessageType = 'GAME_STATE_UPDATE' | 'NEW_CHAT_MESSAGE' | 'CLIENT_ID_ASSIGNED' | 'ERROR';

interface Message {
    type: MessageType;
    payload: any;
}

type MessageCallback = (payload: any) => void;

class WebSocketService {
    private socket: WebSocket | null = null;
    private listeners: { [key in MessageType]?: MessageCallback[] } = {};
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private reconnectInterval = 3000; // 3 seconds

    public connect(): void {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${window.location.host}`;
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0; // Reset on successful connection
        };

        this.socket.onmessage = (event) => {
            try {
                const message: Message = JSON.parse(event.data);
                if (this.listeners[message.type]) {
                    this.listeners[message.type]?.forEach(cb => cb(message.payload));
                }
            } catch (error) {
                console.error('Failed to parse message:', event.data, error);
            }
        };

        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
            this.handleReconnect();
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.socket?.close(); // This will trigger onclose and the reconnect logic
        };
    }

    private handleReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.connect(), this.reconnectInterval);
        } else {
            console.error('Max reconnect attempts reached. Could not connect to WebSocket.');
        }
    }

    public on(type: MessageType, callback: MessageCallback): void {
        if (!this.listeners[type]) {
            this.listeners[type] = [];
        }
        this.listeners[type]?.push(callback);
    }

    public off(type: MessageType, callback: MessageCallback): void {
        if (this.listeners[type]) {
            this.listeners[type] = this.listeners[type]?.filter(cb => cb !== callback);
        }
    }

    public send(type: string, payload: any): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ type, payload });
            this.socket.send(message);
        } else {
            console.error('Cannot send message, WebSocket is not open.');
            // Optionally queue the message to send on reconnect
        }
    }

    public isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }
}

// Export a singleton instance
export const webSocketService = new WebSocketService();
