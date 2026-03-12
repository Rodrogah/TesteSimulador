import { Player } from '../types';

const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
const socket = new WebSocket(`${protocol}//${host}`);

socket.onopen = () => {
  console.log('WebSocket connection established');
};

socket.onmessage = (event) => {
  console.log('Message from server: ', event.data);
};

socket.onclose = () => {
  console.log('WebSocket connection closed');
};

export const sendPlayerUpdate = (player: Player) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'player_update', payload: player }));
  }
};

export default socket;
