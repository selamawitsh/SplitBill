import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import {protect} from './middleware/auth.middleware.js';
import groupRoutes from './routes/group.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import balanceRoutes from './routes/balance.routes.js';
import settlementRoutes from './routes/settlement.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);  
app.use('/api/balances', balanceRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/notifications', notificationRoutes);


app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.get('/api/protected', protect, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});


export default app;