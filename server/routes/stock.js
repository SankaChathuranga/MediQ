/**
 * routes/stock.js — Pharmacy Stock module
 * Owner: Member 2
 *
 * All routes return the CLAUDE.md §6 response shape:
 *   Success: { success: true, data: { ... } }
 *   Error:   { success: false, error: { message, field? } }
 *
 * Stub routes — replace the 501 stubs with real Prisma queries.
 * Import the validate middleware for POST/PUT:
 *   const { validate } = require('../middleware/validate');
 */

const express = require('express');
const router = express.Router();
// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

// GET /api/stock — list all stock entries (with optional filter by pharmacy/medicine/area)
router.get('/', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 2 to implement' } });
});

// GET /api/stock/:id — get a single stock entry
router.get('/:id', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 2 to implement' } });
});

// POST /api/stock — create a new stock entry
router.post('/', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 2 to implement' } });
});

// PUT /api/stock/:id — update a stock entry (quantity, price, etc.)
router.put('/:id', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 2 to implement' } });
});

// DELETE /api/stock/:id — delete a stock entry
router.delete('/:id', async (req, res) => {
  res.status(501).json({ success: false, error: { message: 'Not implemented yet — Member 2 to implement' } });
});

module.exports = router;
