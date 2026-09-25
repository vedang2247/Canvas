require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const canvasRouter = require('./routes/canvases');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Support multiple allowed origins (comma-separated in CLIENT_ORIGIN)
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());

// Health check — used by Render to verify the service is running
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

// Routes
app.use('/api/canvases', apiLimiter, canvasRouter);

// Error Handler (must be last)
app.use(errorHandler);

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
