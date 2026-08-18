const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const httpServer = http.createServer(app);
const port = process.env.PORT || 3000;

const allowedOrigins = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('该来源不允许访问'));
  }
}));
app.use(express.json({ limit: '8mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/diaries', require('./routes/diary'));
app.use('/api/moods', require('./routes/mood'));
app.use('/api/checkins', require('./routes/checkin'));
app.use('/api/wishes', require('./routes/wish'));
app.use('/api/anniversaries', require('./routes/anniversary'));
app.use('/api/photos', require('./routes/photo'));
app.use('/api/plans', require('./routes/plan'));
app.use('/api/locations', require('./routes/location'));
app.use('/api/calm-mode', require('./routes/calmMode'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/calls', require('./routes/call'));
app.use('/api/sharing', require('./routes/sharing'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '恋爱日记后端服务运行正常' });
});

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : '*',
    credentials: true
  },
  transports: ['websocket', 'polling']
});
require('./services/callSignaling').setupCallSignaling(io);

httpServer.listen(port, () => {
  console.log(`❤️ 恋爱日记后端服务已启动，运行在 http://localhost:${port}`);
});

app.use((error, req, res, next) => {
  if (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || '服务器错误' });
  }
  return next();
});
