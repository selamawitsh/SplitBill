import http from 'http';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import dotenv from 'dotenv';
import { initializeSocket } from './src/socket/socket.js';

dotenv.config();
const PORT = process.env.PORT || 5000;

// Create HTTP server from app
const server = http.createServer(app);

//Initialize Socket.io with the server BEFORE starting it
const io = initializeSocket(server);

// Make io available in routes via app.locals
app.locals.io = io;

// Connect to database
connectDB();

// Start the server (not app.listen!)
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.io endpoint: http://localhost:${PORT}/socket.io/`);
  console.log(`Available routes:`);
  console.log(`   - GET  /api/test`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET  /api/auth/me`);
  console.log(`   - GET  /api/groups`);
  console.log(`   - POST /api/groups`);
  console.log(`   - POST /api/expenses`);
  console.log(`   - POST /api/settlements`);
  console.log(`   - GET  /api/notifications`);
});
