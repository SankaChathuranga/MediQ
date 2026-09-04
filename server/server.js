require('dotenv').config();
const express = require('express');
const cors = require('cors');

const medicinesRouter = require('./routes/medicines');
const stockRouter = require('./routes/stock');
const pharmaciesRouter = require('./routes/pharmacies');
const requestsRouter = require('./routes/requests');

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// ─── Module Routes ─────────────────────────────────────────────────────────────
app.use('/api/medicines', medicinesRouter);
app.use('/api/stock', stockRouter);
app.use('/api/pharmacies', pharmaciesRouter);
app.use('/api/requests', requestsRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: { message: 'Route not found' } });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: { message: 'Internal server error' } });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MediQueue server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
