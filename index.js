const express = require('express');
const http = require('http');
const { Server } = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new Server({ server });
const websocketController = require('./controllers/websocketController');

// Serve static files (if needed)
app.use(express.static(path.join(__dirname, 'public')));

// Example API route
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Initialize WebSocket handlers
wss.on('connection', websocketController.handleConnection);

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
