require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transferRoutes = require('./routes/transfers');
const billRoutes = require('./routes/bills');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL, // set this to your Vercel URL in Railway
].filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json()); // Parse incoming JSON request bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/bills', billRoutes);

// Health check — visit http://localhost:3001 to confirm the server is running
app.get('/', (req, res) => {
  res.json({ message: 'Banking API is running.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
