import { io } from 'socket.io-client';

const [, , auctionId, token] = process.argv;

if (!auctionId) {
  console.error('Usage: npm run socket:smoke -- <auction-id> [jwt]');
  process.exit(1);
}

const socket = io('http://localhost:3000', {
  auth: token ? { token } : undefined,
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log(`connected ${socket.id}`);
  socket.emit('auction.join', { auctionId });
});

socket.on('connect_error', (error) => {
  console.error('connect_error', error.message);
});

socket.on('auth.failed', () => {
  console.error('auth failed');
});

socket.on('auction.joined', (payload) => {
  console.log('auction.joined', payload);
});

socket.on('auction.created', (payload) => {
  console.log('auction.created', payload);
});

socket.on('auction.bid_placed', (payload) => {
  console.log('auction.bid_placed', payload);
});

socket.on('auction.outbid', (payload) => {
  console.log('auction.outbid', payload);
});

socket.on('auction.closed', (payload) => {
  console.log('auction.closed', payload);
});

socket.on('auction.cancelled', (payload) => {
  console.log('auction.cancelled', payload);
});
