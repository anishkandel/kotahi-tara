require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const poolRoutes = require('./routes/poolRoutes');
const contributionRoutes = require('./routes/contributionRoutes');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Kotahi Tāra API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/contributions', contributionRoutes);

//  404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));