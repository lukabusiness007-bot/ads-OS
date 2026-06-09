import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Set Prisma schema path for ts-node
process.env.PRISMA_SCHEMA_PATH = path.join( __dirname, '..', 'prisma', 'schema.prisma');

import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import serviceRoutes from './routes/serviceRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import paymentRoutes from './routes/paymentRoutes';
import reportRoutes from './routes/reportRoutes';

dotenv.config();

// Debug: Log environment variables
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

const app: Express = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  const msg = `[REQUEST] ${req.method} ${req.path}\n`;
  process.stdout.write(msg);
  console.log('Body:', req.body);
  next();
});
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
});
