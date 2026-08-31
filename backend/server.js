require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const { initSocket } = require('./services/socket.service');
const errorHandler = require('./middleware/errorHandler.middleware');

const authRoutes = require('./routes/auth.routes');
const requirementRoutes = require('./routes/requirement.routes');
const deploymentRoutes = require('./routes/deployment.routes');
const monitoringRoutes = require('./routes/monitoring.routes');
const aiRoutes = require('./routes/ai.routes');
const recoveryRoutes = require('./routes/recovery.routes');
const serviceRoutes = require('./routes/service.routes');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Core middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'AI-Driven DevOps Platform API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/recovery', recoveryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Central error handler (always last)
app.use(errorHandler);

// Socket.IO for real-time dashboard updates
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

