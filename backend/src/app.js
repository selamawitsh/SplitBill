import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import {protect} from './middleware/auth.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.get('/api/protected', protect, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

export default app;