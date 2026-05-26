require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const poolRoutes = require('./routes/poolRoutes');
const contributionRoutes = require('./routes/contributionRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const startupRoutes = require('./routes/startupRoutes');
// ADD with other requires
const notificationRoutes = require('./routes/notificationRoutes');

// ADD with other routes

const app = express();
connectDB();

//  1. CORS first
app.use(cors({
  origin: 'https://kotahi-tara.vercel.app',
  credentials: true
}));

//  2. Webhook MUST come before express.json() — it needs raw bytes
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

//  3. JSON body parsing for everything else
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  4. Routes — registered once, in one place
app.get('/', (req, res) => {
  res.json({ message: 'Kotahi Tāra API is running', version: '1.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/campaigns', campaignRoutes); // only once
app.use('/api/startups', startupRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
