import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth.js';
import crudRouter from './routes/crud.js';
import { readTable, writeTable } from './db.js';

dotenv.config();

const app = express();

// Apply secure HTTP headers and allow cross-origin resource access
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Apply global rate limiting (max 300 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' }
});
app.use(globalLimiter);
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim().replace(/\/$/, '')) 
  : [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const normOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.length === 0 || 
                      allowedOrigins.includes(normOrigin) || 
                      normOrigin.endsWith('vercel.app') || 
                      normOrigin.startsWith('http://localhost') || 
                      normOrigin.startsWith('http://127.0.0.1') || 
                      process.env.NODE_ENV !== 'production';

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  }
}));
app.use(express.json({ limit: '12mb' }));
app.use(express.static('public'));

// Pre-seed tables with basic structures if missing
readTable('projects', []);
readTable('testimonials', []);
readTable('articles', []);
readTable('messages', []);
readTable('media', []);
readTable('settings', {
  agencyName: 'Manju Web Agency',
  supportEmail: 'manjuwbagency@gmail.com',
  showPromotionBanner: true,
  promoText: 'Top 1% Bespoke SaaS Development Partner'
});

// Register routes
app.use('/api/auth', authRouter);
app.use('/api', crudRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`>>> [SERVER] Enterprise Node API active on http://localhost:${PORT}`);
});
